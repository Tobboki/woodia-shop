import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardDividerComponent } from "@shared-components/divider/divider.component";
import { IMenuItem } from '@shared-types/app.types';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardAccordionImports } from '@shared-components/accordion';
import { LogoComponent } from "shared-lib/components/custom/logo/logo.component";
import { TranslocoDirective } from '@jsverse/transloco';

interface IFooterMenuItem {
  name: string
  links: IMenuItem[]
}

@Component({
  selector: 'woodia-footer',
  imports: [
    RouterLink,
    ZardDividerComponent,
    ZardButtonComponent,
    ZardAccordionImports,
    LogoComponent,
    TranslocoDirective
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})

export class Footer {
  @Input() menu: IMenuItem[] = []

  linkGroups: IFooterMenuItem[] = [
    {
      name: 'app.footer.information',
      links: [
        {
          id: 'faq',
          label: 'app.footer.faq',
          path: '/home'
        },
        {
          id: 'terms-conditions',
          label: 'app.footer.termsConditions',
          path: '/home'
        },
        {
          id: 'privacy-policy',
          label: 'app.footer.privacyPolicy',
          path: '/home'
        },
      ]
    },
    {
      name: 'app.footer.followUs',
      links: [
        {
          id: 'facebook',
          label: 'app.footer.facebook',
          path: 'https://www.facebook.com'
        },
        {
          id: 'instagram',
          label: 'app.footer.instagram',
          path: 'https://www.instagram.com'
        },
        {
          id: 'pinterest',
          label: 'app.footer.pinterest',
          path: 'https://www.pinterest.com'
        },
        {
          id: 'tiktok',
          label: 'app.footer.tiktok',
          path: 'https://www.tiktok.com'
        },
      ]
    },
    {
      name: 'app.footer.resources',
      links: [
        {
          id: 'media-kit',
          label: 'app.footer.mediaKit',
          path: 'https://drive.google.com/drive/folders/1ZLbLmXqowOd0HifAsK0BAFE6pqkUwkXQ?usp=drive_link'
        },
      ]
    },
  ]
}
