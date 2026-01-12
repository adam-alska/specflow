<script lang="ts">
  import Skeleton from './Skeleton.svelte'
</script>

<div class="p-4 rounded-xl bg-white dark:bg-bg-secondary border border-slate-200 dark:border-border-subtle">
  <!-- Header -->
  <div class="flex justify-between items-start mb-3">
    <Skeleton width="60px" height="14px" rounded="sm" />
    <Skeleton width="40px" height="18px" rounded="full" />
  </div>

  <!-- Title -->
  <Skeleton width="100%" height="18px" class="mb-2" />
  <Skeleton width="70%" height="18px" class="mb-3" />

  <!-- Description -->
  <Skeleton width="100%" height="12px" class="mb-1" />
  <Skeleton width="85%" height="12px" class="mb-4" />

  <!-- Footer -->
  <div class="flex justify-between items-center">
    <div class="flex gap-2">
      <Skeleton width="50px" height="20px" rounded="full" />
      <Skeleton width="60px" height="20px" rounded="full" />
    </div>
    <div class="flex gap-1">
      <Skeleton width="24px" height="24px" rounded="full" />
      <Skeleton width="24px" height="24px" rounded="full" />
    </div>
  </div>
</div>
