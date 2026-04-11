import {Component, Input} from '@angular/core';
import {IJob} from '@woodia-types/job.types';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'woodia-jobs-list',
  imports: [
    CommonModule,
  ],
  templateUrl: './jobs-list.view.html',
  styleUrl: './jobs-list.view.scss',
})
export class JobsListView {

  @Input() jobs: IJob[] = [];

}
