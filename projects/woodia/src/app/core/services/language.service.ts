import { Injectable, signal, computed } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'

export type TLanguage = 'en' | 'ar'
const STORAGE_KEY = 'language'

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  // Reactive language signal for UI
  lang = signal<TLanguage>('en')

  // Optional computed for display label
  label = computed(() => (this.lang() === 'ar' ? 'العربية' : 'English'))

  constructor(private transloco: TranslocoService) {}

  init() {
    // Load saved language from localStorage
    const saved = localStorage.getItem(STORAGE_KEY) as TLanguage | null

    if (saved) {
      this.setLanguage(saved, false)
    } else {
      this.setLanguage('en', false)
    }
  }

  setLanguage(lang: TLanguage, save = true) {
    this.lang.set(lang)

    // Update Transloco runtime language
    this.transloco.setActiveLang(lang)

    // Save choice
    if (save) localStorage.setItem(STORAGE_KEY, lang)

    // Update HTML direction
    this.applyDirection()
  }

  private applyDirection() {
    const html = document.documentElement

    if (this.lang() === 'ar') {
      html.setAttribute('dir', 'rtl')
      html.setAttribute('lang', 'ar')
    } else {
      html.setAttribute('dir', 'ltr')
      html.setAttribute('lang', 'en')
    }
  }
}
