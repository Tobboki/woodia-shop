import { Component, OnInit, signal } from '@angular/core';
import { ZardCarouselComponent, ZardCarouselContentComponent, ZardCarouselItemComponent } from '@shared-components/carousel';
import { ProductCard } from "@woodia-shared/components/product-card/product-card";
import { IProductCard, IProductsResponse } from '@shared-types/product';
import { DesignService } from '@admin-core/services/design.service';

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
    private designService: DesignService,
  ) { }

  products = signal<IProductCard[]>([])
  productsLoading = signal<boolean>(false)

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productsLoading.set(true)

    this.designService.getPopularDesigns().subscribe({
      next: data => {
        this.productsLoading.set(false)

        this.products.set(data)
      },
      error: error => {
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
