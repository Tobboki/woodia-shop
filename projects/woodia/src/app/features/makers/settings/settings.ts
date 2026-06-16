import { Component, signal } from '@angular/core';

import { LayoutModule } from '@angular/cdk/layout';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ContentComponent } from '@shared-components/layout/content.component';
import { SidebarComponent } from '@shared-components/layout/sidebar.component';
import { LayoutComponent } from '@shared-components/layout/layout.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconType, NgIcon } from '@ng-icons/core';
import { TranslocoDirective } from '@jsverse/transloco';

interface IMenuItem {
  icon: IconType
  label: string
  link: string
  submenu?: IMenuItem[];
}

@Component({
  selector: 'woodia-maker-settings',
  imports: [
    LayoutModule,
    LayoutComponent,
    SidebarComponent,
    ContentComponent,
    ZardButtonComponent,
    NgIcon,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoDirective
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class MakerSettings {
  readonly showMobileSettings = signal(false);

  mainMenuItems: IMenuItem[] = [
    {
      icon: 'lucideCircleUserRound',
      label: 'Account',
      link: 'account'
    },
    {
      icon: 'lucidePhone',
      label: 'Contact Info',
      link: 'contact-info'
    },
  ];

  toggleMobileSettings() {
    this.showMobileSettings.update(val => !val)
  }
}
