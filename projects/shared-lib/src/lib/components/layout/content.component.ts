import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import type { ClassValue } from 'clsx';

import { contentVariants } from 'projects/shared-lib/src/lib/components/layout/layout.variants';
import { mergeClasses } from 'projects/shared-lib/src/lib/utils/merge-classes';

@Component({
  selector: 'z-content',
  template: `
    <main>
      <ng-content />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'zContent',
})
export class ContentComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(contentVariants(), this.class()));
}
