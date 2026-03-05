import { Component } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';
import { RouterLink } from '@angular/router';
import { ZardDividerComponent } from "../divider/divider.component";

interface ILink {
  name: string
  link: string
}

interface ILinkGroup {
  name: string
  links: ILink[]
}

@Component({
  selector: 'woodia-footer',
  imports: [
    LogoComponent,
    RouterLink,
    ZardDividerComponent
],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})

export class Footer {
  linkGroups: ILinkGroup[] = [
    {
      name: 'Woodia',
      links: [
        {
          name: 'Home',
          link: '/'
        },
        {
          name: 'Designs',
          link: '/designs'
        },
        {
          name: 'Our Story',
          link: '/our-story'
        },
        {
          name: 'Contact Us',
          link: '/designs'
        },
      ]
    },
    {
      name: 'Information',
      links: [
        {
          name: 'FAQ',
          link: '/designs'
        },
        {
          name: 'Terms & Conditions',
          link: '/designs'
        },
        {
          name: 'Privacy Policy',
          link: '/designs'
        },
      ]
    },
    {
      name: 'Media',
      links: [
        {
          name: 'Facebook',
          link: '/designs'
        },
        {
          name: 'Instagram',
          link: '/designs'
        },
        {
          name: 'Pinterest',
          link: '/designs'
        },
        {
          name: 'Tiktok',
          link: '/designs'
        },
      ]
    },
    {
      name: 'Resources',
      links: [
        {
          name: 'Media Kit',
          link: '/designs'
        },
      ]
    },
  ]
}

