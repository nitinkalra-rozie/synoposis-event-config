import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SynSkeletonLoader } from 'src/app/shared/components/syn-skeleton-loader/syn-skeleton-loader';

@Component({
  selector: 'syn-single-select-placeholder',
  templateUrl: './syn-single-select-placeholder.html',
  styleUrl: './syn-single-select-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SynSkeletonLoader],
})
export class SynSingleSelectPlaceholder {}
