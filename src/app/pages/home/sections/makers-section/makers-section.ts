import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ZardBadgeComponent } from '@shared/components/badge/badge.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'woodia-makers-section',
  imports: [
    ZardBadgeComponent,
    ZardCardComponent,
    ZardButtonComponent
  ],
  templateUrl: './makers-section.html',
  styleUrl: './makers-section.scss',
})
export class MakersSection {

  makers = [
    {
      id: 1,
      imgPath: '/images/home/maker-1.png',
      name: 'Laila Asmr',
      quote: "Vintage finds and earthy tones shape this thoughtful and timeless interior."
    },
    {
      id: 2,
      imgPath: '/images/home/maker-2.png',
      name: 'Mohamed Ali',
      quote: "Love-filled, style-led: step into a space that’' filled with heart."
    }
  ]

  constructor(
    private router: Router
  ) {}

  navigateToAuth() {
    this.router.navigate(['/auth/register'])
  }

}
