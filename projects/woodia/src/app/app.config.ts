import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  isDevMode
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { OAuthModule, provideOAuthClient } from 'angular-oauth2-oidc';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import {provideTransloco} from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader';
import {provideIcons} from '@ng-icons/core';
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
  lucideEye,
  lucideEyeOff,
  lucideArrowLeft,
  lucideArrowRight,
  lucideArrowDown,
  lucideArrowUp,
  lucideCircleUserRound,
  lucideTruck,
  lucideTriangleAlert,
  lucideImageOff,
  lucideImage,
  lucideLogOut,
  lucideLink,
  lucideLink2,
  lucideBell,
  lucideSettings,
  lucideMessagesSquare,
} from '@ng-icons/lucide';

export const appConfig: ApplicationConfig = {
  providers: [
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
      lucideEye,
      lucideEyeOff,
      lucideArrowLeft,
      lucideArrowRight,
      lucideArrowDown,
      lucideArrowUp,
      lucideCircleUserRound,
      lucideTruck,
      lucideTriangleAlert,
      lucideImageOff,
      lucideImage,
      lucideLogOut,
      lucideLink,
      lucideLink2,
      lucideBell,
      lucideSettings,
      lucideMessagesSquare,
    }),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(OAuthModule.forRoot()),
    provideOAuthClient(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'ar'],
        defaultLang: 'ar',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideHttpClient(),
  ]
};
