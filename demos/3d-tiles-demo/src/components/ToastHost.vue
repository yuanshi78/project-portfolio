<template>
  <div class="toast-host">
    <transition-group name="toast">
      <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.type">
        {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { store } from '../store.js'
</script>

<style scoped>
.toast-host {
  position: absolute; bottom: 64px; left: 50%; transform: translateX(-50%);
  z-index: 60; display: flex; flex-direction: column; gap: 8px; align-items: center;
  pointer-events: none;
}
.toast {
  padding: 8px 16px; border-radius: 8px; font-size: 13px;
  background: var(--bg-3); border: 1px solid var(--line); color: var(--txt-0);
  box-shadow: var(--shadow);
}
.toast.success { border-color: var(--ok); color: #b6f3d8; }
.toast.warn { border-color: var(--warn); color: #ffe19a; }
.toast.error { border-color: var(--danger); color: #ffb4b4; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
