<script setup lang="ts">
import {
  _Auth,
  Btn,
  FieldColorTag,
  FieldTiptap,
  Modal,
  toast,
  useChangeHeader,
  useHeaderExtra,
  useStoreWatch,
  type ColorTag,
} from 'cic-kit';
import { computed, reactive, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import draggable from 'vuedraggable';
import { useRoute, useRouter } from 'vue-router';
import { TaskStatus, TASK_STATUSES, type TaskStatusType } from '@shared/enums/TaskStatus';
import { projectStore } from '../../stores/projectStore';
import { projectTaskStore } from '../../stores/projectTaskStore';
import { tagStore } from '../../stores/tagStore';
import ProjectBoardHeaderExtra from './ProjectBoardHeaderExtra.vue';

type ColumnLayout = {
  status: TaskStatusType;
  hidden: boolean;
  width: number;
};

type TaskOrderMap = Record<TaskStatusType, string[]>;

function createDefaultLayout(): ColumnLayout[] {
  return [
    { status: TaskStatus.TODO, hidden: false, width: 320 },
    { status: TaskStatus.DOING, hidden: false, width: 360 },
    { status: TaskStatus.BLOCKED, hidden: false, width: 320 },
    { status: TaskStatus.BUG, hidden: false, width: 320 },
    { status: TaskStatus.DONE, hidden: false, width: 300 },
  ];
}

function createEmptyOrderMap(): TaskOrderMap {
  return {
    [TaskStatus.TODO]: [],
    [TaskStatus.DOING]: [],
    [TaskStatus.BLOCKED]: [],
    [TaskStatus.BUG]: [],
    [TaskStatus.DONE]: [],
  };
}

useChangeHeader('Project Board', { name: 'project-dashboard' });
useStoreWatch([{ store: projectStore }]);

const route = useRoute();
const router = useRouter();
const projectId = computed(() => String(route.params.projectId ?? '').trim());

const project = computed(() => (projectId.value ? projectStore.items?.[projectId.value] : undefined));

const isTaskSaving = ref(false);
const settingsOpen = ref(false);

const columnLayouts = ref<ColumnLayout[]>(createDefaultLayout());
const taskOrderMap = reactive<TaskOrderMap>(createEmptyOrderMap());

const taskLists = reactive<Record<string, any[]>>({
  [TaskStatus.TODO]: [],
  [TaskStatus.DOING]: [],
  [TaskStatus.BLOCKED]: [],
  [TaskStatus.BUG]: [],
  [TaskStatus.DONE]: [],
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

const selectedTaskDoc = computed(() => (taskModal.taskId ? projectTaskStore.items?.[taskModal.taskId] : undefined));
const projectTasks = computed(() => (projectId.value ? projectTaskStore.forProject(projectId.value) : []));
const tagsSuggestions = computed(() => tagStore.asColorTags());

const visibleColumns = computed<ColumnLayout[]>({
  get() {
    return columnLayouts.value.filter((column) => !column.hidden);
  },
  set(nextVisible) {
    const hidden = columnLayouts.value.filter((column) => column.hidden);
    columnLayouts.value = [...nextVisible, ...hidden];
  },
});

const layoutStorageKey = computed(() => `hubcortex:board-layout:${projectId.value || 'unknown'}`);
const taskOrderStorageKey = computed(() => `hubcortex:board-task-order:${projectId.value || 'unknown'}`);

watch(
  columnLayouts,
  () => {
    persistBoardLayout();
  },
  { deep: true }
);

watch(projectTasks, () => {
  syncTaskListsFromStore();
});

watch(
  projectId,
  async (id) => {
    projectTaskStore.stop();
    tagStore.stop();

    loadBoardLayout();
    loadTaskOrder();

    if (!id) return;

    const loadedProject = project.value ?? (await projectStore.getOne(id));
    if (!loadedProject) {
      toast.error('Progetto non trovato.');
      await router.replace({ name: 'project-dashboard' });
      return;
    }

    await Promise.all([projectTaskStore.startForProject(id), tagStore.start()]);
    syncTaskListsFromStore();
  },
  { immediate: true }
);

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

function getStatusLabel(status: TaskStatusType) {
  if (status === TaskStatus.TODO) return 'Todo';
  if (status === TaskStatus.DOING) return 'Doing';
  if (status === TaskStatus.BLOCKED) return 'Blocked';
  if (status === TaskStatus.BUG) return 'Bug';
  return 'Done';
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
      await tagStore.upsert(taskModal.tag, getUpdater());
      toast.success('Task aggiornata.');
      closeTaskModal();
      return;
    }

    await projectTaskStore.add({
      projectId: projectId.value,
      title,
      description: taskModal.description,
      status: taskModal.status,
      tag: taskModal.tag,
      updateBy: getUpdater(),
    });
    await tagStore.upsert(taskModal.tag, getUpdater());
    toast.success('Task creata.');
    closeTaskModal();
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

function onTaskDragChange(targetStatus: TaskStatusType, event: any) {
  void handleTaskDragChange(targetStatus, event);
}

function onTaskDragChangeForColumn(status: unknown, event: any) {
  const normalized = status as TaskStatusType;
  if (!TASK_STATUSES.includes(normalized)) return;
  onTaskDragChange(normalized, event);
}

async function handleTaskDragChange(targetStatus: TaskStatusType, event: any) {
  const addedTask = event?.added?.element;
  if (addedTask && addedTask.status !== targetStatus) {
    try {
      await addedTask.update({ status: targetStatus, updateBy: getUpdater() });
      toast.success(`Task spostata in ${getStatusLabel(targetStatus)}.`);
    } catch (error) {
      toast.error(readErrorMessage(error));
      syncTaskListsFromStore();
      return;
    }
  }

  refreshTaskOrderFromLists();
}

function syncTaskListsFromStore() {
  const grouped: Record<TaskStatusType, any[]> = {
    [TaskStatus.TODO]: [],
    [TaskStatus.DOING]: [],
    [TaskStatus.BLOCKED]: [],
    [TaskStatus.BUG]: [],
    [TaskStatus.DONE]: [],
  };

  for (const task of projectTasks.value) {
    grouped[task.status].push(task);
  }

  for (const status of TASK_STATUSES) {
    const order = taskOrderMap[status] || [];
    const indexMap = new Map(order.map((id, idx) => [id, idx]));

    grouped[status].sort((a, b) => {
      const ia = indexMap.get(a.id);
      const ib = indexMap.get(b.id);
      if (ia != null && ib != null) return ia - ib;
      if (ia != null) return -1;
      if (ib != null) return 1;
      return readTime(b.updatedAt || b.createdAt) - readTime(a.updatedAt || a.createdAt);
    });

    taskLists[status] = grouped[status];
  }
}

function getTaskList(status: unknown) {
  const key = String(status);
  if (!Array.isArray(taskLists[key])) {
    taskLists[key] = [];
  }
  return taskLists[key];
}

function refreshTaskOrderFromLists() {
  for (const status of TASK_STATUSES) {
    taskOrderMap[status] = getTaskList(status).map((task) => String(task.id));
  }
  persistTaskOrder();
}

function loadBoardLayout() {
  columnLayouts.value = createDefaultLayout();
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(layoutStorageKey.value);
    if (!raw) return;

    const parsed = JSON.parse(raw) as { columns?: Partial<ColumnLayout>[] };
    if (!parsed?.columns || !Array.isArray(parsed.columns)) return;

    const defaultMap = new Map(createDefaultLayout().map((item) => [item.status, item]));
    const normalized: ColumnLayout[] = [];

    for (const item of parsed.columns) {
      const status = String(item?.status ?? '') as TaskStatusType;
      if (!TASK_STATUSES.includes(status)) continue;
      const fallback = defaultMap.get(status);
      if (!fallback) continue;

      normalized.push({
        status,
        hidden: Boolean(item.hidden),
        width: normalizeWidth(item.width, fallback.width),
      });
      defaultMap.delete(status);
    }

    for (const missing of defaultMap.values()) {
      normalized.push({ ...missing });
    }

    if (normalized.length) {
      columnLayouts.value = normalized;
    }
  } catch {
    columnLayouts.value = createDefaultLayout();
  }
}

function persistBoardLayout() {
  if (typeof window === 'undefined') return;

  const payload = {
    columns: columnLayouts.value.map((item) => ({
      status: item.status,
      hidden: item.hidden,
      width: normalizeWidth(item.width, 320),
    })),
  };

  window.localStorage.setItem(layoutStorageKey.value, JSON.stringify(payload));
}

function loadTaskOrder() {
  const defaults = createEmptyOrderMap();
  for (const status of TASK_STATUSES) {
    taskOrderMap[status] = defaults[status];
  }

  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(taskOrderStorageKey.value);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Partial<Record<TaskStatusType, string[]>>;
    for (const status of TASK_STATUSES) {
      const list = parsed?.[status];
      taskOrderMap[status] = Array.isArray(list) ? list.map((id) => String(id)) : [];
    }
  } catch {
    for (const status of TASK_STATUSES) {
      taskOrderMap[status] = [];
    }
  }
}

function persistTaskOrder() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(taskOrderStorageKey.value, JSON.stringify(taskOrderMap));
}

