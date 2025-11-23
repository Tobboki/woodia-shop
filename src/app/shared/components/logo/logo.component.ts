import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { mergeClasses } from '@shared/utils/merge-classes';
import { logoVariants } from './logo.variants';
import { ClassValue } from 'clsx';

@Component({
  selector: 'logo, [logo]',
  imports: [

  ],
  standalone: true,
  template: `
    <div class="flex flex-row items-center gap-[4px]">
      <div>
        <img 
          src="/images/logo.svg" 
          alt="Woodia Logo" 
          class="w-[64px] h-[32px] object-contain"
        >
      </div>
      <span class="font-h3">
        Woodia
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {}
})
export class LogoComponent {
  readonly zType = input<logoVariants['zType']>('default');

  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(
      logoVariants({
        zType: this.zType(),
      }),
      this.class(),
    ),
  );
}
