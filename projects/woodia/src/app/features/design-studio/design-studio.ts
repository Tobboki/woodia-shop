import { Component, OnInit, signal, inject } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { ProductService } from '../../core/services/product.service'
import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator'
import type { Product, ProductCategory } from '@shared-types/product'
import {NgIcon} from '@ng-icons/core';

@Component({
  selector: 'woodia-design-studio',
  imports: [
    DesignConfigurator,
    NgIcon,
    RouterLink,
  ],
  templateUrl: './design-studio.html',
  styleUrl: './design-studio.scss',
})
export class DesignStudio implements OnInit {
  private route = inject(ActivatedRoute)
  private productService = inject(ProductService)

  product = signal<Product | null>(null)
  modelType = signal<ProductCategory>('Desk')
  productLoading = signal(true)
  productError = signal(false)

  /** Tracks per-image load errors */
  imageErrors = signal<boolean[]>([])

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('id')
    const id = idStr != null ? parseInt(idStr, 10) : NaN

    if (Number.isNaN(id)) {
      this.productLoading.set(false)
      this.productError.set(true)
      return
    }

    this.productService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product)
        this.modelType.set(product.category)
        this.imageErrors.set(new Array(product.images?.length ?? 0).fill(false))
        this.productLoading.set(false)
      },
      error: () => {
        this.productError.set(true)
        this.productLoading.set(false)
      },
    })
  }

  onImageError(index: number): void {
    const errors = [...this.imageErrors()]
    errors[index] = true
    this.imageErrors.set(errors)
  }

  get images(): string[] {
    return this.product()?.images ?? []
  }
}
