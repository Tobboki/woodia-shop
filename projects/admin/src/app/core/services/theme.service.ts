import { Injectable, signal, computed } from '@angular/core'
import { TThemeMode } from '@admin-types/data-table.types'
import type { IconType } from '@ng-icons/core';

const STORAGE_KEY = 'theme-mode'

@Injectable({
  providedIn: 'root',
})
export class ThemeService {

  mode = signal<TThemeMode>('system')

  icon = computed<IconType>(() => {
    switch (this.mode()) {
      case 'light':
        return 'lucideSun'
      case 'dark':
        return 'lucideMoon'
      default:
        return 'lucideMonitor'
    }
  })

  init() {
    const saved = localStorage.getItem(STORAGE_KEY) as TThemeMode | null

    if (saved) {
      this.setMode(saved)
    } else {
      this.setMode('system')
    }

    // listen for OS theme changes
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    media.addEventListener('change', e => {
      if (this.mode() === 'system') {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    })
  }

  setMode(mode: TThemeMode) {
    this.mode.set(mode)

    localStorage.setItem(STORAGE_KEY, mode)

    const html = document.documentElement

    if (mode === 'dark') {
      html.classList.add('dark')
      return
    }

    if (mode === 'light') {
      html.classList.remove('dark')
      return
    }

    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    html.classList.toggle('dark', prefersDark)
  }
}
