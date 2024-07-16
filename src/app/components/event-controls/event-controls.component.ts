import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { INITIAL_POST_DATA, TimeWindows, TransitionTimes } from 'src/app/shared/constants';
import { PostDataEnum, ThemeOptions, TimeWindowsEnum, TransitionTimesEnum } from 'src/app/shared/enums';
import { PostData } from 'src/app/shared/types';

@Component({
  selector: 'app-event-controls',
  templateUrl: './event-controls.component.html',
  styleUrls: ['./event-controls.component.css'],
})
export class EventControlsComponent implements OnInit {
  public PostDataEnum = PostDataEnum;
  timeWindows;
  transitionTimes;
  postInsideInterval: number = TransitionTimes['15 Seconds'];
  postInsideValue: string = TransitionTimesEnum['15 Seconds'];

  @Input() eventNames: string[] = [];
  @Input() transcriptTimeOut: { label: string; value: number } = {
    label: TimeWindowsEnum['60 Seconds'],
    value: TimeWindows['60 Seconds'],
  };
  @Input() postData: PostData = INITIAL_POST_DATA;
  @Input() themeOptions: ThemeOptions[];
  @Output() onUpdatePostData: EventEmitter<{ key: PostDataEnum; value: string }>;
  @Output() onReset: EventEmitter<void>;

  constructor() {
    this.onUpdatePostData = new EventEmitter();
    this.onReset = new EventEmitter();
  }

  ngOnInit() {
    this.timeWindows = Object.keys(TimeWindows);
    this.transitionTimes = Object.keys(TransitionTimes);
    this.postInsideInterval = parseInt(localStorage.getItem('postInsideInterval')) || 15;
    this.postInsideValue = localStorage.getItem('postInsideValue') || TransitionTimesEnum['15 Seconds'];
  }

  onPostInsideIntervalChange = (value: string) => {
    // This function will be triggered whenever the value of postInsideInterval changes
    this.postInsideInterval = TransitionTimes[value];
    this.postInsideValue = TransitionTimesEnum[value];
    console.log('postInsideInterval changed to:', this.postInsideInterval);
    localStorage.setItem('postInsideInterval', this.postInsideInterval.toString());
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
    this.postInsideValue = TransitionTimesEnum['15 Seconds'];
    this.onReset.emit();
  };
}
