import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ICategory } from '@woodia-types/category';
import { environment } from '@woodia-environments/environment';

@Component({
  selector: 'woodia-categories-section',
  imports: [
    ZardButtonComponent,
],
  standalone: true,
  templateUrl: './categories-section.html',
})
export class CategoriesSection implements OnInit {
  categories = signal<ICategory[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories() {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<ICategory[]>(
        `${environment.apiUrl}${environment.endpoints.customer.category.getAll}`
      )
      .subscribe({
        next: (data) => {
          this.categories.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load categories', err);
          this.error.set('Failed to load categories');
          this.loading.set(false);
        }
      });
  }

  navigateToCategory(slug: string) {
    this.router.navigate(['/designs', slug])
  }
}
