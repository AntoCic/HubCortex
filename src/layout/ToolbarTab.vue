<script setup lang="ts">
import { type ToolbarTab } from '../stores/store';

defineProps<{
  tab: ToolbarTab;
  tabName: string;
  i: number;
  active: boolean;
}>();

</script>

<template>
  <span v-if="tab.type === 'google'" class="material-symbols-outlined" :class="tab.extraClass">
    {{ tab.content }}
  </span>
  <div v-else :class="`mainBtn-container${active ? ' active' : ''}`">
    <div v-if="tab.type === 'class'" :class="`${tab.content} ${tab.extraClass}`"></div>
    <img v-else :src="tab.content" :class="tab.extraClass" alt="icon home" class="home-icon" />
    <template v-if="!tabName">
      <div class="ring ring-1"></div>
      <div class="ring ring-2"></div>
      <div class="ring ring-3"></div>
    </template>
  </div>


</template>


<style lang="scss" scoped>
.mainBtn-container {
  position: relative;
  width: 32px;
  height: 32px;
  perspective: 100px;
  transform-style: preserve-3d;

  .home-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 24px;
    height: 24px;
    transform: translate(-50%, -50%);
    // filter: drop-shadow(10px 20px 25px rgba(#000, .2));
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0);

  }

  &.active .sphere-tennis {
    animation: pulseRotate 2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  }

  .sphere-tennis {
    position: absolute;
    overflow: hidden;
    height: 24px;
    width: 24px;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    background: radial-gradient(ellipse at center, #1267b6 0%, darken(#1267b6, 15) 100%);
    box-shadow: 0 0 25px rgba(18, 103, 182, 0.35);
    box-sizing: border-box;
    transform: translate(-50%, -50%) rotate(30deg);
    box-shadow: 10px 20px 25px 10px rgba(#000, .2);


    &:before,
    &:after {
      content: '';
      position: absolute;
      display: block;
      height: 100%;
      width: 100%;
      border: 1.4px solid #fff;
      border-radius: 50%;
      box-sizing: border-box;
    }

    &:before {
      right: 70%;
    }

    &:after {
      left: 70%;
    }
  }

  .ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 1px solid rgba(28, 94, 155, 0.7);
    border-radius: 50%;

    transform-style: preserve-3d;

    border-color: rgba(28, 94, 155, 0.2);

  }

  &.active .ring-1 {
    animation: rotateX 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
  }

  &.active .ring-2 {
    animation: rotateY 2s cubic-bezier(0.55, 0, 0.45, 1) infinite;
    width: 36px;
    height: 36px;
    top: -2px;
    left: -2px;
    border-color: rgba(28, 94, 155, 0.502);
  }

  &.active .ring-3 {
    animation: rotateXY 3s cubic-bezier(0.7, 0, 0.3, 1) infinite;
    width: 40px;
    height: 40px;
    top: -4px;
    left: -4px;
    border-color: rgba(28, 94, 155, 0.3);
  }

  @keyframes rotateX {
    0% {
      transform: rotateX(0deg);
    }

    50% {
      transform: rotateX(180deg);
    }

    100% {
      transform: rotateX(360deg);
    }
  }

  @keyframes rotateY {
    0% {
      transform: rotateY(0deg);
    }

    50% {
      transform: rotateY(180deg);
    }

    100% {
      transform: rotateY(360deg);
    }
  }

  @keyframes rotateXY {
    0% {
      transform: rotateX(0deg) rotateY(0deg);
    }

    50% {
      transform: rotateX(90deg) rotateY(180deg);
    }

    100% {
      transform: rotateX(360deg) rotateY(360deg);
    }
  }

  @keyframes pulseRotate {

    0%,
    100% {
      transform: translate(-50%, -50%) rotate(30deg) scale(1);
      box-shadow: 0 0 25px rgba(28, 94, 155, 0.5);
    }

    50% {
      transform: translate(-50%, -50%) rotate(30deg) scale(1.1);
      box-shadow: 0 0 35px rgba(28, 94, 155, 0.7);
    }
  }

  &.active {
    .ring {
      border-color: rgba(28, 94, 155, 0.5);
      box-shadow: 0 0 20px rgba(28, 94, 155, 0.5);
    }
  }
}
</style>