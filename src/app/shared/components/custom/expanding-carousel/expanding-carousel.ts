import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  signal,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';

export interface ExpandSlide {
  image: string;
  label: string;
  title: string;
  description: string;
}

@Component({
  selector: 'woodia-expanding-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expanding-carousel.html',
  styleUrl: './expanding-carousel.scss',
})
export class ExpandingCarousel implements OnInit, OnDestroy, AfterViewInit {

  @ViewChildren('contentEl') contents!: QueryList<ElementRef<HTMLElement>>;

  @Input() slides: ExpandSlide[] = [];
  @Input() autoPlay = true;
  @Input() interval = 3000;

  activeIndex = signal(0);

  private timer: any;

  // ============================
  // Lifecycle
  // ============================

  ngOnInit() {
    if (this.autoPlay) {
      this.start();
    }
  }

  ngAfterViewInit() {
    const first = this.contents.get(0)?.nativeElement;
    if (first) {
      this.animateContent(first, true);
    }
  }

  ngOnDestroy() {
    this.stop();
  }

  // ============================
  // Panel Change
  // ============================

  setActive(index: number) {
  const current = this.activeIndex();

  if (index === current) return;

  // Immediately hide previous panel text
  const prevEl = this.contents.get(current)?.nativeElement;
    if (prevEl) {
      gsap.killTweensOf(prevEl);
      gsap.set(prevEl, { opacity: 0, y: 20 });
    }

    this.activeIndex.set(index);
  }

  // ============================
  // Transition Sync (NO TIMEOUT)
  // ============================

  onExpandEnd(event: TransitionEvent, contentEl: HTMLElement, index: number) {
    if (event.target !== event.currentTarget) return;
    if (!event.propertyName.includes('flex')) return;

    const isNowActive = index === this.activeIndex();

    this.animateContent(contentEl, isNowActive);

    // Optional: force hide non-active ones immediately (extra safety)
    if (!isNowActive) {
      gsap.set(contentEl, { opacity: 0 });
    }
  }

  // ============================
  // GSAP Animation
  // ============================

  private animateContent(el: HTMLElement, isActive: boolean) {
    gsap.killTweensOf(el);

    if (!isActive) {
      gsap.set(el, { opacity: 0, y: 20 });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.1,
      }
    );
  }

  // ============================
  // Autoplay
  // ============================

  start() {
    if (!this.slides?.length) return;

    this.timer = setInterval(() => {
      const next =
        (this.activeIndex() + 1) % this.slides.length;

      this.setActive(next);
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}