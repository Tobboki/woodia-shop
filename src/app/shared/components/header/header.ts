import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


import { LogoComponent } from '@shared/components/logo/logo.component';
import { AuthService } from '@shared/services/auth';
import { ZardMenuModule } from '../menu/menu.module';
import { ZardMenuDirective } from '../menu/menu.directive';
import { CustomerSettingsService } from '@shared/services/customer-settings-service';
import { ZardButtonComponent } from '../button/button.component';
import { ZardIconComponent } from '../icon/icon.component';

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
  ) {}

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
