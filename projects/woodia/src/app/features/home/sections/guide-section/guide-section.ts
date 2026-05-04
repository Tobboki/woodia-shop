import { Component } from '@angular/core';
import { ZardCarouselComponent, ZardCarouselContentComponent, ZardCarouselItemComponent } from '@shared-components/carousel';
import { ExpandingCarousel } from '@woodia-shared/components/expanding-carousel/expanding-carousel';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgOptimizedImage } from '@angular/common';


@Component({
  selector: 'woodia-guide-section',
  imports: [
    ExpandingCarousel,
    ZardCarouselComponent,
    ZardCarouselContentComponent,
    ZardCarouselItemComponent,
    TranslocoDirective,
    NgOptimizedImage
  ],

  templateUrl: './guide-section.html',
  styleUrl: './guide-section.scss',
})
export class GuideSection {
  slides = [
    {
      image: '/images/home/guide-slide-1.webp',
      label: '01',
      title: 'features.home.guide.slides.slide1.title',
      description: 'features.home.guide.slides.slide1.description'
    },
    {
      image: '/images/home/guide-slide-2.webp',
      label: '02',
      title: 'features.home.guide.slides.slide2.title',
      description: 'features.home.guide.slides.slide2.description'
    },
    {
      image: '/images/home/guide-slide-3.webp',
      label: '03',
      title: 'features.home.guide.slides.slide3.title',
      description: 'features.home.guide.slides.slide3.description'
    },
    {
      image: '/images/home/guide-slide-4.webp',
      label: '04',
      title: 'features.home.guide.slides.slide4.title',
      description: 'features.home.guide.slides.slide4.description'
    }
  ];

  zardCarouselOptions = {
    loop: true,
    align: 'start' as const,
  };
}
