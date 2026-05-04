import { Injectable, signal, computed } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import {registerLocaleData} from '@angular/common';

export type TLanguage = 'en' | 'ar'
const STORAGE_KEY = 'language'

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private dirSignal = signal<'ltr' | 'rtl'>(document.documentElement.dir as 'ltr' | 'rtl');

  isRtl = computed(() => this.dirSignal() === 'rtl');

  // Reactive language signal for UI
  lang = signal<TLanguage>('en')

  // Optional computed for display label
  label = computed(() => (this.lang() === 'ar' ? 'العربية' : 'English'))

  locale = computed(() => (this.lang() === 'ar' ? 'ar-EG' : 'en-US'))

  constructor(private transloco: TranslocoService) {}

  translate(key: string, params?: any) {
    return this.transloco.translate(key, params);
  }


  init() {
    // Load saved language from localStorage
    const saved = localStorage.getItem(STORAGE_KEY) as TLanguage | null

    if (saved) {
      this.setLanguage(saved, false)
    } else {
      this.setLanguage('en', false)
    }
  }

  async setLanguage(lang: TLanguage, save = true) {
    this.lang.set(lang)

    if (lang === 'ar') {
      const locale = await import('@angular/common/locales/ar')
      registerLocaleData(locale.default)
    } else {
      const locale = await import('@angular/common/locales/en')
      registerLocaleData(locale.default)
    }

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
