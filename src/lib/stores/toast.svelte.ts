// Toast notification store using Svelte 5 runes
import { browser } from '$app/environment'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  duration: number
  icon?: string
}

class ToastStore {
  #toasts = $state<Toast[]>([])
  #counter = 0

  get all() {
    return this.#toasts
  }

  add(toast: Omit<Toast, 'id'>) {
    const id = `toast_${++this.#counter}`
    const newToast: Toast = { ...toast, id }

    this.#toasts = [...this.#toasts, newToast]

    // Auto-remove after duration
    if (browser && toast.duration > 0) {
      setTimeout(() => this.remove(id), toast.duration)
    }

    return id
  }

  remove(id: string) {
    this.#toasts = this.#toasts.filter(t => t.id !== id)
  }

  clear() {
    this.#toasts = []
  }

  // Convenience methods
  success(message: string, description?: string) {
    return this.add({
      type: 'success',
      message,
      description,
      duration: 3000,
      icon: 'i-lucide-check-circle'
    })
  }

  error(message: string, description?: string) {
    return this.add({
      type: 'error',
      message,
      description,
      duration: 5000,
      icon: 'i-lucide-x-circle'
    })
  }

  warning(message: string, description?: string) {
    return this.add({
      type: 'warning',
      message,
      description,
      duration: 4000,
      icon: 'i-lucide-alert-triangle'
    })
  }

  info(message: string, description?: string) {
    return this.add({
      type: 'info',
      message,
      description,
      duration: 3000,
      icon: 'i-lucide-info'
    })
  }
}

export const toast = new ToastStore()
