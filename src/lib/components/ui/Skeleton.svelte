<script lang="ts">
  interface Props {
    width?: string
    height?: string
    rounded?: 'sm' | 'md' | 'lg' | 'full'
    class?: string
  }

  let {
    width = '100%',
    height = '1rem',
    rounded = 'md',
    class: className = ''
  }: Props = $props()

  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }
</script>

<div
  class="animate-pulse bg-gradient-to-r from-bg-tertiary via-bg-secondary to-bg-tertiary bg-[length:200%_100%] {roundedClass[rounded]} {className}"
  style="width: {width}; height: {height};"
></div>

<style>
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .animate-pulse {
    animation: shimmer 2s infinite linear;
  }
</style>
