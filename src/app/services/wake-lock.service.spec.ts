import { TestBed, inject } from '@angular/core/testing';

import { WakeLockService } from './wake-lock.service';

describe('WakeLockService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WakeLockService]
    });
  });

  it('should be created', inject([WakeLockService], (service: WakeLockService) => {
    expect(service).toBeTruthy();
  }));
});
