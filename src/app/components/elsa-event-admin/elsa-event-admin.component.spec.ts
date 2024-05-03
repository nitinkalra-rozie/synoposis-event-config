import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ElsaEventAdminComponent } from './elsa-event-admin.component';

describe('ElsaEventAdminComponent', () => {
  let component: ElsaEventAdminComponent;
  let fixture: ComponentFixture<ElsaEventAdminComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ElsaEventAdminComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ElsaEventAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
