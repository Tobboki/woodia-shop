import {
  Component,
  Input,
  signal,
  OnInit,
  TemplateRef,
  computed,
  viewChild,
  NgZone,
  ChangeDetectorRef,
  AfterViewInit,
  effect
} from '@angular/core';

import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { IMenuItem, TThemeMode } from 'shared-lib/types/app.types';
import { LogoComponent } from 'shared-lib/components/custom/logo/logo.component';
import { ZardButtonComponent } from 'shared-lib/components/button';
import { LanguageService } from '@woodia-core/services/language.service';
import { ThemeService } from '@woodia-core/services/theme.service';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { ZardMenuImports } from 'shared-lib/components/menu';
import { ZardDividerComponent } from 'shared-lib/components/divider/divider.component';
import { ZardAvatarComponent } from 'shared-lib/components/avatar/avatar.component';
import { AuthService } from '@woodia-core/services/auth.service';
import { ZardAccordionImports } from 'shared-lib/components/accordion';
import { NgIcon } from '@ng-icons/core';
import { CustomerSettingsService } from '@woodia-core/services/customer-settings-service';

@Component({
  selector: 'woodia-header',
  imports: [
    LogoComponent,
    RouterLink,
    RouterLinkActive,
    ZardButtonComponent,
    NgIcon,
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
export class Header implements OnInit, AfterViewInit {

  @Input() menu: IMenuItem[] = [];

  constructor(
    protected themeService: ThemeService,
    protected langService: LanguageService,
    protected authService: AuthService,
    private customerSettingsService: CustomerSettingsService,
    private zone: NgZone,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.isMenuOpen.set(false);
    });

    // Reactive Profile Picture
    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();
      const mode = this.themeService.mode();

      if (isAuthenticated) {
        this.customerSettingsService.getMe().subscribe({
          next: data => {
            this.userPFP.set(data.photoUrl || (mode === 'dark' ? this.profilePicturePlaceholderDark : this.profilePicturePlaceholder));
          },
          error: err => {
            this.userPFP.set(mode === 'dark' ? this.profilePicturePlaceholderDark : this.profilePicturePlaceholder);
            console.log(err);
          }
        });
      } else {
        this.userPFP.set(mode === 'dark' ? this.profilePicturePlaceholderDark : this.profilePicturePlaceholder);
      }
    });
  }

  profilePicturePlaceholder = '/images/customer/settings/account/profile-picture-placeholder.png'
  profilePicturePlaceholderDark = '/images/customer/settings/account/profile-picture-placeholder-dark.png'
  readonly userPFP = signal<string>('')

  readonly isRtl = computed(() => this.langService.lang() === 'ar');

  ngOnInit() {
  }


  isHeaderHidden = signal(false);

  readonly landingRef = viewChild<TemplateRef<any>>('landingActions');
  readonly customerRef = viewChild<TemplateRef<any>>('customerActions');
  readonly currentActions = computed(() => {
    const isAuthenticated = this.authService.isAuthenticated()
    return isAuthenticated ? this.customerRef() : this.landingRef();
  });

  readonly settingsPath = computed(() => {
    const user = this.authService.getCurrentUser();
    if (user?.userType === 'MAKER') return '/makers/settings';
    return '/customers/settings';
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

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      this.zone.runOutsideAngular(() => {
        let lastScrollTop = 0;

        window.addEventListener('scroll', () => {
          const currentScroll = window.scrollY || document.documentElement.scrollTop;

          let shouldHide = this.isHeaderHidden();

          if (currentScroll > 80 && currentScroll > lastScrollTop) {
            shouldHide = true;
          } else if (currentScroll < lastScrollTop) {
            shouldHide = false;
          }

          if (this.isHeaderHidden() !== shouldHide) {
            this.isHeaderHidden.set(shouldHide);
            this.cdr.detectChanges(); // Trigger local change detection only
          }

          lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        }, { passive: true });
      });
    }
  }
}
