import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  signal,
  HostListener,
  OnInit,
  inject
} from '@angular/core';

import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { gsap } from 'gsap';

import { IMenuItem } from '@shared/types/app.types';
import { LogoComponent } from '../logo/logo.component';
import { ZardButtonComponent } from '../button/button.component';
import { ZardMenuDirective } from '../menu/menu.directive';
import { ZardMenuItemDirective } from '../menu/menu-item.directive';
import { ZardMenuContentDirective } from '../menu/menu-content.directive';
import { ZardIconComponent } from '../icon/icon.component';

@Component({
  selector: 'woodia-header',
  imports: [
    LogoComponent,
    RouterLink,
    RouterLinkActive,
    ZardButtonComponent,
    ZardMenuDirective,
    ZardMenuItemDirective,
    ZardMenuContentDirective,
    ZardIconComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {

  @Input() menu: IMenuItem[] = [];

  router = inject(Router)

  @ViewChild('mobileMenu') mobileMenu!: ElementRef

  isMenuOpen = signal(false)

  ngOnInit() {

    /** Auto close menu on route change */
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.closeMenu())

  }

  /** Toggle mobile menu */
  toggleMenu() {

    this.isMenuOpen.update(v => !v)

    const menu = this.mobileMenu.nativeElement

    if (this.isMenuOpen()) {

      gsap.to(menu, {
        height: "auto",
        duration: 0.35,
        ease: "power2.out"
      })

    } else {

      gsap.to(menu, {
        height: 0,
        duration: 0.25,
        ease: "power2.in"
      })

    }

  }

  /** Close menu */
  closeMenu() {

    if (!this.isMenuOpen()) return

    this.isMenuOpen.set(false)

    const menu = this.mobileMenu?.nativeElement

    if (menu) {
      gsap.to(menu, {
        height: 0,
        duration: 0.25,
        ease: "power2.in"
      })
    }

  }

  /** Close on outside click */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {

    const target = event.target as HTMLElement
    const header = document.getElementById('app-header')

    if (!header?.contains(target)) {
      this.closeMenu()
    }

  }

  navigateToAuth() {
    this.router.navigate(['/auth'])
  }

}