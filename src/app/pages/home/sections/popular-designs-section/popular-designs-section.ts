import { Component } from '@angular/core';
import { ZardCarouselComponent, ZardCarouselContentComponent, ZardCarouselItemComponent } from '@shared/components/carousel';
import { ProductCard } from "@shared/components/product-card/product-card";
import { IProductCard } from '@shared/typse/product';

export interface Product {
  id: number;
  productLine: string;
  description: string;
  image: string;
  tag: string;
  price: number;
  isFavorite?: boolean;
}

@Component({
  selector: 'woodia-popular-designs-section',
  imports: [
    ZardCarouselComponent,
    ZardCarouselContentComponent,
    ZardCarouselItemComponent,
    ProductCard
],
  templateUrl: './popular-designs-section.html',
  styleUrl: './popular-designs-section.scss',
})
export class PopularDesignsSection {
  products: IProductCard[] = [
    {
      id: 1,
      productLine: 'Sideboard',
      description:
        'Modern wooden sideboard with minimalist design and ample storage compartments.',
      thumbnailImage: '/images/placeholders/product-placeholder.png',
      hoverImage: '/images/placeholders/product-placeholder.png'
    },
    {
      id: 2,
      productLine: 'Sideboard',
      description:
        'Modern wooden sideboard with minimalist design and ample storage compartments.',
      thumbnailImage: '/images/placeholders/product-placeholder.png',
      hoverImage: '/images/placeholders/product-placeholder.png'
    },
    {
      id: 3,
      productLine: 'Sideboard',
      description:
        'Modern wooden sideboard with minimalist design and ample storage compartments.',
      thumbnailImage: '/images/placeholders/product-placeholder.png',
      hoverImage: '/images/placeholders/product-placeholder.png'
    },
    {
      id: 4,
      productLine: 'Sideboard',
      description:
        'Modern wooden sideboard with minimalist design and ample storage compartments.',
      thumbnailImage: '/images/placeholders/product-placeholder.png',
      hoverImage: '/images/placeholders/product-placeholder.png'
    },
    {
      id: 5,
      productLine: 'Sideboard',
      description:
        'Modern wooden sideboard with minimalist design and ample storage compartments.',
      thumbnailImage: '/images/placeholders/product-placeholder.png',
      hoverImage: '/images/placeholders/product-placeholder.png'
    },
    {
      id: 6,
      productLine: 'Sideboard',
      description:
        'Modern wooden sideboard with minimalist design and ample storage compartments.',
      thumbnailImage: '/images/placeholders/product-placeholder.png',
      hoverImage: '/images/placeholders/product-placeholder.png'
    },
    {
      id: 7,
      productLine: 'Sideboard',
      description:
        'Modern wooden sideboard with minimalist design and ample storage compartments.',
      thumbnailImage: '/images/placeholders/product-placeholder.png',
      hoverImage: '/images/placeholders/product-placeholder.png'
    },
    {
      id: 8,
      productLine: 'Sideboard',
      description:
        'Modern wooden sideboard with minimalist design and ample storage compartments.',
      thumbnailImage: '/images/placeholders/product-placeholder.png',
      hoverImage: '/images/placeholders/product-placeholder.png'
    },
    {
      id: 9,
      productLine: 'Sideboard',
      description:
        'Modern wooden sideboard with minimalist design and ample storage compartments.',
      thumbnailImage: '/images/placeholders/product-placeholder.png',
      hoverImage: '/images/placeholders/product-placeholder.png'
    },
  ];
  
  zardCarouselOptions = {
    loop: true,
    align: 'start' as const,
  };
}
