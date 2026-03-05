import { Component } from '@angular/core';
import { HeroSection } from './sections/hero-section/hero-section';
import { GuideSection } from "./sections/guide-section/guide-section";
import { CategoriesSection } from './sections/categories-section/categories-section';
import { MakersSection } from './sections/makers-section/makers-section';
import { PopularDesignsSection } from './sections/popular-designs-section/popular-designs-section';

@Component({
  selector: 'app-home',
  imports: [
    HeroSection,
    GuideSection,
    CategoriesSection,
    MakersSection,
    PopularDesignsSection
],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {


}
