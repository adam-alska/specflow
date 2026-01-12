import { defineConfig, presetUno, presetIcons, presetWebFonts } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'JetBrains Mono:400,500',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
  ],
  theme: {
    colors: {
      // Light mode colors (default)
      bg: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
        elevated: 'var(--bg-elevated)',
      },
      text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
      },
      border: {
        DEFAULT: 'var(--border-color)',
        subtle: 'var(--border-subtle)',
      },
      accent: {
        DEFAULT: 'var(--accent)',
        hover: 'var(--accent-hover)',
        muted: 'var(--accent-muted)',
      },
      priority: {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#eab308',
        low: '#22c55e',
      },
      status: {
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    animation: {
      keyframes: {
        'fade-in': '{from{opacity:0}to{opacity:1}}',
        'fade-out': '{from{opacity:1}to{opacity:0}}',
        'slide-in-up': '{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
        'slide-in-down': '{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}',
        'scale-in': '{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}',
        'pulse-subtle': '{0%,100%{opacity:1}50%{opacity:0.7}}',
        'typing': '{0%{opacity:0.3}50%{opacity:1}100%{opacity:0.3}}',
      },
      durations: {
        'fade-in': '150ms',
        'fade-out': '150ms',
        'slide-in-up': '200ms',
        'slide-in-down': '200ms',
        'scale-in': '200ms',
        'pulse-subtle': '2s',
        'typing': '1.4s',
      },
      timingFns: {
        'fade-in': 'ease-out',
        'fade-out': 'ease-in',
        'slide-in-up': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-down': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  shortcuts: {
    // Layout
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',

    // Cards & Surfaces
    'card': 'bg-bg-secondary rounded-lg border border-border-subtle shadow-sm',
    'card-hover': 'card hover:bg-bg-tertiary hover:border-border transition-all duration-150',
    'card-elevated': 'bg-bg-elevated rounded-lg border border-border shadow-lg',

    // Buttons
    'btn': 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    'btn-primary': 'btn bg-accent text-white hover:bg-accent-hover active:scale-98',
    'btn-secondary': 'btn bg-bg-tertiary text-text-primary hover:bg-bg-elevated border border-border-subtle',
    'btn-ghost': 'btn bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
    'btn-icon': 'btn p-2 bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',

    // Inputs
    'input': 'w-full px-3 py-2 bg-bg-secondary border border-border-subtle rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-150',
    'textarea': 'input resize-none',

    // Text styles
    'text-heading': 'text-text-primary font-semibold',
    'text-body': 'text-text-primary',
    'text-muted': 'text-text-secondary',
    'text-subtle': 'text-text-tertiary',

    // Priority badges
    'badge': 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
    'badge-critical': 'badge bg-priority-critical/20 text-priority-critical',
    'badge-high': 'badge bg-priority-high/20 text-priority-high',
    'badge-medium': 'badge bg-priority-medium/20 text-priority-medium',
    'badge-low': 'badge bg-priority-low/20 text-priority-low',

    // Status badges
    'status-dot': 'w-2 h-2 rounded-full',
    'status-success': 'status-dot bg-status-success',
    'status-warning': 'status-dot bg-status-warning',
    'status-error': 'status-dot bg-status-error',
    'status-info': 'status-dot bg-status-info',

    // Kanban specific
    'kanban-column': 'flex flex-col min-h-full w-72 flex-shrink-0',
    'kanban-card': 'card-hover p-3 cursor-grab active:cursor-grabbing active:scale-[1.02] active:shadow-lg',

    // Focus styles
    'focus-ring': 'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary',
  },
  safelist: [
    'i-lucide-plus',
    'i-lucide-x',
    'i-lucide-check',
    'i-lucide-chevron-down',
    'i-lucide-chevron-right',
    'i-lucide-more-horizontal',
    'i-lucide-grip-vertical',
    'i-lucide-message-square',
    'i-lucide-file-text',
    'i-lucide-layout-kanban',
    'i-lucide-sun',
    'i-lucide-moon',
    'i-lucide-search',
    'i-lucide-settings',
    'i-lucide-user',
    'i-lucide-send',
    'i-lucide-sparkles',
  ],
})
