import { Component, Input } from '@angular/core';
import { IJob } from '@woodia-types/job.types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'woodia-jobs-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jobs-grid.view.html',
  styleUrl: './jobs-grid.view.scss',
})
export class JobsGridView {
  @Input() jobs: IJob[] = [];
}
