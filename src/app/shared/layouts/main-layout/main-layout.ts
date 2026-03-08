import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Footer } from '@shared/components/footer/footer';
import { Header } from '@shared/components/header/header';
import { IMenuItem } from '@shared/types/app.types';
import { ICategory } from '@shared/types/category';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'woodia-main-layout',
  imports: [
    RouterOutlet,
    Header,
    Footer,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  menu: IMenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      path: '/home',
    },
    {
      id: 'designs',
      label: 'Designs',
      path: '/designs',
      children: []
    },
    {
      id: 'our-story',
      label: 'Our Story',
      path: '/our-story',
    },
  ];

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

    this.http
      .get<ICategory[]>(
        `${environment.apiUrl}${environment.endpoints.customer.category.getAll}`
      )
      .subscribe({
        next: (data) => {

          // Inject categories into Designs menu
          const designsMenu = this.menu.find(m => m.id === 'designs');

          if (designsMenu) {
            designsMenu.children = data.map(cat => ({
              id: cat.slug,
              label: cat.name,
              path: `/designs/${cat.slug}`,
              children: cat.childCategory?.map(childCat => ({
                id: childCat.slug,
                label: childCat.name,
                path: `/designs/${childCat.slug}`,
              })) || []
            }));
          }

          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load categories', err);
          this.loading.set(false);
        }
      });
  }

  navigateToCategory(slug: string) {
    this.router.navigate(['/designs', slug])
  }
}
