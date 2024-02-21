<script setup>
import CardNavigation from '@/views/pages/cards/card-basic/CardNavigation.vue';
import CardSolid from '@/views/pages/cards/card-basic/CardSolid.vue';
import Rainbow from '@/views/pages/projects/rainbow.vue';
</script>

<template>
  <div>
    <!-- <p class="text-2xl mb-6">
      Basic Cards
    </p> -->

    <Rainbow />

    <p class="text-2xl mb-6 mt-14">
      Navigation Cards
    </p>

    <CardNavigation />

    <p class="text-2xl mt-14 mb-6 ">
      Solid Cards
    </p>

    <CardSolid />
  </div>
</template>
