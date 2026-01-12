<script lang="ts">
  import { sound } from '$lib/stores'

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
  type Size = 'sm' | 'md' | 'lg'

  interface Props {
    variant?: Variant
    size?: Size
    disabled?: boolean
    loading?: boolean
    icon?: boolean
    class?: string
    onclick?: (e: MouseEvent) => void
    type?: 'button' | 'submit' | 'reset'
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon = false,
    class: className = '',
    onclick,
    type = 'button',
    children
  }: Props & { children?: any } = $props()

  const variantClasses: Record<Variant, string> = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-bg-tertiary text-text-primary hover:bg-bg-elevated border border-border-subtle',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  }

  const sizeClasses: Record<Size, string> = {
    sm: icon ? 'p-1.5 text-sm' : 'px-3 py-1.5 text-sm',
    md: icon ? 'p-2' : 'px-4 py-2',
    lg: icon ? 'p-3' : 'px-6 py-3 text-lg',
  }

  function handleClick(e: MouseEvent) {
    if (!disabled && !loading) {
      sound.play('click')
      onclick?.(e)
    }
  }
</script>

<button
  {type}
  {disabled}
  class="
    inline-flex items-center justify-center gap-2 rounded-md font-medium
    transition-all duration-150 cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-98 focus-ring
    {variantClasses[variant]}
    {sizeClasses[size]}
    {className}
  "
  onclick={handleClick}
>
  {#if loading}
    <span class="i-lucide-loader-2 animate-spin" />
  {/if}
  {@render children?.()}
</button>
