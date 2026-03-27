import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  Input,
  QueryList,
  TemplateRef,
  ViewChildren,
} from '@angular/core';
import { gsap } from 'gsap';
import { ZardBadgeComponent } from 'shared-lib/components/badge/badge.component';
import { ZardCardComponent } from 'shared-lib/components/card/card.component';
import { CommonModule } from '@angular/common';

export interface Maker {
  name: string;
  imgPath: string;
  quote: string;
}

@Component({
  selector: 'woodia-circular-carousel',
  imports: [
    CommonModule
  ],
  templateUrl: './circular-carousel.html',
  styleUrl: './circular-carousel.scss',
})
export class CircularCarousel implements AfterViewInit {
  @Input() items: any[] = [];

  @ContentChild(TemplateRef)
  itemTemplate!: TemplateRef<any>;

  @ViewChildren('card')
  cards!: QueryList<ElementRef>;

  private tl!: gsap.core.Timeline;

  ngAfterViewInit() {
    const elements = this.cards.map((c) => c.nativeElement);

    const total = elements.length;
    const angle = 360 / total;

    gsap.set(elements, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      xPercent: -50,
      yPercent: -50,
      transformOrigin: '50% 200%',
    });

    elements.forEach((el, i) => {
      gsap.set(el, {
        rotation: i * angle,
      });
    });

    this.tl = gsap.timeline({
      repeat: -1,
      ease: 'none',
    });

    this.tl.to(elements, {
      rotation: `+=360`,
      duration: 20,
      ease: 'none',
    });
  }
}
