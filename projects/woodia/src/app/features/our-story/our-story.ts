import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'woodia-our-story',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, NgIcon],
  templateUrl: './our-story.html',
  styleUrl: './our-story.scss',
})
export class OurStory {

}
