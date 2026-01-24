<script setup lang="ts">
import { ref, type Component } from 'vue'
import HomeViewDev from './HomeViewDev.vue';
import MsgPushViewDev from './view/MsgPushViewDev.vue';
import FireStoreDevView from './view/FireStoreDevView.vue';
import AppConfigViewDev from './view/AppConfigViewDev.vue';
import LSViewDev from './view/LSViewDev.vue';
import { store } from '../../stores/store';
import ObjectDataViewer from './view/ObjectDataViewer.vue';
import type { AnyFirestoreStoreReactive } from '../firestore/FirestoreStore';
import { currentUserStore } from '@src/stores/currentUserStore';
// import router from '../../router';

type TabBase = {
    name: string
    icon: string
    justIcon?: true
}

type TabWithComponent = TabBase & {
    component: Component
    obj?: never
    store?: never
}

type TabWithObj = TabBase & {
    obj: {}
    component?: never
    store?: never
}

type TabWithFirestore = TabBase & {
    store: AnyFirestoreStoreReactive
    component?: never
    obj?: never
}

export type Tab = TabWithComponent | TabWithObj | TabWithFirestore


// const routeList = computed(() => router.options.routes.map(r => (`[${r.path}]: ${String(r.name)}`)));

const isChecked = ref<boolean>(false);
const tabs = ref<Tab[]>([
    {
        name: 'home',
        icon: 'home',
        justIcon: true,
        component: HomeViewDev
    },
    {
        name: 'home',
        icon: 'shield_toggle',
        justIcon: true,
        component: AppConfigViewDev
    },
    {
        name: 'push',
        icon: 'notification_add',
        justIcon: true,
        component: MsgPushViewDev
    },
    {
        name: 'LS',
        icon: 'storage',
        component: LSViewDev
    },
    {
        name: 'store',
        icon: 'database',
        obj: store,
    },
    {
        name: 'user',
        icon: 'account_circle',
        obj: currentUserStore,
    },
    // {
    //     name: 'router',
    //     icon: 'route',
    //     obj: routeList,
    // }
]);

const activeIndex = ref(0)
const setActive = (i: number) => { activeIndex.value = i }



</script>

<template>
    <div v-if="isChecked" class="dev-container max-z-index vh-100 vw-100 d-flex flex-column text-white">
        <nav class="nav-scoped flex-shrink-0">
            <div class="nav nav-tabs border-0" role="tablist">
                <button v-for="(tab, i) in tabs" :key="tab.name" class="nav-link text-info"
                    :class="{ active: i === activeIndex }" type="button" role="tab" @click="setActive(i)">
                    <span class="material-symbols-outlined">{{ tab.icon }}</span>
                    {{ tab.justIcon ? null : tab.name }}
                </button>
            </div>
        </nav>

        <div class="tab-content scoped p-2 overflow-y-auto flex-grow-1">
            <div v-for="(tab, i) in tabs" :key="tab.name" class="tab-pane fade"
                :class="{ 'show active': i === activeIndex }" role="tabpanel" tabindex="0">
                <template v-if="i === activeIndex">
                    <component v-if="'component' in tab" :is="(tab as any).component" />
                    <FireStoreDevView v-else-if="'store' in tab" :store="(tab as any).store" />
                    <ObjectDataViewer v-else :obj="tab.obj" />
                </template>
            </div>
        </div>
    </div>

    <!-- Checkbox con icona in lable per attivare il div di sopra -->
    <input type="checkbox" id="devModeToggle" class="d-none" v-model="isChecked" />
    <label for="devModeToggle" type="button"
        class="position-fixed max-z-index top-0 end-0 m-2 material-symbols-outlined text-info">
        developer_mode
    </label>
</template>



<style lang="scss">
.max-z-index {
    z-index: 999998;
}

.dev-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999997;
    background-color: rgba(0, 0, 0, 0.94);
}

.nav-scoped {
    padding-right: 38px;
}

.tab-content.scoped {
    border-top: 2px solid #fff;
}

.tab-pane.scoped {
    overflow-y: auto;
}

.nav-link.text-info.active {
    color: #000000 !important;
}
</style>
