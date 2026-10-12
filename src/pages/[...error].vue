<template>
  <div class="misc-wrapper">
    <ErrorHeader
      status-code="404"
      title="Page Not Found ⚠️"
      description="We couldn't find the page you are looking for."
    />

    <!-- 👉 Not-found illustration -->
    <div class="misc-avatar w-100 text-center">
      <VIcon
        icon="ri-error-warning-line"
        size="128"
        color="warning"
        class="mx-auto"
      />
      <VBtn
        to="/"
        class="mt-10"
      >
        Back to Home
      </VBtn>
    </div>

  </div>
</template>

<style lang="scss">
@use "@core/scss/pages/misc.scss";

</style>
