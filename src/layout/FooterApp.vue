<script setup lang="ts">
import { currentUserStore } from '../stores/currentUserStore';
import { store, type ToolbarTabName } from '../stores/store';
import ToolbarTab from './ToolbarTab.vue';
import { setToolbarTab } from '../components/toolbar/useChangeToolbar';
import { useRouteTo } from '../components/route/useRouteTo';
import { Offcanvas } from 'bootstrap'
import { onBeforeUnmount, onMounted, ref } from 'vue';
import BtnCmp from '../components/Btn/BtnCmp.vue';
import { useRoute } from 'vue-router';

const { routeTo } = useRouteTo();
const route = useRoute();

const offcanvasEl = ref<HTMLElement | null>(null)

function onHidden() {
  const name = store.TOOLBAR.getDefaultCurrentTab(route.name)
  setToolbarTab(name)
}
onMounted(() => {
  onHidden();
  if (!offcanvasEl.value) return
  store.OFFCANVAS.ref = Offcanvas.getOrCreateInstance(offcanvasEl.value)
  offcanvasEl.value.addEventListener('hidden.bs.offcanvas', onHidden)
})

onBeforeUnmount(() => {
  if (!offcanvasEl.value) return
  offcanvasEl.value.removeEventListener('hidden.bs.offcanvas', onHidden)
})
</script>

<template>
  <div ref="offcanvasEl" class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasExample"
    aria-labelledby="offcanvasExampleLabel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="offcanvasExampleLabel">Menù</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body" v-if="store.OFFCANVAS?.tabs">
      <template v-for="(tab, _index) in store.OFFCANVAS?.tabs" :key="`offcanvas-tab-${_index}`">
        <BtnCmp block :icon="tab.icon" variant="link" class="text-start" :to="tab.to" @click="(e) => {
          if (tab.onClick) tab.onClick(e)
          store.OFFCANVAS.close()
        }">
          {{ tab.name }}
        </BtnCmp>
      </template>
    </div>
    <div class="offcanvas-body" v-else>

      <BtnCmp block icon="settings" variant="link" class="text-start" :to="{ name: 'settings' }"
        @click="() => store.OFFCANVAS.close()">Settings</BtnCmp>
    </div>
  </div>

  <footer v-if="currentUserStore.isLoggedIn">
    <div class="tabs">
      <template v-for="(tab, key, i) in store.TOOLBAR.tabs[store.TOOLBAR.type]" :key="'toolbar-tab-' + i">
        <input type="radio" :id="'toolbar-tab-' + i" name="toolbar-tab" :checked="store.TOOLBAR.currentTab === key">
        <label class="tab" :for="'toolbar-tab-' + i" @click="(e) => {
          try {
            if (tab.onClick) tab.onClick(e);
          } catch (error) {
            console.error(error);
          }
          try {
            if (tab.to) routeTo(tab.to);
          } catch (error) {
            console.error(error);
          }
          setToolbarTab((key as ToolbarTabName));
        }">
          <ToolbarTab :tab="tab" :tabName="key" :i="i" :active="store.TOOLBAR.currentTab === key" />
        </label>
      </template>

      <span v-if="store.TOOLBAR.currentTab !== 'hidden'" class="glider"></span>
    </div>
  </footer>
</template>


<style lang="scss" scoped>
footer {
  .tabs {
    display: flex;
    position: absolute;
    justify-content: space-evenly;
    background-color: rgba(255, 255, 255, 0.7);
    box-shadow: 0 0 1px 0 rgba(24, 94, 224, 0.15), 0 6px 12px 0 rgba(24, 94, 224, 0.15);
    padding: 0.75rem;
    border-radius: 99px;
    width: fit-content;
    user-select: none;
    bottom: 0;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .tabs * {
    z-index: 2;
  }

  input[type="radio"] {
    display: none;
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    width: 80px;
    font-size: .8rem;
    color: black;
    font-weight: 500;
    border-radius: 99px;
    cursor: pointer;
    transition: color 0.15s ease-in;
    position: relative;
    z-index: 2;
  }

  input[type="radio"]:checked+label {
    color: #0866E3;
  }

  input#toolbar-tab-0:checked~.glider {
    left: calc(0% + 52px); // 40 = metà tab
    transform: translate(-50%, -50%);
  }

  input#toolbar-tab-1:checked~.glider {
    left: calc(50%); // centro del contenitore
    transform: translate(-50%, -50%);
  }

  input#toolbar-tab-2:checked~.glider {
    left: calc(100% - 52px); // 100% meno metà tab
    transform: translate(-50%, -50%);
  }

  .glider {
    position: absolute;
    height: 40px;
    width: 40px;
    background-color: #e6eef9;
    z-index: 1;
    border-radius: 99px;
    transition: 0.25s ease-out;
    top: 50%;
    transform: translateY(-50%);
    left: 0;
  }




}
</style>