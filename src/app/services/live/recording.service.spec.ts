import { TestBed } from '@angular/core/testing';

import { RecordingService } from './recording.service';

describe('LiveService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RecordingService = TestBed.get(RecordingService);
    expect(service).toBeTruthy();
  });
});
