import { reactive, type Component } from 'vue'
import { type RouteLocationRaw, type RouteRecordNameGeneric } from 'vue-router'
import { LocalStorageKey } from '@shared/enums/LocalStorageKey'
import { LS } from '../components/localStorage/LS'
import type { Offcanvas } from 'bootstrap'

type Shape = 'square' | 'circle' | 'octagon'
export type PwaUpdateModal = false | 'force' | 'update'

interface StoreState {
  HEADER: HeaderState
  devMod: boolean
  debugMod: boolean
  isDeveloping: boolean
  pwaUpdateModal: PwaUpdateModal
  TOOLBAR: ToolbarState
  OFFCANVAS: OffcanvasState
}
export const store = reactive<StoreState>({
  HEADER: {
    defaultTitle: 'GameScore',
    logoUrl: '/img/logo/logo.png',
    defaultLogoUrl: '/img/logo/logo.png',
    logoShape: 'square',
    title: '',
    show: true,
    loading: false,
    backTo: undefined,                 // <- ora è RouteLocationRaw | undefined
    userBtn: true,
    extra: null,
    extraProps: {},
    height: 0,                         // viene settata in automatico da ResizeObserver in HeaderApp
  },

  // devMod: false,
  devMod: location.hostname === 'localhost' || location.hostname === '127.0.0.1', //? location.hostname === 'localhost' || location.hostname === '127.0.0.1',
  debugMod: firstGetDebugMod(),
  get isDeveloping(): boolean {
    return this.devMod && this.debugMod
  },

  pwaUpdateModal: false,

  TOOLBAR: {
    type: 'main',
    tabs: {
      main: {
        menu: { onClick: () => store.OFFCANVAS.open(), type: 'google', content: 'menu' },
        "": { to: 'home', type: 'google', content: 'home' },
        user: { to: 'user', type: 'google', content: 'person_book' }
      },

    },
    currentTab: '',
    prevTab: '',
    getDefaultCurrentTab: (name: RouteRecordNameGeneric) => {
      let tab: ToolbarTabName = 'hidden';
      switch (name) {
        case 'home':
          tab = '';
          break;
      }
      return tab
    }
  },
  OFFCANVAS: {
    ref: null,
    open() {
      if (!store.OFFCANVAS.ref) return;
      store.OFFCANVAS.ref.show();
    },
    close() {
      if (!store.OFFCANVAS.ref) return;
      store.OFFCANVAS.ref.hide();
    },
  },
})

function firstGetDebugMod(): boolean {
  const isFromRunDev = import.meta.env.DEV;
  const localSetDebugMod = LS.getParsed(LocalStorageKey.storeDebugMod);
  if (localSetDebugMod !== undefined) {
    return localSetDebugMod;
  } else {
    LS.set(LocalStorageKey.storeDebugMod, isFromRunDev);
    return isFromRunDev;
  }
}
interface HeaderState {
  defaultTitle: string
  logoUrl: string
  defaultLogoUrl: string
  title: string
  show: boolean
  loading: boolean
  backTo?: RouteLocationRaw | undefined
  extra: Component | null
  extraProps: Record<string, unknown>
  height: number
  logoShape: Shape
  userBtn: boolean
}

export interface ToolbarState {
  type: ToolbarType
  tabs: ToolbarTabMap
  currentTab: ToolbarTabName
  prevTab: ToolbarTabName
  getDefaultCurrentTab: (name: RouteRecordNameGeneric) => ToolbarTabName
}
type ToolbarType = 'main'
export type ToolbarTabName = '' | 'hidden' | 'menu' | 'settings' | 'user' ;
export type ToolbarTab = { type: 'class' | 'img' | 'google', content: string, extraClass?: string, to?: string, onClick?: (e: MouseEvent) => any }
type ToolbarTabMap<T extends string = ToolbarType> = Record<T, Record<string, ToolbarTab>>


export interface OffcanvasTab { name: string, icon: string, onClick?: (e: MouseEvent) => any, to?: RouteLocationRaw }
export interface OffcanvasState {
  ref: Offcanvas | null;
  open: () => any;
  close: () => any,
  tabs?: OffcanvasTab[]
}