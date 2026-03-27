import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  OnInit,
  signal,
  effect
} from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Footer } from '@woodia-shared/components/footer/footer';
import { Header } from '@woodia-shared/components/header/header';
import {
  IMenuItem,
  TLayoutVariant,
  TMenuKey
} from '../../types/app.types';
import { ICategory } from '../../types/category';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { AuthService } from '@woodia-core/services/auth.service';

@Component({
  selector: 'woodia-main-layout',
  imports: [RouterOutlet, Header, Footer, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnInit {
  // ---------------------------
  // Static Menus
  // ---------------------------
  menus: Record<TMenuKey, IMenuItem[]> = {
    landing: [
      {
        id: 'home',
        label: 'Home',
        path: '/home',
      },
      {
        id: 'designs',
        label: 'Designs',
        path: '/designs',
        children: [],
      },
      {
        id: 'our-story',
        label: 'Our Story',
        path: '/our-story',
      },
    ],
    customer: [
      {
        id: 'designs',
        label: 'Designs',
        path: '/customers/designs',
      },
      {
        id: 'requests',
        label: 'Requests',
        path: '/customer/requests',
      },
    ],
    maker: [],
  };

  // ---------------------------
  // Signals
  // ---------------------------
  layoutVariant = signal<TLayoutVariant>('default');
  categories = signal<ICategory[]>([]);
  loading = signal<boolean>(false);

  // ---------------------------
  // Computed Menu
  // ---------------------------
  menu = computed<IMenuItem[]>(() => {
    const isAuthenticated = this.authService.isAuthenticated();

    const baseMenu = isAuthenticated
      ? this.menus['customer']
      : this.menus['landing'];

    return baseMenu.map(item => {
      if (item.id !== 'designs') return item;

      return {
        ...item,
        children: this.categories().map(cat => ({
          id: cat.slug,
          label: cat.name,
          path: `/designs/${cat.slug}`,
          children:
            cat.childCategory?.map(child => ({
              id: child.slug,
              label: child.name,
              path: `/designs/${child.slug}`,
            })) || [],
        })),
      };
    });
  });

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    // React to route changes properly
    effect(() => {
      const variant =
        this.route.snapshot.data['layoutVariant'] ?? 'default';
      this.layoutVariant.set(variant);
    });
  }

  // ---------------------------
  // Lifecycle
  // ---------------------------
  ngOnInit(): void {
    this.fetchCategories();
  }

  // ---------------------------
  // API
  // ---------------------------
  fetchCategories() {
    this.loading.set(true);

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
          this.loading.set(false);
        },
      });
  }
}
