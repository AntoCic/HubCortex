<script setup lang="ts">
import { _Auth, toast, useChangeHeader } from 'cic-kit';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { PROJECT_STATUSES, type ProjectStatusType } from '../../models/Project';
import { PROJECT_STATUS_LEVELS, type ProjectStatusLevel } from '../../models/ProjectStatus';
import { TASK_STATUSES, type TaskStatusType, type ProjectTask } from '../../models/ProjectTask';
import { projectStatusStore } from '../../stores/projectStatusStore';
import { projectStore } from '../../stores/projectStore';
import { projectTaskStore } from '../../stores/projectTaskStore';

useChangeHeader('Progetti', { name: 'home-auth' });

const selectedProjectId = ref('');

const projectForm = reactive({
  name: '',
  description: '',
  repoUrl: '',
  status: 'planned' as ProjectStatusType,
});

const taskForm = reactive({
  projectId: '',
  title: '',
  description: '',
  status: 'todo' as TaskStatusType,
});

const statusForm = reactive({
  projectId: '',
  taskId: '',
  level: 'info' as ProjectStatusLevel,
  message: '',
});

const projects = computed(() => [...projectStore.itemsActiveArray]);
const selectedProject = computed(() => projects.value.find((item) => item.id === selectedProjectId.value));

