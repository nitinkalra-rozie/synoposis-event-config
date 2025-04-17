import { CommonModule, NgClass } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ActivatedRoute } from '@angular/router';
import { filter, map, tap } from 'rxjs/operators';
import { SynSingleSelectComponent } from 'src/app/legacy-admin/@components/syn-single-select';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { RightSidebarState } from 'src/app/legacy-admin/@models/global-state';
import { GetMultiSelectOptionFromStringPipe } from 'src/app/legacy-admin/@pipes/get-multi-select-option-from-string.pipe';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { ModalService } from 'src/app/legacy-admin/services/modal.service';
import {
  INITIAL_POST_DATA,
  TimeWindows,
  TransitionTimes,
} from 'src/app/legacy-admin/shared/constants';
import {
  PostDataEnum,
  ThemeOptions,
  TimeWindowsEnum,
  TransitionTimesEnum,
} from 'src/app/legacy-admin/shared/enums';
import { PostData } from 'src/app/legacy-admin/shared/types';

import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { BehaviorSubject } from 'rxjs';
import { AutoAvSetupRequest } from 'src/app/legacy-admin/@data-services/auto-av-setup/auto-av-setup.data-model';
import { AutoAvSetupService } from 'src/app/legacy-admin/@data-services/auto-av-setup/auto-av-setup.service';
import { EventWebsocketService } from 'src/app/legacy-admin/@data-services/web-socket/event-websocket.service';

@Component({
  selector: 'app-event-controls',
  templateUrl: './event-controls.component.html',
  styleUrls: ['./event-controls.component.scss'],
  providers: [GetMultiSelectOptionFromStringPipe],
  imports: [
    NgClass,
    FormsModule,
    MatButtonToggleModule,
    SynSingleSelectComponent,
    MatSlideToggleModule,
    CommonModule,
  ],
})
export class EventControlsComponent implements OnInit {
  //#region DI
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _modalService = inject(ModalService);
  private readonly _filtersStateService = inject(DashboardFiltersStateService);
  private readonly _globalStateService = inject(GlobalStateService);
  private readonly _autoAvSetupService = inject(AutoAvSetupService);
  private readonly _eventWebsocketService = inject(EventWebsocketService);
  //#endregion

  public PostDataEnum = PostDataEnum;
  timeWindows;
  transitionTimes;
  postInsideInterval: number = TransitionTimes['15 Seconds'];
  postInsideValue: string = TransitionTimesEnum.Seconds15;
  autoAvChecked = new BehaviorSubject<boolean>(false); // Default to false

  protected selectedFilter = signal<'track' | 'location'>('track');

  @Input() autoAvEnabled: boolean = false;

  @Output() autoAvChanged = new EventEmitter<boolean>();
  @Output() stageChanged = new EventEmitter<string>();

  @Input() transcriptTimeOut: { label: string; value: number } = {
    label: TimeWindowsEnum.Seconds60,
    value: TimeWindows['60 Seconds'],
  };
  @Input() postData: PostData = INITIAL_POST_DATA;
  @Input() themeOptions: ThemeOptions[];

  eventLocations = computed(() => this._filtersStateService.eventLocations());
  eventTracks = computed(() => this._filtersStateService.eventTracks());
  eventDays = computed(() => this._filtersStateService.eventDays());
  eventNames = computed(() => this._filtersStateService.eventNames());
  selectedEvent = computed(() => this._filtersStateService.selectedEvent());
  selectedLocation = computed(() =>
    this._filtersStateService.selectedLocation()
  );

  protected rightSidebarState = computed(() =>
    this._globalStateService.rightSidebarState()
  );
  protected RightSidebarState = RightSidebarState;
  protected showEventSelectionDropdown = signal(false);

  @Output() onUpdatePostData: EventEmitter<{
    key: PostDataEnum;
    value: string;
  }>;
  @Output() onReset: EventEmitter<void>;

  constructor() {
    this.onUpdatePostData = new EventEmitter();
    this.onReset = new EventEmitter();
  }

