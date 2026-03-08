import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProductCard } from '@shared/types/product';

import { isImagePath } from '@shared/utils/is-image-path';

@Component({
  selector: 'woodia-product-card',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input() product: IProductCard = {} as IProductCard;

  isImagePath = isImagePath;
}