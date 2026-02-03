import { AfterViewInit, Component, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap'

import { LogoComponent } from '@shared/components/logo/logo.component';
import { AuthService } from '@shared/services/auth';
import { ZardMenuModule } from '@shared/components/menu/menu.module';
import { ZardMenuDirective } from '@shared/components/menu/menu.directive';
import { CustomerSettingsService } from '@shared/services/customer-settings-service';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardAvatarComponent } from '@shared/components/avatar/avatar.component';
import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'woodia-header',
  imports: [
    CommonModule,
    LogoComponent,
    ZardMenuModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardMenuModule,
    ZardMenuModule,
    ZardAvatarComponent,
    RouterLink,
    RouterLinkActive,
],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  isMenuOpen = false;
  userData: any;

  constructor (
    private router: Router,
    private authService: AuthService,
    // private userService: CustomerSettingsService,
  ) {
    // effect(() => {
    //   const newY = this.currentScrollY()
    //   const lastY = this.lastScrollY()

    //   if (newY === 0) {
    //     this.isNavVisible.set(true)
    //   } else if (newY > lastY) {
    //     this.isNavVisible.set(false)
    //   } else if (newY < lastY) {
    //     this.isNavVisible.set(true)
    //   }

    //   this.lastScrollY.set(newY)
    // })
    
    // effect(() => {
    //   const visible = this.isNavVisible()

    //   gsap.to('#app-header', {
    //     y: visible ? 0 : -100,
    //     opacity: visible ? 1 : 0,
    //     duration: 0.2,
    //     ease: 'power1.out',
    //   })
    // })
  }

  user: any;
  userName: string | undefined;

  ngOnInit(): void {
    // this.userData = this.userService.me();
    // console.log('user data', this.userData)

    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.userName = this.user.firstName + ' ' + this.user.lastName;
    }

  }

  currentScrollY = signal(0)
  lastScrollY = signal(0)
  isNavVisible = signal(true)

  private scrollSub!: Subscription

  // ngAfterViewInit() {
  //   this.initScrollListener()
  // }

  // ngOnDestroy() {
  //   this.scrollSub?.unsubscribe()
  // }

  // private initScrollListener() {
  //   this.scrollSub = fromEvent(window, 'scroll').subscribe(() => {
  //     this.currentScrollY.set(window.scrollY || 0)
  //   })
  // }



  handleLogout() {
    this.authService.logout()
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  goToSettings() {
    this.router.navigate(['/customers/settings/'])
  }

}
