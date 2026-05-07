import { Component, inject, signal } from '@angular/core';
import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator';
import type { Product, BookcaseModelConfig } from '@shared-types/product';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgOptimizedImage } from '@angular/common';


import { RouterLink } from '@angular/router';
import { ZardButtonComponent } from 'shared-lib/components/button';
import { NgIcon } from '@ng-icons/core';
import { LanguageService } from '@woodia-core/services/language.service';


@Component({
  selector: 'woodia-hero-section',
  imports: [DesignConfigurator, TranslocoDirective, NgOptimizedImage, RouterLink, ZardButtonComponent, NgIcon],

  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  readonly langService = inject(LanguageService);

  heroTestProduct: Product = {
    id: 999,
    category: 'Bookcase',
    modelConfig: {
      modelType: 'Bookcase',
      widthCm: 160,
      heightCm: 180,
      depthCm: 40,
      color: '#3c506a',
      withBack: true,
      style: 'pattern',
      density: 70,
      topStorage: null,
      bottomStorage: { height: 'md' },
      rowConfigs: [
        { height: 'lg', doors: 'none', drawers: 'none' },
        { height: 'md', doors: 'none', drawers: 'none' },
        { height: 'md', doors: 'some', drawers: 'none' },
        { height: 'sm', doors: 'none', drawers: 'some' },
      ]
    } as BookcaseModelConfig,
    images: []
  };

  hoveredPart = signal<'none' | 'craftsmanship' | 'modernity'>('none');
}
