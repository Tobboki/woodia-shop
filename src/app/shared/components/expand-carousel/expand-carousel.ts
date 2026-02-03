import {
  Component,
  Input,
  ElementRef,
  QueryList,
  ViewChildren,
  AfterViewInit,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'woodia-expand-carousel',
  imports: [],
  templateUrl: './expand-carousel.html',
  styleUrl: './expand-carousel.scss',
})
export class ExpandCarousel implements AfterViewInit, OnDestroy {
  @Input() slides: any[] = [];
  @Input() autoPlay = false;
  @Input() interval = 4000;

  @ViewChildren('slideEl') slideEls!: QueryList<ElementRef>;

  activeIndex = 0;
  timer: any;

  private startX = 0;

  ngAfterViewInit() {
    this.animate();

    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  setActive(index: number) {
    if (index === this.activeIndex) return;

    this.activeIndex = index;
    this.animate();
  }

  animate() {
    this.slideEls.forEach((el, i) => {
      gsap.to(el.nativeElement, {
        flex: i === this.activeIndex ? 4 : 1,
        filter: i === this.activeIndex ? 'brightness(1)' : 'brightness(0.6)',
        duration: 0.6,
        ease: 'power3.out',
      });

      if (i === this.activeIndex) {
        gsap.fromTo(
          el.nativeElement.querySelector('.content'),
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, delay: 0.2 }
        );
      }
    });
  }


  startAutoPlay() {
    this.timer = setInterval(() => {
      this.activeIndex =
        (this.activeIndex + 1) % this.slides.length;
      this.animate();
    }, this.interval);
  }

  /* ---------- keyboard ---------- */
  @HostListener('window:keydown.arrowRight')
  next() {
    this.setActive((this.activeIndex + 1) % this.slides.length);
  }

  @HostListener('window:keydown.arrowLeft')
  prev() {
    this.setActive(
      (this.activeIndex - 1 + this.slides.length) %
        this.slides.length
    );
  }

  /* ---------- swipe ---------- */
  onTouchStart(e: TouchEvent) {
    this.startX = e.touches[0].clientX;
  }

  onTouchEnd(e: TouchEvent) {
    const diff = e.changedTouches[0].clientX - this.startX;
    if (Math.abs(diff) < 50) return;

    diff < 0 ? this.next() : this.prev();
  }
}
