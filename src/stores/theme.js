// src/stores/theme.js
// Global dark/light mode store — persists across sessions
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  // ── Init from localStorage ──────────────────────────────────
  const init = () => {
    const saved = localStorage.getItem('upm_theme')
    if (saved === 'dark') {
      isDark.value = true
    } else if (saved === null) {
      // Default: system preference
      isDark.value = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    }
    applyTheme()
  }

  const applyTheme = () => {
    const root = document.documentElement
    if (isDark.value) {
      root.setAttribute('data-theme', 'dark')
      root.classList.add('dark')
    } else {
      root.setAttribute('data-theme', 'light')
      root.classList.remove('dark')
    }
  }

  const toggle = () => {
    isDark.value = !isDark.value
    localStorage.setItem('upm_theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  const setDark  = () => { isDark.value = true;  localStorage.setItem('upm_theme', 'dark');  applyTheme() }
  const setLight = () => { isDark.value = false; localStorage.setItem('upm_theme', 'light'); applyTheme() }

  return { isDark, init, toggle, setDark, setLight }
})
