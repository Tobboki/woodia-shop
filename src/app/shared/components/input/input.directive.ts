import type { ClassValue } from 'clsx';

import { computed, Directive, ElementRef, inject, input } from '@angular/core';

import { mergeClasses, transform } from '@shared/utils/merge-classes';
import { inputVariants, ZardInputVariants } from './input.variants';

@Directive({
  selector: 'input[z-input], textarea[z-input]',
  exportAs: 'zInput',
  standalone: true,
  host: {
    '[class]': 'classes()',
  },
})
export class ZardInputDirective  {
  readonly elementRef = inject(ElementRef);

  readonly zBorderless = input(false, { transform });
  readonly zType = input<ZardInputVariants['zType']>('default');
  readonly zSize = input<ZardInputVariants['zSize']>('default');
  readonly zStatus = input<ZardInputVariants['zStatus']>();
  readonly zDisabled = input<ZardInputVariants['zDisabled']>();


  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(inputVariants({
      zType: this.zType(),
      zDisabled: this.zDisabled(),
      zSize: this.zSize(),
      zStatus: this.zStatus(),
      zBorderless: this.zBorderless()
    }), this.class()),
  );
}
