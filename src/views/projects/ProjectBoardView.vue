<script setup lang="ts">
import { _Auth, FieldColorTag, FieldTiptap, toast, useChangeHeader, useStoreWatch, type ColorTag } from 'cic-kit';
import { computed, reactive, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import { TaskStatus, TASK_STATUSES, type TaskStatusType } from '@shared/enums/TaskStatus';
import AppCard from '../../components/ui/AppCard.vue';
import ModalCmp from '../../components/ui/ModalCmp.vue';
import { callCreateProjectTaskBranch, callDeleteProjectTaskBranch } from '../../call/callProjectBranch';
import { projectStore } from '../../stores/projectStore';
import { projectTagStore } from '../../stores/projectTagStore';
import { projectTaskStore } from '../../stores/projectTaskStore';

useChangeHeader('Project Board', { name: 'project-dashboard' });
useStoreWatch([{ store: projectStore }]);

const route = useRoute();
const router = useRouter();
const projectId = computed(() => String(route.params.projectId ?? '').trim());

const project = computed(() => {
  if (!projectId.value) return undefined;
  return projectStore.items?.[projectId.value];
});

const isTaskSaving = ref(false);
const isBranchLoading = ref(false);

const columnState = reactive<Record<TaskStatusType, { hidden: boolean; width: number }>>({
  [TaskStatus.TODO]: { hidden: false, width: 300 },
  [TaskStatus.DOING]: { hidden: false, width: 360 },
  [TaskStatus.BLOCKED]: { hidden: false, width: 300 },
  [TaskStatus.BUG]: { hidden: false, width: 300 },
  [TaskStatus.DONE]: { hidden: false, width: 280 },
});

const taskModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  taskId: '',
  title: '',
  description: '<p></p>',
  status: TaskStatus.TODO as TaskStatusType,
  tag: [] as ColorTag[],
});

const selectedTaskDoc = computed(() => {
  if (!taskModal.taskId) return undefined;
  return projectTaskStore.items?.[taskModal.taskId];
});

const projectTasks = computed(() => {
  if (!projectId.value) return [];
  return projectTaskStore.forProject(projectId.value);
});

const tagsSuggestions = computed(() => {
  if (!projectId.value) return [];
  return projectTagStore.forProjectAsColorTags(projectId.value);
});

const visibleStatuses = computed(() =>
  TASK_STATUSES.filter((status) => !columnState[status].hidden),
);

const groupedTasks = computed(() => {
  const base: Record<TaskStatusType, typeof projectTasks.value> = {
    [TaskStatus.TODO]: [],
    [TaskStatus.DOING]: [],
    [TaskStatus.BLOCKED]: [],
    [TaskStatus.BUG]: [],
    [TaskStatus.DONE]: [],
  };

  for (const task of projectTasks.value) {
    base[task.status].push(task);
  }

  for (const status of TASK_STATUSES) {
    base[status] = [...base[status]].sort((a, b) => {
      const aTime = readTime(a.updatedAt) || readTime(a.createdAt);
      const bTime = readTime(b.updatedAt) || readTime(b.createdAt);
      return bTime - aTime;
    });
  }

  return base;
});

watch(
  projectId,
  async (id) => {
    projectTaskStore.stop();
    projectTagStore.stop();

    if (!id) return;

    const loadedProject = project.value ?? (await projectStore.getOne(id));
    if (!loadedProject) {
      toast.error('Progetto non trovato.');
      await router.replace({ name: 'project-dashboard' });
      return;
    }

    await Promise.all([projectTaskStore.startForProject(id), projectTagStore.startForProject(id)]);
  },
  { immediate: true },
);

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

function openCreateTask(status: TaskStatusType) {
  taskModal.open = true;
  taskModal.mode = 'create';
  taskModal.taskId = '';
  taskModal.title = '';
  taskModal.description = '<p></p>';
  taskModal.status = status;
  taskModal.tag = [];
}

function openTaskDetail(taskId: string) {
  const task = projectTaskStore.items?.[taskId];
  if (!task) return;

  taskModal.open = true;
  taskModal.mode = 'edit';
  taskModal.taskId = task.id;
  taskModal.title = task.title;
  taskModal.description = task.description || '<p></p>';
  taskModal.status = task.status;
  taskModal.tag = task.tag ?? [];
}

function closeTaskModal() {
  taskModal.open = false;
}

