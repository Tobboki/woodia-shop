import { Component, signal } from '@angular/core';

import { LayoutModule } from '@angular/cdk/layout';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ContentComponent } from '@shared-components/layout/content.component';
import { SidebarComponent } from '@shared-components/layout/sidebar.component';
import { LayoutComponent } from '@shared-components/layout/layout.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {IconType, NgIcon} from '@ng-icons/core';

interface IMenuItem {
  icon: IconType
  label: string
  link: string
  submenu?: IMenuItem[];
}

@Component({
  selector: 'woodia-settings',
  imports: [
    LayoutModule,
    LayoutComponent,
    SidebarComponent,
    ContentComponent,
    ZardButtonComponent,
    NgIcon,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  readonly showMobileSettings = signal(false);

  mainMenuItems: IMenuItem[] = [
    {
      icon: 'lucideCircleUserRound',
      label: 'Account',
      link: 'account'
    },
    {
      icon: 'lucideTruck',
      label: 'Shipping',
      link: 'shipping'
    },
  ];

  toggleMobileSettings() {
    this.showMobileSettings.update( val => !val)
  }
}
