import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import {
  lucideSun,
  lucideMoon,
  lucideMonitor,
  lucideGlobe,
  lucideLanguages,
  lucideX,
  lucidePanelLeft,
  lucidePanelLeftClose,
  lucidePanelRight,
  lucidePanelRightClose,
  lucideMenu,
  lucideChevronRight,
  lucideChevronLeft,
  lucideChevronDown,
  lucideChevronUp,
  lucideHouse,
  lucideArmchair,
  lucideLayoutGrid
} from '@ng-icons/lucide';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import {provideIcons} from '@ng-icons/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideIcons({
      lucideSun,
      lucideMoon,
      lucideMonitor,
      lucideGlobe,
      lucideLanguages,
      lucideX,
      lucidePanelLeft,
      lucidePanelLeftClose,
      lucidePanelRight,
      lucidePanelRightClose,
      lucideMenu,
      lucideChevronRight,
      lucideChevronLeft,
      lucideChevronDown,
      lucideChevronUp,
      lucideHouse,
      lucideArmchair,
      lucideLayoutGrid
    }),
    provideRouter(routes), provideHttpClient(), provideTransloco({
        config: {
          availableLangs: ['en', 'ar'],
          defaultLang: 'en',
          // Remove this option if your application doesn't support changing language in runtime.
          reRenderOnLangChange: true,
          prodMode: !isDevMode(),
        },
        loader: TranslocoHttpLoader
      })
  ]
};
