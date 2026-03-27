import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import type { ClassValue } from 'clsx';

import { headerVariants } from 'projects/shared-lib/src/lib/components/layout/layout.variants';
import { mergeClasses } from 'projects/shared-lib/src/lib/utils/merge-classes';

@Component({
  selector: 'z-header',
  template: `
    <header [class]="classes()" [style.height.px]="zHeight()">
      <ng-content />
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zHeader',
})
export class HeaderComponent {
  readonly class = input<ClassValue>('');
  readonly zHeight = input<number>(64);

  protected readonly classes = computed(() => mergeClasses(headerVariants(), this.class()));
}
