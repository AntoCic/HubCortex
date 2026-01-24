import { nanoid } from 'nanoid';
import type { Component } from 'vue';
import type { BtnColor, BtnVariant } from '../Btn/BtnCmp.vue';

export type ToastType = 'log' | 'logError' | 'info' | 'error' | 'success' | 'warning' | 'primary' | 'secondary';

export interface ToastAction {
  content?: string;
  icon?: string;
  onClick: () => Promise<any> | any;
  variant?: BtnVariant;
  color?: BtnColor;
  class?: unknown;
  style?: string;
  disabled?: boolean | (() => boolean);
}
export interface ToastContentObject {
  title: string;
  message?: string;
  logo?: string;
  component?: Component;
  componentProps?: Record<string, any>;
  actions?: ToastAction[];
  closeAction?: boolean;
}
export type ToastContent = string | ToastContentObject;

type Timer = ReturnType<typeof setTimeout>;

export class Toast {
  type: ToastType | string;
  id: string;
  title: string;
  message?: string;
  duration: number | null;
  timer: Timer | null;
  createdAt: number | null;
  logo?: string;
  component?: Component;
  componentProps?: Record<string, any>;
  actions?: ToastAction[];
  closeAction?: boolean;

  constructor({
    type = 'info',
    title,
    message,
    logo,
    duration = 3000,
    component,
    componentProps,
    actions,
    closeAction,
  }: {
    type?: ToastType | string;
    title: string;
    message?: string;
    logo?: string;
    duration?: number | null;
    component?: Component;
    componentProps?: Record<string, any>;
    actions?: ToastAction[];
    closeAction?: boolean;
  }) {
    this.type = type;
    this.id = nanoid();
    this.title = title;
    this.message = message;
    this.duration = duration;
    this.component = component;
    this.componentProps = componentProps;
    this.actions = actions;
    this.closeAction = closeAction;
    this.timer = null;
    this.createdAt = null;

    this.logo = logo;
    if (!this.logo) {
      switch (type) {
        case 'info':
          this.logo = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentcolor"><path d="M480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-200v-80h320v80H320Zm10-120q-69-41-109.5-110T180-580q0-125 87.5-212.5T480-880q125 0 212.5 87.5T780-580q0 81-40.5 150T630-320H330Zm24-80h252q45-32 69.5-79T700-580q0-92-64-156t-156-64q-92 0-156 64t-64 156q0 54 24.5 101t69.5 79Zm126 0Z"/></svg>`;
          break;
        case 'error':
          this.logo = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentcolor"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>`;
          break;
        case 'success':
          this.logo = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentcolor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z" /></svg>`;
          break;
        case 'warning':
          this.logo = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentcolor"><path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/></svg>`;
          break;
        case 'primary':
          this.logo = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentcolor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-80q-100 0-170-70t-70-170q0-100 70-170t170-70q100 0 170 70t70 170q0 100-70 170t-170 70Zm0-80q66 0 113-47t47-113q0-66-47-113t-113-47q-66 0-113 47t-47 113q0 66 47 113t113 47Zm0-80q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Z"/></svg>`;
          break;
        case 'log':
          this.logo = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#0400ffff"><path d="M480-200q66 0 113-47t47-113v-160q0-66-47-113t-113-47q-66 0-113 47t-47 113v160q0 66 47 113t113 47Zm-80-120h160v-80H400v80Zm0-160h160v-80H400v80Zm80 40Zm0 320q-65 0-120.5-32T272-240H160v-80h84q-3-20-3.5-40t-.5-40h-80v-80h80q0-20 .5-40t3.5-40h-84v-80h112q14-23 31.5-43t40.5-35l-64-66 56-56 86 86q28-9 57-9t57 9l88-86 56 56-66 66q23 15 41.5 34.5T688-640h112v80h-84q3 20 3.5 40t.5 40h80v80h-80q0 20-.5 40t-3.5 40h84v80H688q-32 56-87.5 88T480-120Z"/></svg>`;
          break;
        case 'logError':
          this.logo = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ff0000ff"><path d="M480-200q66 0 113-47t47-113v-160q0-66-47-113t-113-47q-66 0-113 47t-47 113v160q0 66 47 113t113 47Zm-80-120h160v-80H400v80Zm0-160h160v-80H400v80Zm80 40Zm0 320q-65 0-120.5-32T272-240H160v-80h84q-3-20-3.5-40t-.5-40h-80v-80h80q0-20 .5-40t3.5-40h-84v-80h112q14-23 31.5-43t40.5-35l-64-66 56-56 86 86q28-9 57-9t57 9l88-86 56 56-66 66q23 15 41.5 34.5T688-640h112v80h-84q3 20 3.5 40t.5 40h80v80h-80q0 20-.5 40t-3.5 40h84v80H688q-32 56-87.5 88T480-120ZM40-720v-120q0-33 23.5-56.5T120-920h120v80H120v120H40ZM240-40H120q-33 0-56.5-23.5T40-120v-120h80v120h120v80Zm480 0v-80h120v-120h80v120q0 33-23.5 56.5T840-40H720Zm120-680v-120H720v-80h120q33 0 56.5 23.5T920-840v120h-80Z"/></svg>`;
          break;
        default:
          this.logo = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentcolor"><path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" /></svg>`;
          break;
      }
    }
  }

  start(timer: Timer) {
    if (this.duration === null) {
      this.createdAt = null;
      this.timer = null;
      return;
    }
    this.createdAt = Date.now();
    this.timer = timer;
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;

      if (this.duration === null) {
        this.createdAt = null;
        return;
      }

      const elapsed = Date.now() - (this.createdAt ?? Date.now());
      const remaining = this.duration - elapsed;
      this.duration = Math.max(remaining, 0);
    }
  }
}