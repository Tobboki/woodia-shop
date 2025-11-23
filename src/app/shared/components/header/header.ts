import { Component } from '@angular/core';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { AuthService } from '@shared/services/auth';

@Component({
  selector: 'woodia-header',
  imports: [
    LogoComponent,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  constructor (
    private authService: AuthService
  ) {}
  
  handleLogout() {
    this.authService.logout()
  }

}
