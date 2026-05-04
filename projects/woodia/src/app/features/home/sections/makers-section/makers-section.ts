
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ZardCarouselComponent, ZardCarouselContentComponent, ZardCarouselItemComponent } from '@shared-components/carousel';
import { MakerCard } from "@woodia-shared/components/maker-card/maker-card";
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'woodia-makers-section',
  imports: [
    ZardCarouselComponent,
    ZardCarouselContentComponent,
    ZardCarouselItemComponent,
    ZardButtonComponent,
    MakerCard,
    TranslocoDirective
],
  templateUrl: './makers-section.html',
  styleUrl: './makers-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MakersSection {

  zardCarouselOptions = {
    loop: true,
    align: 'center' as const,
  };

  makers = [
    {
      id: 1,
      imgPath: '/images/home/makers-section/maker-1.webp',
      name: 'features.home.makers.names.1',
      quote: "features.home.makers.quotes.1"
    },
    {
      id: 2,
      imgPath: '/images/home/makers-section/maker-2.webp',
      name: 'features.home.makers.names.2',
      quote: "features.home.makers.quotes.2"
    },
    {
      id: 3,
      imgPath: '/images/home/makers-section/maker-3.webp',
      name: 'features.home.makers.names.3',
      quote: "features.home.makers.quotes.3"
    },
    {
      id: 4,
      imgPath: '/images/home/makers-section/maker-4.webp',
      name: 'features.home.makers.names.4',
      quote: "features.home.makers.quotes.4"
    },
    {
      id: 5,
      imgPath: '/images/home/makers-section/maker-5.webp',
      name: 'features.home.makers.names.5',
      quote: "features.home.makers.quotes.5"
    },
    {
      id: 6,
      imgPath: '/images/home/makers-section/maker-6.webp',
      name: 'features.home.makers.names.6',
      quote: "features.home.makers.quotes.6"
    },
    {
      id: 7,
      imgPath: '/images/home/makers-section/maker-7.webp',
      name: 'features.home.makers.names.7',
      quote: "features.home.makers.quotes.7"
    },
    {
      id: 8,
      imgPath: '/images/home/makers-section/maker-8.webp',
      name: 'features.home.makers.names.8',
      quote: "features.home.makers.quotes.8"
    },
    {
      id: 9,
      imgPath: '/images/home/makers-section/maker-9.webp',
      name: 'features.home.makers.names.9',
      quote: "features.home.makers.quotes.9"
    },
  ]
  constructor(
    private router: Router
  ) { }

  navigateToAuth() {
    this.router.navigate(['/auth/register'], {
      queryParams: { type: 'maker' },
    })
  }

}