function normalizeWidth(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(680, Math.max(240, Math.round(numeric)));
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

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Errore non gestito.');
  }
  return 'Errore non gestito.';
}

useHeaderExtra(ProjectBoardHeaderExtra, { onOpenSettings: () => (settingsOpen.value = true) });
</script>

<template>
  <div class="container-fluid pb-t overflow-auto h-100">
    <draggable
      v-model="visibleColumns"
      item-key="status"
      class="board-columns"
      handle=".column-handle"
      :animation="180"
      ghost-class="drag-ghost"
    >
      <template #item="{ element: column }">
        <section class="board-column" :style="{ width: `${column.width}px` }">
          <header class="board-column-header">
            <div class="d-flex align-items-center gap-2">
              <Btn class="column-handle" variant="ghost" icon="drag_indicator" tooltip="Riordina colonna" />
              <strong>{{ getStatusLabel(column.status) }}</strong>
            </div>
            <Btn variant="ghost" color="primary" icon="add" tooltip="Nuova task" @click="openCreateTask(column.status)" />
          </header>

          <draggable
            :list="getTaskList(column.status)"
            item-key="id"
            class="task-list"
            group="board-tasks"
            :animation="180"
            ghost-class="drag-ghost"
            @change="onTaskDragChangeForColumn(column.status, $event)"
          >
            <template #item="{ element: task }">
              <article class="task-tile" @click="openTaskDetail(task.id)">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-desc" v-if="task.description">{{ task.description.replace(/<[^>]+>/g, ' ').trim() }}</div>
                <div class="d-flex flex-wrap gap-1 mt-2" v-if="task.tag?.length">
                  <span v-for="tag in task.tag" :key="`${task.id}-${tag.label}`" class="badge" :style="{ backgroundColor: tag.color }">
                    {{ tag.label }}
                  </span>
                </div>
              </article>
            </template>

            <template #footer>
              <div v-if="!getTaskList(column.status).length" class="small text-secondary px-1">Nessuna task.</div>
            </template>
          </draggable>
        </section>
      </template>
    </draggable>

    <Modal
      v-model="settingsOpen"
      title="Layout colonne"
      size="lg"
      centered
      scrollable
      cancel-text="Chiudi"
    >
      <draggable :list="columnLayouts" item-key="status" handle=".layout-handle" :animation="180" class="d-flex flex-column gap-2">
        <template #item="{ element: column }">
          <div class="border rounded p-2">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="d-flex align-items-center gap-2">
                <Btn class="layout-handle" variant="ghost" icon="drag_indicator" tooltip="Riordina colonna" />
                <strong>{{ getStatusLabel(column.status) }}</strong>
              </div>
              <label class="form-check form-switch mb-0">
                <input class="form-check-input" type="checkbox" :checked="!column.hidden" @change="column.hidden = !($event.target as HTMLInputElement).checked" />
                <span class="form-check-label">Visibile</span>
              </label>
            </div>
            <input class="form-range" type="range" min="240" max="680" step="20" v-model.number="column.width" />
            <div class="small text-secondary">{{ normalizeWidth(column.width, 320) }}px</div>
          </div>
        </template>
      </draggable>
    </Modal>

    <Modal
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
              <option v-for="status in TASK_STATUSES" :key="`modal-status-${status}`" :value="status">
                {{ getStatusLabel(status) }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label small">Tag</label>
          <FieldColorTag
            name="task_tags"
            v-model="taskModal.tag"
            :suggestions="tagsSuggestions"
            placeholder="Aggiungi tag condivisi"
            :allow-duplicates="false"
          />
        </div>

        <div>
          <label class="form-label small">Descrizione</label>
          <FieldTiptap
            name="task_description"
            v-model="taskModal.description"
            placeholder="Dettagli task..."
            :toolbar-sticky-on="'top'"
          />
        </div>

        <div class="d-flex justify-content-between align-items-center">
          <Btn
            v-if="taskModal.mode === 'edit'"
            variant="outline"
            color="danger"
            icon="delete"
            :disabled="isTaskSaving"
            @click.prevent="deleteTask"
          >
            Elimina task
          </Btn>
          <div class="small text-secondary ms-auto" v-if="isTaskSaving">Salvataggio in corso...</div>
        </div>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.board-columns {
  display: flex;
  gap: 0.9rem;
  min-height: calc(100vh - 120px);
  padding-bottom: 0.5rem;
}

.board-column {
  flex: 0 0 auto;
  border-radius: 0.9rem;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 20px rgba(31, 42, 52, 0.08);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 145px);
}

.board-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.task-list {
  padding: 0.45rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: auto;
}

.task-tile {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem;
  background: #fff;
  padding: 0.6rem;
  cursor: pointer;
}

.task-tile:hover {
  box-shadow: 0 8px 16px rgba(31, 42, 52, 0.12);
}

.task-title {
  font-weight: 600;
}

.task-desc {
  font-size: 0.83rem;
  color: #6c757d;
  margin-top: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.drag-ghost {
  opacity: 0.55;
}
</style>
