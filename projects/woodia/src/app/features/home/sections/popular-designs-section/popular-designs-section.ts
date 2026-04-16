import { Component, OnInit, signal } from '@angular/core';
import { ZardCarouselComponent, ZardCarouselContentComponent, ZardCarouselItemComponent } from '@shared-components/carousel';
import { ProductCard } from "@woodia-shared/components/product-card/product-card";
import { IProductCard, IProductsResponse } from '@shared-types/product';
import { ProductService } from '@woodia-core/services/product.service';

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
export class PopularDesignsSection implements OnInit {
  constructor(
    private productService: ProductService,
  ) { }

  products = signal<IProductCard[]>([])
  productsLoading = signal<boolean>(false)

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productsLoading.set(true)

    this.productService.getPopularDesigns().subscribe({
      next: (data: any) => {
        this.productsLoading.set(false)

        this.products.set(data)
      },
      error: (error: any) => {
        this.productsLoading.set(false)
        console.error(error);
      }
    })
  }

  zardCarouselOptions = {
    loop: true,
    align: 'start' as const,
  };
}
