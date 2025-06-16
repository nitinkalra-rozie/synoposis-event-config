import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SynSkeletonLoader } from 'src/app/shared/components/syn-skeleton-loader/syn-skeleton-loader';

@Component({
  selector: 'app-stage-info-table-placeholder',
  templateUrl: './stage-info-table-placeholder.html',
  styleUrl: './stage-info-table-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SynSkeletonLoader],
})
export class StageInfoPlaceholder {}
