import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'woodia-maker-jobs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-3xl font-bold mb-6">Available Jobs</h1>
      <p class="text-foreground/60">Jobs for makers will appear here.</p>
    </div>
  `,
})
export class Jobs {}
