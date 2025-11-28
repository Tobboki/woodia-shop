import { Component, signal } from '@angular/core';
import { ZardIcon } from '@shared/components/icon/icons';

import { LayoutModule } from '@angular/cdk/layout';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ContentComponent } from '@shared/components/layout/content.component';
import { SidebarComponent } from '@shared/components/layout/sidebar.component';
import { LayoutComponent } from '@shared/components/layout/layout.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ZardFormModule } from '@shared/components/form/form.module';

interface IMenuItem {
  icon: ZardIcon
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
    ZardIconComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  // readonly sidebarCollapsed = signal(false);
 
  mainMenuItems: IMenuItem[] = [
    {
      icon: 'account',
      label: 'Account',
      link: 'account'
    },
    {
      icon: 'truck',
      label: 'Shipping',
      link: 'shipping'
    },
  ];
}
