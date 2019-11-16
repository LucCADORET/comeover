import { TestBed } from '@angular/core/testing';

import { WebTorrentService } from './web-torrent.service';

describe('WebTorrentService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebTorrentService = TestBed.get(WebTorrentService);
    expect(service).toBeTruthy();
  });
});
