import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ZardBadgeComponent } from 'shared-lib/components/badge/badge.component';
import { ZardCardComponent } from 'shared-lib/components/card/card.component';
import { NgOptimizedImage } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';


interface IMakerCard {
  name: string
  imgPath: string
  quote: string
}

@Component({
  selector: 'woodia-maker-card',
  imports: [
    ZardCardComponent,
    ZardBadgeComponent,
    TranslocoDirective,
    NgOptimizedImage
  ],

  templateUrl: './maker-card.html',
  styleUrl: './maker-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MakerCard {
  @Input() maker: IMakerCard = {} as IMakerCard
}
