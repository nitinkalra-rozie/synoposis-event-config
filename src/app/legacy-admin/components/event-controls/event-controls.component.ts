import { NgClass, UpperCasePipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  EventEmitter,
  inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  retry,
  take,
  tap,
} from 'rxjs/operators';
import { SynSingleSelectComponent } from 'src/app/legacy-admin/@components/syn-single-select';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { RightSidebarState } from 'src/app/legacy-admin/@models/global-state';
import { GetMultiSelectOptionFromStringPipe } from 'src/app/legacy-admin/@pipes/get-multi-select-option-from-string.pipe';
import { BrowserWindowService } from 'src/app/legacy-admin/@services/browser-window.service';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { ModalService } from 'src/app/legacy-admin/services/modal.service';
import {
  INITIAL_POST_DATA,
  TimeWindows,
} from 'src/app/legacy-admin/shared/constants';
import {
  PostDataEnum,
  ThemeOptions,
  TimeWindowsEnum,
} from 'src/app/legacy-admin/shared/enums';
import { PostData } from 'src/app/legacy-admin/shared/types';

import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AutoAvSetupData,
  AutoAvSetupRequest,
  GetAutoAvSetupRequest,
} from 'src/app/legacy-admin/@data-services/auto-av-setup/auto-av-setup.data-model';
import { AutoAvSetupDataService } from 'src/app/legacy-admin/@data-services/auto-av-setup/auto-av-setup.data-service';
import { EventStageWebsocketDataService } from 'src/app/legacy-admin/@data-services/web-socket/event-stage-websocket.data-service';
import { EventStageWebSocketStateService } from 'src/app/legacy-admin/@store/event-stage-web-socket-state.service';
import { SynToastFacade } from 'src/app/shared/components/syn-toast/syn-toast-facade';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from 'src/app/shared/utils/local-storage-util';

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
export class EventControlsComponent implements OnInit, OnDestroy {
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _injector = inject(Injector);
  private readonly _modalService = inject(ModalService);
  private readonly _filtersStateService = inject(DashboardFiltersStateService);
  private readonly _globalStateService = inject(GlobalStateService);
  private readonly _autoAvSetupService = inject(AutoAvSetupDataService);
  private readonly _eventStageWebsocketDataService = inject(
    EventStageWebsocketDataService
  );
  private readonly _eventStageWebSocketState = inject(
    EventStageWebSocketStateService
  );
  private readonly _toastFacade = inject(SynToastFacade);
  private readonly _browserWindowService = inject(BrowserWindowService);

  private _previousStage: string | null = null;
  private _previousStageStatus: string | null = null;

  public PostDataEnum = PostDataEnum;
  // #region old version
  // timeWindows;
  // transitionTimes;
  // postInsideInterval: number = TransitionTimes['15 Seconds'];
  // postInsideValue: string = TransitionTimesEnum.Seconds15;
  // #endregion

