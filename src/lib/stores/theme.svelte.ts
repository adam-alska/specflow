// Theme store using Svelte 5 runes
import { browser } from '$app/environment'

type Theme = 'light' | 'dark' | 'system'

class ThemeStore {
  #theme = $state<Theme>('system')
  #resolved = $state<'light' | 'dark'>('light')

  constructor() {
    if (browser) {
      // Load saved preference
      const saved = localStorage.getItem('specflow-theme') as Theme | null
      if (saved) {
        this.#theme = saved
      }
      this.#updateResolved()

      // Listen for system preference changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.#theme === 'system') {
          this.#updateResolved()
        }
      })
    }
  }

  get theme() {
    return this.#theme
  }

  get resolved() {
    return this.#resolved
  }

  get isDark() {
    return this.#resolved === 'dark'
  }

  set(theme: Theme) {
    this.#theme = theme
    if (browser) {
      localStorage.setItem('specflow-theme', theme)
    }
    this.#updateResolved()
  }

  toggle() {
    this.set(this.#resolved === 'dark' ? 'light' : 'dark')
  }

  #updateResolved() {
    if (this.#theme === 'system') {
      this.#resolved = browser && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } else {
      this.#resolved = this.#theme
    }

    // Update DOM
    if (browser) {
      document.documentElement.classList.toggle('dark', this.#resolved === 'dark')
    }
  }
}

export const theme = new ThemeStore()
