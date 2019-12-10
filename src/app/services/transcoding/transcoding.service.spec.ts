import { TestBed } from '@angular/core/testing';

import { TranscodingService } from './transcoding.service';

describe('TranscodingServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TranscodingService = TestBed.get(TranscodingService);
    expect(service).toBeTruthy();
  });
});
