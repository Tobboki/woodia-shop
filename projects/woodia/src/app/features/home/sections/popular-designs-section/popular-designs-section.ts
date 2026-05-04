import { Component, OnInit, signal } from '@angular/core';
import { ZardCarouselComponent, ZardCarouselContentComponent, ZardCarouselItemComponent } from '@shared-components/carousel';
import { ProductCard } from "@woodia-shared/components/product-card/product-card";
import { IProductCard, IProductsResponse } from '@shared-types/product';
import { ProductService } from '@woodia-core/services/product.service';
import { TranslocoDirective } from '@jsverse/transloco';
import {finalize} from 'rxjs/operators';

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
    ProductCard,
    TranslocoDirective
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

    this.productService.getPopularDesigns()
    .pipe(
      finalize(() => this.productsLoading.set(false))
    )
    .subscribe({
      next: (data: any) => {
        this.products.set(data);
      },
      error: (error: any) => {
        console.error(error);
      }
    });
  }

  zardCarouselOptions = {
    loop: true,
    align: 'start' as const,
  };
}
