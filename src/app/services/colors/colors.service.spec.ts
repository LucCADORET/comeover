import { TestBed } from '@angular/core/testing';

import { ColorsService } from './colors.service';

describe('ColorsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ColorsService = TestBed.inject(ColorsService);
    expect(service).toBeTruthy();
  });
});
