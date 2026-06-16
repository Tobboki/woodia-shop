import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  OnInit,
  signal,
  effect
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Footer } from '@woodia-shared/components/footer/footer';
import { Header } from '@woodia-shared/components/header/header';
import {
  IMenuItem,
  TLayoutVariant,
  TMenuKey
} from '../../types/app.types';
import { ICategory } from '../../types/category';
import { environment } from '@woodia-environments/environment';
import { CommonModule } from '@angular/common';
import { AuthService } from '@woodia-core/services/auth.service';
import { LanguageService } from '@woodia-core/services/language.service';

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
        label: 'app.header.menu.home',
        path: '/home',
        icon: 'lucideHouse'
      },
      {
        id: 'designs',
        label: 'app.header.menu.designs',
        path: '/designs',
        icon: 'lucideArmchair',
        children: [],
      },
      {
        id: 'our-story',
        label: 'app.header.menu.ourStory',
        path: '/our-story',
        icon: 'lucideBookOpen',
      },
    ],
    customer: [
      {
        id: 'designs',
        label: 'app.header.menu.designs',
        path: '/customers/designs',
        icon: 'lucideArmchair',
      },

      {
        id: 'jobs',
        label: 'app.header.menu.jobs',
        path: '/customers/jobs',
        icon: 'lucideBriefcase'
      },
    ],
    maker: [
      {
        id: 'jobs',
        label: 'app.header.menu.jobs',
        path: '/makers/jobs',
        icon: 'lucideBriefcase'
      },
      {
        id: 'offers',
        label: 'app.header.menu.offers',
        path: '/makers/offers',
        icon: 'lucideHandshake'
      },
      {
        id: 'portfolio',
        label: 'app.header.menu.portfolio',
        path: '/makers/portfolio',
        icon: 'lucideUser'
      }
    ],
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
    const user = this.authService.getCurrentUser();

    const isACustomer = this.authService.getCurrentUser()?.userType?.toUpperCase() === 'CLIENT';

    let baseMenu = this.menus['landing'];

    if (isAuthenticated) {
      const userType = user?.userType?.toUpperCase();
      if (userType === 'CLIENT') {
        baseMenu = this.menus['customer'];
      } else if (userType === 'MAKER') {
        baseMenu = this.menus['maker'];
      }
    }

    return baseMenu.map(item => {
      if (item.id !== 'designs') return item;

      return {
        ...item,
        children: this.categories().map(cat => ({
          id: cat.slug,
          label: cat.name,
          path: isACustomer ? `/customers/designs/${cat.slug}` : `/designs/${cat.slug}`,
          children:
            cat.childCategory?.map(child => ({
              id: child.slug,
              label: child.name,
              path: isACustomer ? `/customers/designs/${child.slug}` : `/designs/${child.slug}`,
            })) || [],
        })),
      };
    });
  });


  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private langService: LanguageService
  ) {
    // React to route changes properly by traversing to the deepest child
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      let activeRoute = this.route;
      while (activeRoute.firstChild) {
        activeRoute = activeRoute.firstChild;
      }

      const variant = activeRoute.snapshot.data['layoutVariant'] ||
        this.route.snapshot.data['layoutVariant'] ||
        'plain';
      this.layoutVariant.set(variant);
    });

    // Initial check
    const initialVariant = this.getDeepestData(this.route.snapshot, 'layoutVariant') || 'plain';
    this.layoutVariant.set(initialVariant);

    // Re-fetch categories when language changes
    effect(() => {
      this.langService.lang();
      this.fetchCategories();
    }, { allowSignalWrites: true });
  }

  private getDeepestData(snapshot: any, key: string): any {
    let current = snapshot;
    let value = current.data ? current.data[key] : undefined;

    while (current.firstChild) {
      current = current.firstChild;
      if (current.data && current.data[key]) {
        value = current.data[key];
      }
    }
    return value;
  }

  // ---------------------------
  // Lifecycle
  // ---------------------------
  ngOnInit(): void {
  }

  // ---------------------------
  // API
  // ---------------------------
  fetchCategories() {
    this.loading.set(true);

    this.http
      .get<ICategory[]>(
        `${environment.apiUrl}${environment.endpoints.customer.category.getAll}`,
        { headers: { 'Accept-Language': this.langService.lang() } }
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
