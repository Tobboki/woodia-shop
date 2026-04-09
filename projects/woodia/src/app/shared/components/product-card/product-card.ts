import { Component, Input } from '@angular/core';

import { IProductCard } from 'shared-lib/types/product';

import { isImagePath } from 'shared-lib/utils/is-image-path';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'woodia-product-card',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input() product: IProductCard = {} as IProductCard;

  isImagePath = isImagePath;
}
