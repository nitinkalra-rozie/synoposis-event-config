import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StageActionButtons } from 'src/app/av-workspace/components/stage-action-buttons/stage-action-buttons';
import { StageInfoHeader } from 'src/app/av-workspace/components/stage-info-header/stage-info-header';
import { StageInfoPlaceholder } from 'src/app/av-workspace/components/stage-info-table-placeholder/stage-info-table-placeholder';
import { StageStatus } from 'src/app/av-workspace/components/stage-status/stage-status';
import { StagesActions } from 'src/app/av-workspace/components/stages-actions/stages-actions';
import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { CentralizedViewStore } from 'src/app/av-workspace/stores/centralized-view-store';
import { SynMenuMultiSelectOption } from 'src/app/shared/components/syn-menu-multi-select/syn-menu-multi-select-option.model';
import { SynSingleSelect } from 'src/app/shared/components/syn-single-select/syn-single-select';
import { SynSingleSelectOption } from 'src/app/shared/components/syn-single-select/syn-single-select-option.model';

@Component({
  selector: 'app-centralized-view',
  templateUrl: './centralized-view.html',
  styleUrl: './centralized-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    StageActionButtons,
    StageInfoPlaceholder,
    StageInfoHeader,
    SynSingleSelect,
    StageStatus,
    StagesActions,
  ],
})
export class CentralizedView {
  constructor() {
    this._store.fetchStages();
    this._store.initializeWebSocket();

    effect(() => {
      const entities = this.$vm().entities();
      const sort = this._sort();

      this.dataSource.data = entities;

      if (entities.length > 0 && sort && !this.dataSource.sort) {
        this.dataSource.sort = this._sort();
      }
    });
  }

  private readonly _sort = viewChild<MatSort>(MatSort);

  private readonly _liveAnnouncer = inject(LiveAnnouncer);
  private readonly _store = inject(CentralizedViewStore);

  protected dataSource = new MatTableDataSource<EventStage>();

  protected $vm = this._store.$vm;

  protected announceSortChange(sortState: Sort): void {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  protected toggleAllRows(): void {
    this._store.toggleAllRows();
  }

  protected toggleRow(row: EventStage): void {
    this._store.toggleRow(row);
  }

  protected executeSearch(value: string): void {
    this._store.setSearchTerm(value);
  }

  protected onFilterSelectionsApplied(
    selections: SynMenuMultiSelectOption<string>[] | string[]
  ): void {
    const locationFilters = Array.isArray(selections)
      ? selections.map((s: string | SynMenuMultiSelectOption<string>) =>
          typeof s === 'string' ? s : s.value
        )
      : [];

    this._store.setLocationFilters(locationFilters);
  }

  protected onSessionSelected(
    event: SynSingleSelectOption<string> | string,
    stage: string
  ): void {
    this._store.setSelectedSession(
      stage,
      typeof event === 'string' ? event : event.value
    );
  }

  protected onSessionDropdownOpened(isOpen: boolean, stageName: string): void {
    if (isOpen) {
      this._store.fetchSessions(stageName);
    }
  }

  protected onStartListening(stage: string): void {
    this._store.startListeningStage(stage);
  }

  protected onPauseListening(stage: string): void {
    this._store.pauseListeningStage(stage);
  }

  protected onStopListening(stage: string): void {
    this._store.stopListeningStage(stage);
  }

  protected onBulkStartListening(): void {
    console.log('onBulkStartListening');
  }

  protected onBulkPauseListening(): void {
    console.log('onBulkPauseListening');
  }

  protected onBulkStopListening(): void {
    console.log('onBulkStopListening');
  }
}
