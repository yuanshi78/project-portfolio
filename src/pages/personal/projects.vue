<script setup>
import { visibleItems } from '@/utils/visibility'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div>
    <div class="section-head text-h5 font-weight-bold mb-3">
      {{ data.title }}
    </div>
    <VRow>
      <VCol
        v-for="(job, i) in visibleItems(data.items)"
        :key="i"
        class="d-flex"
        cols="12"
        lg="4"
        md="4"
      >
        <VCard
          class="flex-1-1 work-card"
          rounded="lg"
          elevation="1"
          :subtitle="job.subtitle"
          :title="job.title"
          :to="job.to"
        >
          <VCardText>{{ job.text }}</VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style lang="scss" scoped>
.section-head {
  position: relative;
  padding-left: 14px;
  font-weight: 700;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 4px;
    border-radius: 4px;
    background: rgb(var(--v-theme-primary));
  }
}

.work-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 28px -14px rgba(0, 0, 0, 0.45);
  }
}
</style>
