import { Component, Input, signal } from '@angular/core';
import { LogoComponent } from '../custom/logo/logo.component';
import { RouterLink } from '@angular/router';
import { ZardDividerComponent } from "@shared/components/divider/divider.component";
import { IMenuItem } from '@shared/types/app.types';
import {ZardAccordionImports} from '@shared/components/accordion';
import {ZardButtonComponent} from '@shared/components/button';
import {ZardIconComponent} from '@shared/components/icon/icon.component';


interface IFooterMenuItem {
  name: string
  links: IMenuItem[]
}

@Component({
  selector: 'woodia-footer',
  imports: [
    ZardAccordionImports,
    RouterLink,
    ZardDividerComponent,
    ZardButtonComponent,
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})

export class Footer {
  @Input() menu: IMenuItem[] = []

  linkGroups: IFooterMenuItem[] = [
    {
      name: 'Information',
      links: [
        {
          id: 'faq',
          label: 'FAQ',
          path: '/home'
        },
        {
          id: 'terms-conditions',
          label: 'Terms & Conditions',
          path: '/home'
        },
        {
          id: 'privacy-policy',
          label: 'Privacy Policy',
          path: '/home'
        },
      ]
    },
    {
      name: 'Follow Us',
      links: [
        {
          id: 'facebook',
          label: 'Facebook',
          path: 'https://www.facebook.com'
        },
        {
          id: 'instagram',
          label: 'Instagram',
          path: 'https://www.instagram.com'
        },
        {
          id: 'pinterest',
          label: 'Pinterest',
          path: 'https://www.pinterest.com'
        },
        {
          id: 'tiktok',
          label: 'Tiktok',
          path: 'https://www.tiktok.com'
        },
      ]
    },
    {
      name: 'Resources',
      links: [
        {
          id: 'media-kit',
          label: 'Media Kit',
          path: 'https://drive.google.com/drive/folders/1ZLbLmXqowOd0HifAsK0BAFE6pqkUwkXQ?usp=drive_link'
        },
      ]
    },
  ]
}

