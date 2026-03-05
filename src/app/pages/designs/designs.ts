import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ZardBreadcrumbComponent, ZardBreadcrumbItemComponent } from '@shared/components/breadcrumb';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardLoaderComponent } from '@shared/components/loader/loader.component';
import { ProductCard } from '@shared/components/product-card/product-card';
import { CategoryService } from '@shared/services/category.service';
import { ProductService } from '@shared/services/product.service';
import { ICategoryCard, IChildCategoryResponse } from '@shared/typse/category';
import { IProductCard } from '@shared/typse/product';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'woodia-designs',
  standalone: true,
  imports: [
    ProductCard,
    ZardButtonComponent,
    ZardLoaderComponent,
    RouterLink,
    ZardBreadcrumbComponent,
    ZardBreadcrumbItemComponent
  ],
  templateUrl: './designs.html',
  styleUrl: './designs.scss',
})
export class Designs implements OnInit {

  // Signals
  categories = signal<ICategoryCard[]>([])
  productCards = signal<IProductCard[]>([]);
  hasMoreProducts = signal<boolean>(true);
  isLoadingCategories = signal<boolean>(false);
  isLoadingProducts = signal<boolean>(false);

  // Pagination
  pageNumber = 1;
  pageSize = 10;

  currentCategory = signal<string>('all');

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {

      this.currentCategory.set(params.get('category') ?? 'all');

      // Reset when category changes
      this.pageNumber = 1;
      this.productCards.set([]);
      this.hasMoreProducts.set(true);

      this.loadProducts();
    });
  }

  loadProducts(): void {
    if (!this.hasMoreProducts() || this.isLoadingProducts()) return;

    this.isLoadingProducts.set(true);
    this.isLoadingCategories.set(true);
    

    const isAllCategory = signal<boolean>(this.currentCategory() === 'all');

    // products
    const productRequest = isAllCategory()
      ? this.productService.getAllProducts({
          pageNumber: this.pageNumber,
          pageSize: this.pageSize,
        })
      : this.productService.getProductCardsByCategorySlug(this.currentCategory(), {
          pageNumber: this.pageNumber,
          pageSize: this.pageSize,
        });


    productRequest.subscribe({
      next: (res) => {
        const newProducts = res.items ?? [];

        // Append instead of replace
        this.productCards.update(prev => [...prev, ...newProducts]);

        // If less than pageSize → no more pages
        if (newProducts.length < this.pageSize) {
          this.hasMoreProducts.set(false);
        }

        this.pageNumber++;


        console.log('res', res)
      },
      error: (err) => {
        console.error('Failed to load products', err);

        const errors = err.error?.errors || [];
        
        if (errors.includes('Category.CategoryNotFound')) {
          toast.error('Category Does not Exist', {
            description: 'Try choosing a category from designs',
            position: 'bottom-center',
          });
        }

        this.router.navigate(['/error']);
      },
      complete: () => {
        this.isLoadingProducts.set(false);
      }
    });

    // categories
    const categoriesRequest = isAllCategory()
      ? this.categoryService.getCategoryBySlug('parent')
      : this.categoryService.getCategoryBySlug(this.currentCategory());

    categoriesRequest.subscribe({
      next: (res) => {

        // add the array only
        if (isAllCategory()) {
          this.categories.set((res as ICategoryCard[]));
        } else {
          this.categories.set((res as IChildCategoryResponse).categoryChildNavigationResponses)
        }

        console.log('category res', res)
      },
      error: (err) => {
        console.error('Failed to load Categories', err);

        const errors = err.error?.errors || [];
        
        if (errors.includes('Category.CategoryNotFound')) {
          toast.error('Category Does not Exist', {
            description: 'Try choosing a category from designs',
            position: 'bottom-center',
          });
        }

        this.router.navigate(['/error']);
      },
      complete: () => {
        this.isLoadingCategories.set(false);
      }
    });
  }

  loadMoreProducts(): void {
    this.loadProducts();
  }
}