async function saveTask() {
  if (!projectId.value) return;

  const title = taskModal.title.trim();
  if (!title) {
    toast.warning('Inserisci il titolo task.');
    return;
  }

  isTaskSaving.value = true;

  try {
    if (taskModal.mode === 'edit' && selectedTaskDoc.value) {
      await selectedTaskDoc.value.update({
        title,
        description: taskModal.description,
        status: taskModal.status,
        tag: taskModal.tag,
        updateBy: getUpdater(),
      });

      await projectTagStore.upsertForProject(projectId.value, taskModal.tag, getUpdater());
      toast.success('Task aggiornata.');
      closeTaskModal();
      return;
    }

    const created = await projectTaskStore.add({
      projectId: projectId.value,
      title,
      description: taskModal.description,
      status: taskModal.status,
      tag: taskModal.tag,
      updateBy: getUpdater(),
    });

    await projectTagStore.upsertForProject(projectId.value, taskModal.tag, getUpdater());
    toast.success('Task creata.');
    openTaskDetail(created.id);
  } catch (error) {
    toast.error(readErrorMessage(error));
  } finally {
    isTaskSaving.value = false;
  }
}

async function deleteTask() {
  if (!selectedTaskDoc.value) return;

  const confirmed = window.confirm('Eliminare la task?');
  if (!confirmed) return;

  await projectTaskStore.delete(selectedTaskDoc.value.id);
  toast.success('Task eliminata.');
  closeTaskModal();
}

async function createBranchForTask() {
  if (!selectedTaskDoc.value || isBranchLoading.value) return;

  isBranchLoading.value = true;
  try {
    const response = await callCreateProjectTaskBranch({
      projectId: selectedTaskDoc.value.projectId,
      taskId: selectedTaskDoc.value.id,
    });
    toast.success(`${response.message} ${response.branchName}`.trim());
  } catch (error) {
    toast.error(readErrorMessage(error));
  } finally {
    isBranchLoading.value = false;
  }
}

async function deleteBranchForTask() {
  if (!selectedTaskDoc.value || isBranchLoading.value) return;

  const branchName = String(selectedTaskDoc.value.branchName ?? '').trim();
  if (!branchName) {
    toast.warning('Task senza branch associata.');
    return;
  }

  const confirmInput = window.prompt(`Scrivi "${branchName}" per confermare eliminazione branch.`);
  if (confirmInput == null || confirmInput.trim() !== branchName) {
    toast.warning('Conferma non valida. Operazione annullata.');
    return;
  }

  isBranchLoading.value = true;
  try {
    const response = await callDeleteProjectTaskBranch({
      projectId: selectedTaskDoc.value.projectId,
      taskId: selectedTaskDoc.value.id,
      branchName,
    });
    toast.success(response.message);
  } catch (error) {
    toast.error(readErrorMessage(error));
  } finally {
    isBranchLoading.value = false;
  }
}

function readTime(value: unknown) {
  if (!value) return 0;
  if (typeof value === 'object' && value && 'toMillis' in value && typeof value.toMillis === 'function') {
    return Number(value.toMillis());
  }

  if (value instanceof Date) return value.getTime();
  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function statusBadgeClass(status: TaskStatusType) {
  if (status === TaskStatus.DONE) return 'text-bg-success';
  if (status === TaskStatus.BLOCKED) return 'text-bg-warning';
  if (status === TaskStatus.BUG) return 'text-bg-danger';
  if (status === TaskStatus.DOING) return 'text-bg-primary';
  return 'text-bg-secondary';
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Errore non gestito.');
  }
  return 'Errore non gestito.';
}
</script>

