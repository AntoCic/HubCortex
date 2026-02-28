export const TaskStatus = {
  TODO: 'todo',
  DOING: 'doing',
  BLOCKED: 'blocked',
  BUG: 'bug',
  DONE: 'done',
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

export const TASK_STATUSES = Object.values(TaskStatus) as TaskStatusType[];

export const isTaskStatus = (value: unknown): value is TaskStatusType =>
  TASK_STATUSES.includes(value as TaskStatusType);