  ngOnInit() {
    this.timeWindows = Object.keys(TimeWindows);
    this.transitionTimes = Object.keys(TransitionTimes);
    this.postInsideInterval =
      parseInt(localStorage.getItem('postInsideInterval')) || 15;
    this.postInsideValue =
      localStorage.getItem('postInsideValue') || TransitionTimesEnum.Seconds15;
    // Restore the AutoAV toggle state from localStorage

    const savedStage = localStorage.getItem('selectedStage');
    if (savedStage) {
      const selectedOption: DropdownOption = JSON.parse(savedStage);
      this._filtersStateService.setSelectedLocation(selectedOption);

      const locationsCopy = this.eventLocations().map((location) => ({
        ...location,
        isSelected: location.label === selectedOption.label,
      }));

      this._filtersStateService.setEventLocations(locationsCopy);
    }

    const savedAutoAvChecked = localStorage.getItem('autoAvChecked');
    if (savedAutoAvChecked !== null) {
      const isAutoAvChecked = JSON.parse(savedAutoAvChecked);
      this.autoAvChecked.next(isAutoAvChecked);
      if (isAutoAvChecked) {
        const selectedLocation = this.selectedLocation()?.label;
        if (selectedLocation) {
          this._eventWebsocketService.initializeWebSocket(selectedLocation);
        } else {
          console.warn(
            'No selected location found. WebSocket not initialized.'
          );
        }
      }
    }
    this._route.queryParamMap
      .pipe(
        map((params) => params.get('showEventSelection')),
        filter((showEventSelection) => showEventSelection === '1'),
        tap(() => this.showEventSelectionDropdown.set(true)),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  onPostInsideIntervalChange = (value: string) => {
    // This function will be triggered whenever the value of postInsideInterval changes
    this.postInsideInterval = TransitionTimes[value];
    this.postInsideValue = TransitionTimesEnum[value];
    console.log('postInsideInterval changed to:', this.postInsideInterval);
    localStorage.setItem(
      'postInsideInterval',
      this.postInsideInterval.toString()
    );
    localStorage.setItem('postInsideValue', this.postInsideValue.toString());
    // You can call any other functions or perform any other actions here
  };

  handleDropdownSelect = (value: string, key: PostDataEnum | string) => {
    if ((key as string) === 'TransitionTimes') {
      this.onPostInsideIntervalChange(value);
    } else {
      this.onUpdatePostData.emit({ key: key as PostDataEnum, value });
    }
  };

  handleResetClick = () => {
    this.postInsideInterval = TransitionTimes['15 Seconds'];
    this.postInsideValue = TransitionTimesEnum.Seconds15;
    this.onReset.emit();
  };

  onEventLocationsSelect = (selectedOptions: DropdownOption[]) => {
    const locationsCopy = [...this.eventLocations()];
    const selectedLabels: string[] = [];
    for (const aOption of selectedOptions) {
      if (aOption.isSelected) {
        selectedLabels.push(aOption.label);
      }
    }
    const selectedLocationsSet = new Set(selectedLabels);
    locationsCopy.forEach((aOption) => {
      if (selectedLocationsSet.has(aOption.label)) {
        aOption.isSelected = true;
      } else {
        aOption.isSelected = false;
      }
    });
    this._filtersStateService.setEventLocations(locationsCopy);
  };

  onEventTracksSelect = (selectedOptions: DropdownOption[]) => {
    const tracksCopy = [...this.eventTracks()];
    const selectedLabels: string[] = [];
    for (const aOption of selectedOptions) {
      if (aOption.isSelected) {
        selectedLabels.push(aOption.label);
      }
    }
    const selectedTracksSet = new Set(selectedLabels);
    tracksCopy.forEach((aOption) => {
      if (selectedTracksSet.has(aOption.label)) {
        aOption.isSelected = true;
      } else {
        aOption.isSelected = false;
      }
    });
    this._filtersStateService.setEventTracks(tracksCopy);
  };

  onEventDaysSelect = (selectedOptions: DropdownOption[]) => {
    const daysCopy = [...this.eventDays()];
    const selectedLabels: string[] = [];
    for (const aOption of selectedOptions) {
      if (aOption.isSelected) {
        selectedLabels.push(aOption.label);
      }
    }
    const selectedDaysSet = new Set(selectedLabels);
    daysCopy.forEach((aOption) => {
      if (selectedDaysSet.has(aOption.label)) {
        aOption.isSelected = true;
      } else {
        aOption.isSelected = false;
      }
    });
    this._filtersStateService.setEventDays(daysCopy);
  };

  onEventSelect(event: DropdownOption) {
    this._filtersStateService.setSelectedEvent(event);
  }

  onEventLocationSelect = (selectedOption: DropdownOption): void => {
    if (
      !selectedOption ||
      selectedOption.label === this.selectedLocation()?.label
    )
      return;

    this._modalService.open(
      'Confirm Stage Selection',
      'You are about to select a new stage. If this stage is currently active elsewhere, selecting it here may interrupt ongoing operations. Would you like to proceed?',
      'yes_no',
      () => {
        const locationsCopy = this.eventLocations().map((location) => ({
          ...location,
          isSelected: location.label === selectedOption.label,
        }));

        this._filtersStateService.setEventLocations(locationsCopy);
        this._filtersStateService.setSelectedLocation(selectedOption);
        this.stageChanged.emit(selectedOption.label);
        localStorage.setItem('selectedStage', JSON.stringify(selectedOption));
        this._modalService.close();
      },
      () => {
        this._modalService.close();
      }
    );
  };

  onToggleChange(event: MatSlideToggleChange): void {
    const checked = event.checked;
    const selectedEvent = this.selectedEvent();
    const selectedLocation = this.selectedLocation();

    if (!selectedEvent || !selectedLocation) {
      console.error('Event or Location is not selected.');
      return;
    }

    const payload: AutoAvSetupRequest = {
      action: 'setAutoAvSetup',
      eventName: selectedEvent.label,
      stage: selectedLocation.label,
      autoAv: checked,
    };

    this._autoAvSetupService.setAutoAvSetup(payload).subscribe({
      next: (res) => {
        // this.autoAvChecked.set(checked);
        this.autoAvChecked.next(checked);
        localStorage.setItem('autoAvEnabled', JSON.stringify(checked));
        this.autoAvChanged.emit(checked);
        console.log('AutoAV setup updated successfully:', res);
        localStorage.setItem('autoAvChecked', JSON.stringify(checked));
        this._eventWebsocketService.setAutoAvToggle(checked);
        if (checked) {
          this._eventWebsocketService.initializeWebSocket(
            selectedLocation.label
          );
          console.log('WebSocket connection .');
        } else {
          this._eventWebsocketService.closeWebSocket();
          console.log('WebSocket connection closed.');
        }
      },
      error: (err) => {
        console.error('Error updating AutoAV setup:', err);
      },
    });
  }
}
