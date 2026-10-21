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
  position: absolute; bottom: 150px; left: 50%; transform: translateX(-50%);
  z-index: 60; display: flex; flex-direction: column; gap: 8px; align-items: center;
  pointer-events: none;
}
.toast {
  padding: 9px 18px; border-radius: 10px; font-size: 13px;
  background: rgba(8, 18, 32, 0.85); border: 1px solid rgba(34, 211, 238, 0.35);
  color: var(--txt-0); box-shadow: var(--shadow), var(--glow);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.toast.success { border-color: rgba(52, 226, 176, 0.6); color: #b6f3d8; box-shadow: 0 0 16px rgba(52, 226, 176, 0.35); }
.toast.warn { border-color: rgba(255, 180, 84, 0.6); color: #ffe19a; box-shadow: 0 0 16px rgba(255, 180, 84, 0.3); }
.toast.error { border-color: rgba(255, 93, 115, 0.6); color: #ffb4bf; box-shadow: 0 0 16px rgba(255, 93, 115, 0.35); }
.toast-enter-active, .toast-leave-active { transition: all 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
