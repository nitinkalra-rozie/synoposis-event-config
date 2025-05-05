import { NgClass, UpperCasePipe } from '@angular/common';
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
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ActivatedRoute } from '@angular/router';
import { filter, map, take, tap } from 'rxjs/operators';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { AutoAvSetupRequest } from 'src/app/legacy-admin/@data-services/auto-av-setup/auto-av-setup.data-model';
import { AutoAvSetupDataService } from 'src/app/legacy-admin/@data-services/auto-av-setup/auto-av-setup.data-service';
import { EventWebsocketService } from 'src/app/legacy-admin/@data-services/web-socket/event-websocket.service';

@Component({
  selector: 'app-event-controls',
  templateUrl: './event-controls.component.html',
  styleUrls: ['./event-controls.component.scss'],
  providers: [GetMultiSelectOptionFromStringPipe],
  imports: [
    NgClass,
    UpperCasePipe,
    FormsModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatTooltipModule,
    SynSingleSelectComponent,
  ],
})
export class EventControlsComponent implements OnInit {
  //#region DI
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _modalService = inject(ModalService);
  private readonly _filtersStateService = inject(DashboardFiltersStateService);
  private readonly _globalStateService = inject(GlobalStateService);
  private readonly _autoAvSetupService = inject(AutoAvSetupDataService);
  private readonly _eventWebsocketService = inject(EventWebsocketService);
  //#endregion

  public PostDataEnum = PostDataEnum;
  timeWindows;
  transitionTimes;
  postInsideInterval: number = TransitionTimes['15 Seconds'];
  postInsideValue: string = TransitionTimesEnum.Seconds15;

  protected selectedFilter = signal<'track' | 'location'>('track');
  protected autoAvChecked = signal<boolean>(false);

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
    this._setupAutoLocationSelection();
  }

  ngOnInit() {
    this.timeWindows = Object.keys(TimeWindows);
    this.transitionTimes = Object.keys(TransitionTimes);
    this.postInsideInterval =
      parseInt(localStorage.getItem('postInsideInterval')) || 15;
    this.postInsideValue =
      localStorage.getItem('postInsideValue') || TransitionTimesEnum.Seconds15;

    const savedStage = localStorage.getItem('SELECTED_LOCATION');
    if (savedStage) {
      const selectedOption: DropdownOption = JSON.parse(savedStage);
      this._selectLocationOption(selectedOption);
    }

    const savedAutoAvChecked = localStorage.getItem('IS_AUTO_AV_ENABLED');
    if (savedAutoAvChecked !== null) {
      const isAutoAvChecked = JSON.parse(savedAutoAvChecked);
      this.autoAvChecked.set(isAutoAvChecked);
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
    ) {
      return;
    }

    if (this.autoAvChecked()) {
      this._modalService.open(
        'Warning',
        'Auto AV is enabled right now. Changing the stage while Auto AV is enabled could cause issues. Please disable Auto AV before changing the stage.',
        'ok',
        () => {},
        () => {
          this._modalService.close();
        }
      );
      return;
    }

    this._modalService.open(
      'Confirm Stage Selection',
      'You are about to select a new stage. If this stage is currently active elsewhere, selecting it here may interrupt ongoing operations. Would you like to proceed?',
      'no_yes',
      () => {
        this._selectLocationOption(selectedOption);
        this.stageChanged.emit(selectedOption.label);
        this._modalService.close();
      },
      () => {
        this._modalService.close();
      }
    );
  };

  onAutoAVToggleChange(event: MatSlideToggleChange): void {
    event.source.checked = this.autoAvChecked();

    const desiredState = !this.autoAvChecked();
    const selectedEvent = this.selectedEvent();
    const selectedLocation = this.selectedLocation();

    if (!selectedEvent || !selectedLocation) {
      console.error('Event or Location is not selected.');
      return;
    }

    this._modalService.open(
      'Confirm Auto AV Setup Change',
      `You are about to ${desiredState ? 'enable' : 'disable'} Auto AV.
      ${desiredState ? '' : 'If you confirm, Auto AV will be disabled for the selected stage.'}
       Would you like to proceed?`,
      'yes_no',
      () => {
        const payload: AutoAvSetupRequest = {
          action: 'setAutoAvSetup',
          eventName: selectedEvent.label,
          stage: selectedLocation.label,
          autoAv: desiredState,
        };

        this._autoAvSetupService.setAutoAvSetup(payload).subscribe({
          next: (res) => {
            this.autoAvChecked.set(desiredState);
            localStorage.setItem(
              'IS_AUTO_AV_ENABLED',
              JSON.stringify(desiredState)
            );
            this.autoAvChanged.emit(desiredState);
            console.log('AutoAV setup updated successfully:', res);
            this._eventWebsocketService.setAutoAvToggle(desiredState);

            if (desiredState) {
              this._eventWebsocketService.initializeWebSocket(
                selectedLocation.label
              );
              console.log('WebSocket connection initialized.');
            } else {
              this._eventWebsocketService.closeWebSocket();
              console.log('WebSocket connection closed.');
            }
            this._modalService.close();
          },
          error: (err) => {
            console.error('Error updating AutoAV setup:', err);
            this._modalService.close();
          },
        });
      },
      () => {
        this._modalService.close();
      }
    );
  }

  private _setupAutoLocationSelection(): void {
    toObservable(this.eventLocations)
      .pipe(
        filter((locations) => locations.length > 0),
        take(1),
        tap((locations) => {
          if (locations.length === 1) {
            this._selectLocationOption(locations[0]);
          }
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  private _selectLocationOption(option: DropdownOption): void {
    this._filtersStateService.setSelectedLocation(option);
    localStorage.setItem('SELECTED_LOCATION', JSON.stringify(option));
    const locationsCopy = this.eventLocations().map((location) => ({
      ...location,
      isSelected: location.label === option.label,
    }));
    this._filtersStateService.setEventLocations(locationsCopy);
  }
}
