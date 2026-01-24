import { reactive } from 'vue';
import { Toast, type ToastContent, type ToastType } from './Toast'


export interface ToastStore {
  queue: Toast[];
  start: (toast: Toast) => void;
  startAll: () => void;
  stop: (toast: Toast) => void;
  stopAll: () => void;
  removeToastByIndex: (index: number) => void;
  removeToastById: (id: string) => void;
  _addToast: (type: ToastType, content: ToastContent, duration?: number | null) => void;
  info: (content: ToastContent, duration?: number | null) => void;
  error: (content: ToastContent, duration?: number | null) => void;
  danger: (content: ToastContent, duration?: number | null) => void;
  success: (content: ToastContent, duration?: number | null) => void;
  warning: (content: ToastContent, duration?: number | null) => void;
  primary: (content: ToastContent, duration?: number | null) => void;
  secondary: (content: ToastContent, duration?: number | null) => void;
  log: (content: ToastContent, duration?: number | null) => void;
  logError: (content: ToastContent, duration?: number | null) => void;
}

export const toast: ToastStore = reactive<ToastStore>({
  queue: [],

  start(toast: Toast): void {
    if (toast.duration === null) {
      toast.start(null as unknown as ReturnType<typeof setTimeout>);
      return;
    }
    toast.start(setTimeout(() => this.removeToastById(toast.id), toast.duration));
  },

  startAll(): void {
    for (const toast of this.queue) { this.start(toast); }
  },

  stop(toast: Toast): void {
    if (toast.timer) {
      clearTimeout(toast.timer);
      toast.timer = null;

      if (toast.duration === null) {
        toast.createdAt = null;
        return;
      }

      const elapsed = Date.now() - (toast.createdAt ?? Date.now());
      const remaining = toast.duration - elapsed;
      toast.duration = Math.max(remaining, 0);
    }
  },

  stopAll(): void {
    for (const toast of this.queue) { toast.stop(); }
  },

  removeToastByIndex(index: number): void {
    const toast = this.queue[index];
    if (toast) {
      this.stop(toast);
    } else {
      console.error('toast to stop not found');
    }
    this.queue.splice(index, 1);
  },

  removeToastById(id: string): void {
    for (const index in this.queue) {
      const i = Number(index);
      if (this.queue[i]?.id === id) {
        this.removeToastByIndex(i);
        break;
      }
    }
  },

  _addToast(type: ToastType, content: ToastContent, duration?: number | null): void {
    duration = (duration === undefined ? 3000 : duration)
    const t = new Toast({
      type,
      title: typeof content === 'object' ? content.title : content,
      message: typeof content === 'object' ? content.message : undefined,
      logo: typeof content === 'object' ? content.logo : undefined,
      component: typeof content === 'object' ? content.component : undefined,
      componentProps: typeof content === 'object' ? content.componentProps : undefined,
      actions: typeof content === 'object' ? content.actions : undefined,
      closeAction: typeof content === 'object' ? content.closeAction : undefined,
      duration,
    });
    this.queue.push(t);
    this.start(t);
  },

  info(content: ToastContent, duration?: number | null): void {
    this._addToast('info', content, duration);
  },
  error(content: ToastContent, duration?: number | null): void {
    if (import.meta.env.DEV) {
      const msg = typeof content === 'object' ? `${content.title} ${content?.message ?? ''} ` : content;
      console.log('[ERROR]: ' + msg);
      console.error(msg);
    };
    this._addToast('error', content, duration);
  },
  danger(content: ToastContent, duration?: number | null): void {
    this.error(content, duration);
  },
  success(content: ToastContent, duration?: number | null): void {
    this._addToast('success', content, duration);
  },
  warning(content: ToastContent, duration?: number | null): void {
    if (import.meta.env.DEV) {
      const msg = typeof content === 'object' ? `${content.title} ${content?.message ?? ''} ` : content;
      console.log('[WARNING]: ' + msg);
      console.warn(msg);
    };
    this._addToast('warning', content, duration);
  },
  primary(content: ToastContent, duration?: number | null): void {
    this._addToast('primary', content, duration);
  },
  secondary(content: ToastContent, duration?: number | null): void {
    this._addToast('secondary', content, duration);
  },

  log(content: ToastContent, duration?: number | null): void {
    if (!import.meta.env.DEV) return;
    console.log(typeof content === 'object' ? `${content.title} ${content?.message ?? ''} ` : content);
    this._addToast('log', content, (duration === undefined ? 5000 : duration));
  },

  logError(content: ToastContent, duration?: number | null): void {
    if (!import.meta.env.DEV) return;
    const msg = typeof content === 'object' ? `${content.title} ${content?.message ?? ''} ` : content
    console.log('[ERROR]: ' + msg);
    console.error(msg);
    this._addToast('logError', content, (duration === undefined ? 5000 : duration));
  },

});