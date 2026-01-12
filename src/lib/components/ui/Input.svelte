<script lang="ts">
  interface Props {
    value?: string
    placeholder?: string
    type?: 'text' | 'email' | 'password' | 'search'
    disabled?: boolean
    class?: string
    oninput?: (e: Event) => void
    onkeydown?: (e: KeyboardEvent) => void
  }

  let {
    value = $bindable(''),
    placeholder = '',
    type = 'text',
    disabled = false,
    class: className = '',
    oninput,
    onkeydown
  }: Props = $props()
</script>

<input
  {type}
  {placeholder}
  {disabled}
  bind:value
  {oninput}
  {onkeydown}
  class="
    w-full px-3 py-2 rounded-md
    bg-bg-secondary border border-border-subtle
    text-text-primary placeholder:text-text-tertiary
    focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
    transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
    {className}
  "
/>
