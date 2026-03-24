import { Component } from '@angular/core';
import { ZardCarouselComponent, ZardCarouselContentComponent, ZardCarouselItemComponent } from '@shared/components/carousel';
import { ExpandingCarousel } from '@shared/components/custom/expanding-carousel/expanding-carousel';


@Component({
  selector: 'woodia-guide-section',
  imports: [
    ExpandingCarousel,
    ZardCarouselComponent,
    ZardCarouselContentComponent,
    ZardCarouselItemComponent,
  ],
  templateUrl: './guide-section.html',
  styleUrl: './guide-section.scss',
})
export class GuideSection {
  slides = [
    {
      image: '/images/home/guide-slide-1.webp',
      label: '01',
      title: 'Start with the Perfect Design',
      description: "Explore a curated collection of customizable furniture designs. Whether your style is modern, classic, or somewhere in between, begin with a piece that fits your vision."
    },
    {
      image: '/images/home/guide-slide-2.webp',
      label: '02',
      title: 'Personalize Every Detail',
      description: "Choose the size, materials, finishes, and features that suit your space. From fabric to wood tones, every detail can be tailored to match your lifestyle and taste."
    },
    {
      image: '/images/home/guide-slide-3.webp',
      label: '03',
      title: 'Crafted by Experts',
      description: "Once your design is finalized, skilled craftsmen bring it to life with precision and care. Each piece is made to order, ensuring exceptional quality and attention to detail."
    },
    {
      image: '/images/home/guide-slide-4.webp',
      label: '04',
      title: 'Delivered & Enjoyed',
      description: "Your custom piece arrives ready to transform your space. Built to last and designed for everyday living, it's furniture made just for you — and made to stay."
    }
  ];

  zardCarouselOptions = {
    loop: true,
    align: 'start' as const,
  };
}