watch(
  projects,
  (next) => {
    if (!next.length) {
      selectedProjectId.value = '';
      taskForm.projectId = '';
      statusForm.projectId = '';
      return;
    }
    const firstProject = next[0];
    if (!firstProject) return;

    if (!selectedProjectId.value || !next.some((item) => item.id === selectedProjectId.value)) {
      selectedProjectId.value = firstProject.id;
    }

    if (!taskForm.projectId) {
      taskForm.projectId = selectedProjectId.value;
    }

    if (!statusForm.projectId) {
      statusForm.projectId = selectedProjectId.value;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await Promise.all([projectStore.get(), projectTaskStore.get(), projectStatusStore.get()]);
});

function getUpdater() {
  return String(_Auth?.uid ?? 'system');
}

async function createProject() {
  const name = projectForm.name.trim();
  if (!name) {
    toast.warning('Inserisci il nome progetto.');
    return;
  }

  const created = await projectStore.add({
    name,
    description: projectForm.description.trim() || undefined,
    repoUrl: projectForm.repoUrl.trim() || undefined,
    status: projectForm.status,
    createdBy: getUpdater(),
    updateBy: getUpdater(),
  });

  selectedProjectId.value = created.id;
  taskForm.projectId = created.id;
  statusForm.projectId = created.id;

  projectForm.name = '';
  projectForm.description = '';
  projectForm.repoUrl = '';
  projectForm.status = 'planned';

  toast.success('Progetto creato.');
}

async function createTask() {
  const projectId = taskForm.projectId || selectedProjectId.value;
  if (!projectId) {
    toast.warning('Seleziona un progetto.');
    return;
  }

  const title = taskForm.title.trim();
  if (!title) {
    toast.warning('Inserisci il titolo task.');
    return;
  }

  await projectTaskStore.add({
    projectId,
    title,
    description: taskForm.description.trim() || undefined,
    status: taskForm.status,
    updateBy: getUpdater(),
  });

  taskForm.title = '';
  taskForm.description = '';
  taskForm.status = 'todo';

  toast.success('Task creato.');
}

async function addProjectStatus() {
  const projectId = statusForm.projectId || selectedProjectId.value;
  const message = statusForm.message.trim();

  if (!projectId) {
    toast.warning('Seleziona un progetto.');
    return;
  }

  if (!message) {
    toast.warning('Inserisci un messaggio di stato.');
    return;
  }

  await projectStatusStore.add({
    projectId,
    taskId: statusForm.taskId.trim() || undefined,
    level: statusForm.level,
    message,
    updateBy: getUpdater(),
  });

  statusForm.taskId = '';
  statusForm.message = '';
  statusForm.level = 'info';

  toast.success('Stato registrato.');
}

function projectTasks(projectId: string) {
  return projectTaskStore.forProject(projectId);
}

function projectStatuses(projectId: string) {
  return projectStatusStore.forProject(projectId);
}

async function toggleTaskDone(task: ProjectTask) {
  const nextStatus: TaskStatusType = task.status === 'done' ? 'todo' : 'done';
  await task.update({ status: nextStatus, updateBy: getUpdater() });
}

async function createBranchForTask(task: ProjectTask) {
  const branchName = buildBranchName(task.title, task.id);
  await task.update({ branchName, updateBy: getUpdater() });

  try {
    await navigator.clipboard.writeText(branchName);
    toast.success(`Branch pronto: ${branchName} (copiato)`);
  } catch {
    toast.success(`Branch pronto: ${branchName}`);
  }
}

function buildBranchName(title: string, taskId: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
  return `task/${slug || 'nuovo-task'}-${taskId.slice(0, 6)}`;
}

function badgeClass(status: ProjectStatusType) {
  if (status === 'active') return 'badge-project-active';
  if (status === 'blocked') return 'badge-project-blocked';
  if (status === 'done') return 'badge-project-done';
  return 'badge-project-planned';
}
</script>

<template>
  <div class="container page-wrap">
    <div class="row g-3">
      <div class="col-12 col-xl-4">
        <div class="card card-hub p-3 mb-3">
          <h2 class="h6 mb-3">Nuovo progetto</h2>
          <input v-model="projectForm.name" class="form-control mb-2" placeholder="Nome progetto" />
          <textarea
            v-model="projectForm.description"
            class="form-control mb-2"
            rows="3"
            placeholder="Descrizione"
          />
          <input v-model="projectForm.repoUrl" class="form-control mb-2" placeholder="Repo URL (opzionale)" />
          <select v-model="projectForm.status" class="form-select mb-3">
            <option v-for="status in PROJECT_STATUSES" :key="status" :value="status">{{ status }}</option>
          </select>
          <button class="btn btn-hub-primary" @click="createProject">Crea progetto</button>
        </div>

        <div class="card card-hub p-3 mb-3">
          <h2 class="h6 mb-3">Nuovo task</h2>
          <select v-model="taskForm.projectId" class="form-select mb-2">
            <option value="">Seleziona progetto</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
          </select>
          <input v-model="taskForm.title" class="form-control mb-2" placeholder="Titolo task" />
          <textarea v-model="taskForm.description" class="form-control mb-2" rows="2" placeholder="Descrizione" />
          <select v-model="taskForm.status" class="form-select mb-3">
            <option v-for="status in TASK_STATUSES" :key="status" :value="status">{{ status }}</option>
          </select>
          <button class="btn btn-hub-accent" @click="createTask">Crea task</button>
        </div>

        <div class="card card-hub p-3">
          <h2 class="h6 mb-3">Nuovo stato / errore</h2>
          <select v-model="statusForm.projectId" class="form-select mb-2">
            <option value="">Seleziona progetto</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
          </select>
          <input v-model="statusForm.taskId" class="form-control mb-2" placeholder="Task ID (opzionale)" />
          <select v-model="statusForm.level" class="form-select mb-2">
            <option v-for="level in PROJECT_STATUS_LEVELS" :key="level" :value="level">{{ level }}</option>
          </select>
          <textarea v-model="statusForm.message" class="form-control mb-3" rows="3" placeholder="Messaggio" />
          <button class="btn btn-outline-secondary" @click="addProjectStatus">Salva stato</button>
        </div>
      </div>

      <div class="col-12 col-xl-8">
        <div class="card card-hub p-3 mb-3">
          <h2 class="h6 mb-3">Progetti</h2>
          <div v-if="!projects.length" class="text-secondary">Nessun progetto.</div>

          <div class="list-group" v-else>
            <button
              v-for="project in projects"
              :key="project.id"
              class="list-group-item list-group-item-action"
              :class="{ active: selectedProjectId === project.id }"
              @click="selectedProjectId = project.id"
            >
              <div class="d-flex justify-content-between align-items-center">
                <span>{{ project.name }}</span>
                <span class="badge" :class="badgeClass(project.status)">{{ project.status }}</span>
              </div>
              <small class="text-secondary" v-if="project.description">{{ project.description }}</small>
            </button>
          </div>
        </div>

        <div class="card card-hub p-3 mb-3" v-if="selectedProject">
          <h2 class="h6 mb-3">Task - {{ selectedProject.name }}</h2>
          <div v-if="!projectTasks(selectedProject.id).length" class="text-secondary">Nessun task.</div>

          <div class="list-group" v-else>
            <div v-for="task in projectTasks(selectedProject.id)" :key="task.id" class="list-group-item">
              <div class="d-flex justify-content-between gap-2 flex-wrap">
                <div>
                  <div class="fw-semibold">{{ task.title }}</div>
                  <div class="small text-secondary">{{ task.description || '-' }}</div>
                  <div class="small">Stato: <strong>{{ task.status }}</strong></div>
                  <div class="small" v-if="task.branchName">Branch: {{ task.branchName }}</div>
                </div>

                <div class="d-flex gap-2 align-items-start">
                  <button class="btn btn-sm btn-outline-success" @click="toggleTaskDone(task)">
                    {{ task.status === 'done' ? 'Riapri' : 'Chiudi' }}
                  </button>
                  <button class="btn btn-sm btn-outline-primary" @click="createBranchForTask(task)">
                    Crea branch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card card-hub p-3" v-if="selectedProject">
          <h2 class="h6 mb-3">Stati / errori - {{ selectedProject.name }}</h2>
          <div v-if="!projectStatuses(selectedProject.id).length" class="text-secondary">Nessun messaggio.</div>
          <div v-else class="list-group">
            <div v-for="status in projectStatuses(selectedProject.id)" :key="status.id" class="list-group-item">
              <div class="d-flex justify-content-between align-items-center">
                <strong class="text-uppercase small">{{ status.level }}</strong>
                <small class="text-secondary">{{ status.taskId || 'progetto' }}</small>
              </div>
              <div>{{ status.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
