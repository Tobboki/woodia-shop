import { ZardButtonComponent } from '@shared-components/button';
import { LayoutImports } from '@shared-components/layout';
import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LogoComponent } from "@shared-components/custom/logo/logo.component";
import { ZardMenuImports } from '@shared-components/menu';
import { ZardTooltipImports } from '@shared-components/tooltip';
import { ThemeService } from '@admin-core/services/theme.service';
import { TThemeMode } from '@admin-types/data-table.types';
import navGroups from '@admin-shared/navigation'
import { LanguageService } from '@admin-core/services/language.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {NgIcon} from '@ng-icons/core';
import { AuthService } from '@admin-core/services/auth.service';
import { LayoutService } from '@admin-core/services/layout.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-main',
  imports: [
    RouterOutlet,
    LayoutImports,
    ZardButtonComponent,
    NgIcon,
    LogoComponent,
    ZardMenuImports,
    ZardTooltipImports,
    RouterLink,
    RouterLinkActive,
    TranslocoDirective,
    NgTemplateOutlet,
    CommonModule,
  ],
  templateUrl: './main.layout.html',
  styleUrl: './main.layout.scss',
})
export class MainLayout {

  navGroups = navGroups

  private layoutService = inject(LayoutService);
  sidebarCollapsed = this.layoutService.sidebarCollapsed;
  readonly mobileNavOpen = signal(false);
  readonly isRtl = computed(() => this.langService.lang() === 'ar');

  mobileSidebarClasses() {
    const open = this.mobileNavOpen();
    const rtl = this.isRtl();

    const position = rtl ? 'right-0' : 'left-0';
    const transform = open
      ? 'translate-x-0'
      : rtl
      ? 'translate-x-full'
      : '-translate-x-full';

    return `${position} ${transform} transform transition-transform duration-300`;
  }

  constructor(
    public themeService: ThemeService,
    public langService: LanguageService,
    private authService: AuthService,
  ) {}

  currentUser = computed(() => this.authService.getCurrentUser());

  logout() {
    this.authService.logout();
  }

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  onCollapsedChange(collapsed: boolean) {
    this.layoutService.setCollapsed(collapsed);
  }

  setThemeMode(mode: TThemeMode) {
    this.themeService.setMode(mode)
  }
}
