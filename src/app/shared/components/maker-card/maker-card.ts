import { Component, Input } from '@angular/core';
import { ZardBadgeComponent } from '../badge/badge.component';
import { ZardCardComponent } from '../card/card.component';

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
  ],
  templateUrl: './maker-card.html',
  styleUrl: './maker-card.scss',
})
export class MakerCard {
  @Input() maker: IMakerCard = {} as IMakerCard
}
