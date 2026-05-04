import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { mergeClasses } from '../../../utils/merge-classes';
import { logoVariants } from './logo.variants';
import { ClassValue } from 'clsx';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgOptimizedImage } from '@angular/common';


@Component({
  selector: 'logo, [logo]',
  imports: [
    RouterLink,
    TranslocoDirective,
    NgOptimizedImage
  ],

  standalone: true,
  template: `
    <a
      class="flex flex-row cursor-pointer transition-opacity hover:opacity-80 active:opacity-90"
      [class]="wText() ? 'items-center gap-2' : ''"
      [routerLink]="['/']"
      *transloco="let t"
    >
        <img
          ngSrc="/images/logo.svg"
          [alt]="t('app.appTitle') + ' Logo'"
          width="48"
          height="24"
          priority
          class="w-[48px] h-[24px] object-contain shrink-0"
        >

      @if (wText()) {
        <span class="text-2xl font-bold font-link tracking-tight text-foreground leading-none">
          {{ t('app.appTitle') }}
        </span>
      }
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  }
})
export class LogoComponent {
  readonly wType = input<logoVariants['wType']>('default');
  readonly wText = input<logoVariants['wText']>(false);

  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(
      logoVariants({
        wType: this.wType(),
        wText: this.wText(),
      }),
      this.class(),
    ),
  );
}