<template>
  <div class="container-fluid pb-t overflow-auto h-100">
    <AppCard class="p-3 mb-3">
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-start">
        <div>
          <h1 class="h5 mb-1">Board - {{ project?.name || '...' }}</h1>
          <div class="small text-secondary">Colonne ridimensionabili, nascondibili e task editabili in modal.</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <RouterLink
            v-if="projectId"
            :to="{ name: 'project-messages', params: { projectId } }"
            class="btn btn-sm btn-outline-dark"
          >
            Messaggi
          </RouterLink>
          <RouterLink :to="{ name: 'project-dashboard' }" class="btn btn-sm btn-outline-secondary">Dashboard</RouterLink>
        </div>
      </div>
    </AppCard>

    <AppCard class="p-3 mb-3">
      <h2 class="h6 mb-2">Layout colonne</h2>
      <div class="row g-2">
        <div class="col-12 col-md-6 col-xl-4" v-for="status in TASK_STATUSES" :key="`layout-${status}`">
          <div class="border rounded p-2 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="badge" :class="statusBadgeClass(status)">{{ status }}</span>
              <label class="form-check-label small">
                <input class="form-check-input me-1" type="checkbox" :checked="!columnState[status].hidden" @change="columnState[status].hidden = !($event.target as HTMLInputElement).checked" />
                visibile
              </label>
            </div>
            <input
              class="form-range"
              type="range"
              min="240"
              max="640"
              step="20"
              v-model.number="columnState[status].width"
              :disabled="columnState[status].hidden"
            />
            <div class="small text-secondary">{{ columnState[status].width }}px</div>
          </div>
        </div>
      </div>
    </AppCard>

    <div class="board-columns">
      <AppCard
        v-for="status in visibleStatuses"
        :key="`column-${status}`"
        class="board-column p-2"
        :style="{ width: `${columnState[status].width}px` }"
      >
        <div class="d-flex justify-content-between align-items-center mb-2 px-1">
          <span class="badge" :class="statusBadgeClass(status)">{{ status }}</span>
          <button class="btn btn-sm btn-outline-primary" @click="openCreateTask(status)">+ Task</button>
        </div>

        <div class="d-flex flex-column gap-2">
          <button
            v-for="task in groupedTasks[status]"
            :key="task.id"
            class="task-tile btn btn-light border text-start"
            @click="openTaskDetail(task.id)"
          >
            <div class="fw-semibold">{{ task.title }}</div>
            <div class="small text-secondary" v-if="task.branchName"><code>{{ task.branchName }}</code></div>
            <div class="d-flex flex-wrap gap-1 mt-2" v-if="task.tag?.length">
              <span v-for="tag in task.tag" :key="`${task.id}-${tag.label}`" class="badge" :style="{ backgroundColor: tag.color }">
                {{ tag.label }}
              </span>
            </div>
          </button>
          <div v-if="!groupedTasks[status].length" class="small text-secondary px-1">Nessuna task.</div>
        </div>
      </AppCard>
    </div>

    <ModalCmp
      v-model="taskModal.open"
      :title="taskModal.mode === 'create' ? 'Nuova task' : 'Dettaglio task'"
      size="xl"
      centered
      scrollable
      cancel-text="Chiudi"
      ok-text="Salva"
      :on-ok="saveTask"
    >
      <Form class="d-flex flex-column gap-3">
        <div class="row g-2">
          <div class="col-12 col-lg-8">
            <label class="form-label small">Titolo</label>
            <input v-model="taskModal.title" class="form-control" placeholder="Implement authentication flow" />
          </div>
          <div class="col-12 col-lg-4">
            <label class="form-label small">Stato</label>
            <select v-model="taskModal.status" class="form-select">
              <option v-for="status in TASK_STATUSES" :key="`modal-status-${status}`" :value="status">{{ status }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label small">Tag</label>
          <FieldColorTag
            name="task_tags"
            v-model="taskModal.tag"
            :suggestions="tagsSuggestions"
            placeholder="Aggiungi tag condivisi (task/note/cmd)"
            :allow-duplicates="false"
          />
        </div>

        <div>
          <label class="form-label small">Descrizione</label>
          <FieldTiptap
            name="task_description"
            v-model="taskModal.description"
            placeholder="Dettagli tecnici, checklist, note operative..."
            :toolbar-sticky-on="'top'"
          />
        </div>

        <div class="border rounded p-3" v-if="taskModal.mode === 'edit'">
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <button class="btn btn-sm btn-outline-primary" :disabled="isBranchLoading || isTaskSaving" @click.prevent="createBranchForTask">
              Crea branch GitHub
            </button>
            <button
              class="btn btn-sm btn-outline-danger"
              :disabled="isBranchLoading || isTaskSaving || !selectedTaskDoc?.branchName"
              @click.prevent="deleteBranchForTask"
            >
              Elimina branch GitHub
            </button>
            <code v-if="selectedTaskDoc?.branchName">{{ selectedTaskDoc?.branchName }}</code>
            <span class="text-secondary small" v-else>Nessuna branch associata.</span>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center">
          <button
            class="btn btn-outline-danger"
            v-if="taskModal.mode === 'edit'"
            :disabled="isTaskSaving || isBranchLoading"
            @click.prevent="deleteTask"
          >
            Elimina task
          </button>
          <div class="small text-secondary ms-auto" v-if="isTaskSaving">Salvataggio in corso...</div>
        </div>
      </Form>
    </ModalCmp>
  </div>
</template>

<style scoped>
.board-columns {
  display: flex;
  gap: 0.85rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.board-column {
  flex: 0 0 auto;
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}

.task-tile {
  white-space: normal;
}
</style>
