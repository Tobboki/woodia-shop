import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  signal,
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
export class ExpandingCarousel implements OnInit, OnDestroy {

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

  ngOnDestroy() {
    this.stop();
  }

  // ============================
  // Panel Change
  // ============================

  setActive(index: number) {
    if (index === this.activeIndex()) return;

    this.activeIndex.set(index);
  }

  // ============================
  // Transition Sync (NO TIMEOUT)
  // ============================

  onExpandEnd(event: TransitionEvent, contentEl: HTMLElement, index: number) {
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
      // Non-active → make sure it's really invisible right away
      gsap.set(el, { opacity: 0, y: 20 });
      return;
    }

    // Only animate when it IS the active one
    // Small delay so it feels timed with expansion finish
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: "power3.out",
        delay: 0.15,           // ← tweak this (0.1–0.3) to sync with expand feel
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

      this.activeIndex.set(next);
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}