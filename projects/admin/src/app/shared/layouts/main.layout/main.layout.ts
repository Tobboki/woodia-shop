import { ZardButtonComponent } from '@shared-components/button';
import { LayoutImports } from '@shared-components/layout';
import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LogoComponent } from "@shared-components/custom/logo/logo.component";
import { ZardMenuImports } from '@shared-components/menu';
import { ZardTooltipImports } from '@shared-components/tooltip';
import { ThemeService } from '@admin-shared/services/theme.service';
import { TThemeMode } from '@admin-types/data-table.types';
import navGroups from '@admin-shared/navigation'
import { LanguageService } from '@admin-shared/services/language.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {NgIcon} from '@ng-icons/core';

@Component({
  selector: 'app-main.layout',
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

  readonly sidebarCollapsed = signal(false);
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
  ) {}

  toggleSidebar() {
    this.sidebarCollapsed.update(c => !c);
  }

  onCollapsedChange(collapsed: boolean) {
    this.sidebarCollapsed.set(collapsed);
  }

  setThemeMode(mode: TThemeMode) {
    this.themeService.setMode(mode)
  }
}
