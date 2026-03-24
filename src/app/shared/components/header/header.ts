import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  signal,
  HostListener,
  OnInit,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { gsap } from 'gsap';

import {IMenuItem, TThemeMode} from '@shared/types/app.types';
import { LogoComponent } from '../custom/logo/logo.component';
import { ZardButtonComponent } from '@shared/components/button';
import { ZardIconComponent } from '../icon/icon.component';
import {LanguageService} from '@core/services/language.service';
import {ThemeService} from '@core/services/theme.service';
import {CommonModule} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {ZardMenuImports} from '@shared/components/menu';
import {ZardDividerComponent} from '@shared/components/divider/divider.component';
import {ZardAvatarComponent} from '@shared/components/avatar/avatar.component';
import {AuthService} from '@core/services/auth.service';
import {ZardAccordionImports} from '@shared/components/accordion';

@Component({
  selector: 'woodia-header',
  imports: [
    LogoComponent,
    RouterLink,
    RouterLinkActive,
    ZardButtonComponent,
    ZardIconComponent,
    ZardMenuImports,
    TranslocoDirective,
    CommonModule,
    ZardDividerComponent,
    CommonModule,
    ZardAvatarComponent,
    ZardAccordionImports,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  @Input() menu: IMenuItem[] = [];

  constructor(
    public themeService: ThemeService,
    public langService: LanguageService,
    public authService: AuthService,
  ) {}
  readonly isRtl = computed(() => this.langService.lang() === 'ar');

  readonly landingRef = viewChild<TemplateRef<any>>('landingActions');
  readonly customerRef = viewChild<TemplateRef<any>>('customerActions');
  readonly currentActions = computed(() => {
    const isAuthenticated = this.authService.isAuthenticated()
    return isAuthenticated ? this.customerRef() : this.landingRef();
  });

  isMenuOpen = signal(false)
  readonly landingMobileMeniRef = viewChild<TemplateRef<any>>('landingMobileMenu');
  readonly customerMobileMenuRef = viewChild<TemplateRef<any>>('customerMobileMenu');
  readonly currentMobileMenu = computed(() => {
    const isAuthenticated = this.authService.isAuthenticated()
    return isAuthenticated ? this.customerMobileMenuRef() : this.landingMobileMeniRef();

  })

  mobileSidebarClasses() {
    const open = this.isMenuOpen();
    const rtl = this.isRtl();

    const position = rtl ? 'left-0' : 'right-0';
    const transform = open
      ? 'translate-x-0'
      : rtl
        ? '-translate-x-full'
        : 'translate-x-full';

    return `${position} ${transform} transform transition-transform duration-300`;
  }

  setThemeMode(mode: TThemeMode) {
    this.themeService.setMode(mode)
  }

  handleLogout() {
    this.authService.logout()
  }

}
