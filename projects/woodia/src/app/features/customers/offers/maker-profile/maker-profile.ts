import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import {
  CustomerOfferService,
  ICarpenterProfile,
  ICarpenterPortfolioItem,
} from '@woodia-core/services/customer-offer.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'woodia-maker-profile',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardSkeletonComponent,
  ],
  templateUrl: './maker-profile.html',
  styleUrl: './maker-profile.scss',
})
export class MakerProfile implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerOfferService = inject(CustomerOfferService);
  private translocoService = inject(TranslocoService);

  profile = signal<ICarpenterProfile | null>(null);
  isLoading = signal(true);
  isError = signal(false);

  // Lightbox state
  lightboxOpen = signal(false);
  lightboxImages = signal<string[]>([]);
  lightboxIndex = signal(0);

  fullName = computed(() => {
    const p = this.profile();
    return p ? `${p.firstName} ${p.lastName}` : '';
  });

  avatarInitials = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
  });

  ngOnInit(): void {
    const carpenterId = this.route.snapshot.paramMap.get('carpenterId');
    if (!carpenterId) {
      this.isError.set(true);
      this.isLoading.set(false);
      return;
    }
    this.loadProfile(carpenterId);
  }

  loadProfile(carpenterId: string): void {
    this.isLoading.set(true);
    this.isError.set(false);

    this.customerOfferService.getCarpenterProfile(carpenterId).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
        console.log("profile", profile);
      },
      error: () => {
        this.isError.set(true);
        this.isLoading.set(false);
        toast.error(this.translocoService.translate('features.customers.makerProfile.errors.loadFailed'));
      }
    });
  }

  openLightbox(item: ICarpenterPortfolioItem, startIndex = 0): void {
    this.lightboxImages.set(item.portfolioImageUrls);
    this.lightboxIndex.set(startIndex);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  nextImage(): void {
    this.lightboxIndex.update(i => (i + 1) % this.lightboxImages().length);
  }

  prevImage(): void {
    this.lightboxIndex.update(i =>
      (i - 1 + this.lightboxImages().length) % this.lightboxImages().length
    );
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/customers/jobs']);
    }
  }

  getCarpenterId(): string {
    return this.route.snapshot.paramMap.get('carpenterId') ?? '';
  }
}