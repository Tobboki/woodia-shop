import { Component } from '@angular/core';
import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator';
import type { Product, BookcaseModelConfig } from '@woodia-types/product';

@Component({
  selector: 'woodia-hero-section',
  imports: [DesignConfigurator],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  heroTestProduct: Product = {
    id: 999,
    category: 'Bookcase',
    modelConfig: {
      widthCm: 160,
      heightCm: 180,
      depthCm: 40,
      color: '#d2b48c',
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
}
