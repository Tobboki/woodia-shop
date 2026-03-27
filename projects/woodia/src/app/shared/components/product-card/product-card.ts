import { Component, Input } from '@angular/core';

import { IProductCard } from 'shared-lib/types/product';

import { isImagePath } from 'shared-lib/utils/is-image-path';

@Component({
  selector: 'woodia-product-card',
  standalone: true,
  imports: [],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input() product: IProductCard = {} as IProductCard;

  isImagePath = isImagePath;
}
