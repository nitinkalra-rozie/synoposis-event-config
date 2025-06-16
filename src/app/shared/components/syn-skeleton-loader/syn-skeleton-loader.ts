import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RepeatTimes } from 'src/app/shared/directives/repeat-times';

@Component({
  selector: 'syn-skeleton-loader',
  templateUrl: './syn-skeleton-loader.html',
  styleUrl: './syn-skeleton-loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RepeatTimes],
})
export class SynSkeletonLoader {
  public readonly count = input.required<number>();
  public readonly direction = input<'vertical' | 'horizontal'>('vertical');
  public readonly height = input<string>();
  public readonly skeletonClass = input<string>();
}