  protected selectedFilter = signal<'track' | 'location'>('track');
  protected isAutoAvChecked = this._eventStageWebSocketState.$autoAvEnabled;

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
    this._setupAutoAvSetupWatcher();
    this._setupStageStatusMonitoring();
  }

  ngOnInit(): void {
    // #region old version
    // this.timeWindows = Object.keys(TimeWindows);
    // this.transitionTimes = Object.keys(TransitionTimes);
    // this.postInsideInterval =
    //   parseInt(localStorage.getItem('postInsideInterval')) || 15;
    // this.postInsideValue =
    //   localStorage.getItem('postInsideValue') || TransitionTimesEnum.Seconds15;
    // #endregion

    const savedLocation: DropdownOption =
      getLocalStorageItem<DropdownOption>('SELECTED_LOCATION');
    if (savedLocation) {
      this._selectLocationOption(savedLocation);
      this._checkAndConnectWithWebSocket(savedLocation.label);
      this._getAutoAvSetup(savedLocation.label);
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

  ngOnDestroy(): void {
    this._eventStageWebsocketDataService.disconnect();
    this._eventStageWebSocketState.resetState();
  }

  // #region old version
  // onPostInsideIntervalChange = (value: string) => {
  //   // This function will be triggered whenever the value of postInsideInterval changes
  //   this.postInsideInterval = TransitionTimes[value];
  //   this.postInsideValue = TransitionTimesEnum[value];
  //   console.log('postInsideInterval changed to:', this.postInsideInterval);
  //   localStorage.setItem(
  //     'postInsideInterval',
  //     this.postInsideInterval.toString()
  //   );
  //   localStorage.setItem('postInsideValue', this.postInsideValue.toString());
  //   // You can call any other functions or perform any other actions here
  // };

  // handleDropdownSelect = (value: string, key: PostDataEnum | string) => {
  //   if ((key as string) === 'TransitionTimes') {
  //     this.onPostInsideIntervalChange(value);
  //   } else {
  //     this.onUpdatePostData.emit({ key: key as PostDataEnum, value });
  //   }
  // };
  // #endregion

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

  onEventLocationSelect(selectedOption: DropdownOption): void {
    if (
      !selectedOption ||
      selectedOption.label === this.selectedLocation()?.label
    ) {
      return;
    }

    this._handlePreviousStageStatus();

    if (this.isAutoAvChecked()) {
      this._modalService.open(
        'Warning',
        'Auto AV is enabled right now. Changing the stage may interrupt ongoing Auto AV operations. Do you want to continue?',
        'no_yes',
        () => {
          this._selectLocationOption(selectedOption);
          this.stageChanged.emit(selectedOption.label);
          this._checkAndConnectWithWebSocket(selectedOption.label);
          this._modalService.close();
        },
        () => this._modalService.close()
      );
    } else {
      this._modalService.open(
        'Confirm Stage Selection',
        'You are about to select a new stage. If this stage is currently active elsewhere, selecting it here may interrupt ongoing operations. Would you like to proceed?',
        'no_yes',
        () => {
          this._selectLocationOption(selectedOption);
          this.stageChanged.emit(selectedOption.label);
          this._checkAndConnectWithWebSocket(selectedOption.label);
          this._modalService.close();
        },
        () => this._modalService.close()
      );
    }
  }

  onAutoAVToggleChange(event: MatSlideToggleChange): void {
    event.source.checked = this.isAutoAvChecked();

    const desiredState = !this.isAutoAvChecked();
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

        this._autoAvSetupService
          .setAutoAvSetup(payload)
          .pipe(
            take(1),
            tap(() => {
              this._eventStageWebSocketState.setAutoAvEnabled(desiredState);
              setLocalStorageItem('IS_AUTO_AV_ENABLED', desiredState);
              this.autoAvChanged.emit(desiredState);
            }),
            map((res) => {
              console.log('AutoAV setup updated successfully:', res);
            }),
            finalize(() => this._modalService.close())
          )
          .subscribe();
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

  private _setupAutoAvSetupWatcher(): void {
    combineLatest([
      toObservable(this.selectedEvent),
      toObservable(this.selectedLocation),
    ])
      .pipe(
        filter(([event, location]) => !!event && !!location),
        distinctUntilChanged(
          (prev, curr) =>
            prev[0]?.label === curr[0]?.label &&
            prev[1]?.label === curr[1]?.label
        ),
        tap(([event, location]) => {
          this._getAutoAvSetup(location.label);
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  private _setupStageStatusMonitoring(): void {
    effect(() => {
      const currentStage = this._eventStageWebSocketState.$connectedStage();
      this._previousStage = currentStage;
    });

    effect(() => {
      const statusData = this._eventStageWebSocketState.$stageStatusUpdated();
      if (statusData?.status) {
        this._previousStageStatus = statusData.status;
      }
    });
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

  private _checkAndConnectWithWebSocket(location: string | undefined): void {
    if (!location) return;

    const currentStage = this._eventStageWebSocketState.$connectedStage();
    const isConnecting = this._eventStageWebSocketState.$isConnecting();
    const isConnected = this._eventStageWebSocketState.$isConnected();

    if (currentStage === location && (isConnecting || isConnected)) {
      return;
    }

    if ((isConnected || isConnecting) && currentStage !== location) {
      this._eventStageWebsocketDataService.disconnect();
    }

    this._establishConnectionWithWebSocket(location);
  }

  private _establishConnectionWithWebSocket(location: string): void {
    this._eventStageWebsocketDataService
      .connect(location)
      .pipe(
        tap(() => console.log('WebSocket _wsSubscription')),
        catchError((error) => {
          throw error;
        }),
        retry({ delay: 5000 }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  private _getAutoAvSetup(stageName: string): void {
    const selectedEvent = this.selectedEvent();

    if (!selectedEvent || !stageName) {
      return;
    }

    const payload: GetAutoAvSetupRequest = {
      action: 'getAutoAvSetup',
      eventName: selectedEvent.label,
      stage: stageName,
    };

    this._autoAvSetupService
      .getAutoAvSetup(payload)
      .pipe(
        take(1),
        tap((response) => {
          const autoAvData: AutoAvSetupData = response.data;
          const autoAvStatus = autoAvData?.autoAv ?? false;
          this._eventStageWebSocketState.setAutoAvEnabled(autoAvStatus);
          setLocalStorageItem('IS_AUTO_AV_ENABLED', autoAvStatus);
          this.autoAvChanged.emit(autoAvStatus);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  private _handlePreviousStageStatus(): void {
    if (this._previousStage && this._previousStageStatus) {
      const isProjecting =
        this._previousStageStatus === 'ONLINE_AND_PROJECTING';

      if (!isProjecting) {
        this._browserWindowService.closeProjectionWindow();
        this._browserWindowService.clearWindowCloseCallback();

        const isOffline = this._previousStageStatus === 'OFFLINE';
        this.stageChanged.emit(
          isOffline ? 'PREVIOUS_STAGE_OFFLINE' : 'PREVIOUS_STAGE_NOT_PROJECTING'
        );
      }
    }
  }
}
