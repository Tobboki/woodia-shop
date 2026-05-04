// Trigger Rebuild
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
  lucideLayoutGrid,
  lucidePlus,
  lucideBlocks,
  lucideEye,
  lucideEyeOff,
  lucideArrowLeft,
  lucideArrowRight,
  lucideSave,
  lucideTrash2,
  lucideLayers,
  lucideLogOut,
  lucideInfo,
  lucideTag,
  lucideImage,
  lucideImagePlus,
  lucideLoader2,
  lucideLoaderCircle,
  lucideWand2,
  lucideCheck,
  lucideSearch,
  lucideChevronsUpDown,
  lucidePencil,
} from '@ng-icons/lucide';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
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
      lucideLayoutGrid,
      lucidePlus,
      lucideBlocks,
      lucideEye,
      lucideEyeOff,
      lucideArrowLeft,
      lucideArrowRight,
      lucideSave,
      lucideTrash2,
      lucideLayers,
      lucideLogOut,
      lucideInfo,
      lucideTag,
      lucideImage,
      lucideImagePlus,
      lucideLoader2,
      lucideLoaderCircle,
      lucideWand2,
      lucideCheck,
      lucideSearch,
      lucideChevronsUpDown,
      lucidePencil,
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTransloco({
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
