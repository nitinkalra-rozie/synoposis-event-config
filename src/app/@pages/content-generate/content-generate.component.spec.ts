import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentGenerateComponent } from './content-generate.component';

describe('ContentGenerateComponent', () => {
  let component: ContentGenerateComponent;
  let fixture: ComponentFixture<ContentGenerateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContentGenerateComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentGenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
