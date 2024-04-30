import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioStreamerComponent } from './audio-streamer.component';

describe('AudioStreamerComponent', () => {
  let component: AudioStreamerComponent;
  let fixture: ComponentFixture<AudioStreamerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AudioStreamerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AudioStreamerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
