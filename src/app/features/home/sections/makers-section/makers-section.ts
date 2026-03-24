import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCarouselComponent, ZardCarouselContentComponent, ZardCarouselItemComponent } from '@shared/components/carousel';
import { MakerCard } from "@shared/components/custom/maker-card/maker-card";

@Component({
  selector: 'woodia-makers-section',
  imports: [
    ZardCarouselComponent,
    ZardCarouselContentComponent,
    ZardCarouselItemComponent,
    ZardButtonComponent,
    CommonModule,
    MakerCard
  ],
  templateUrl: './makers-section.html',
  styleUrl: './makers-section.scss',
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
      name: 'Laila Asmr',
      quote: "Good furniture starts with honest wood, careful hands, and patience in every cut."
    },
    {
      id: 2,
      imgPath: '/images/home/makers-section/maker-2.webp',
      name: 'Mohamed Ali',
      quote: "Every joint tells a story — strong craftsmanship turns simple wood into lasting furniture."
    },
    {
      id: 3,
      imgPath: '/images/home/makers-section/maker-3.webp',
      name: 'Omar Hassan',
      quote: "Measure twice, cut once — precision is what makes a piece stand the test of time."
    },
    {
      id: 4,
      imgPath: '/images/home/makers-section/maker-4.webp',
      name: 'Nour Ahmed',
      quote: "Design is important, but true beauty appears when the wood grain guides the craft."
    },
    {
      id: 5,
      imgPath: '/images/home/makers-section/maker-5.webp',
      name: 'Sara Mahmoud',
      quote: "Handcrafted furniture carries character — every curve and edge shaped with intention."
    },
    {
      id: 6,
      imgPath: '/images/home/makers-section/maker-6.webp',
      name: 'Ahmed Khaled',
      quote: "A well-built table isn't just furniture — it's where families gather for years."
    },
    {
      id: 7,
      imgPath: '/images/home/makers-section/maker-7.webp',
      name: 'Mona Adel',
      quote: "Craftsmanship is the balance between strength, simplicity, and the natural beauty of wood."
    },
    {
      id: 8,
      imgPath: '/images/home/makers-section/maker-8.webp',
      name: 'Youssef Samir',
      quote: "The best furniture pieces are built slowly, shaped by skill rather than machines."
    },
    {
      id: 9,
      imgPath: '/images/home/makers-section/maker-9.webp',
      name: 'Dina Fathy',
      quote: "Every handcrafted piece carries the mark of the maker behind it."
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
