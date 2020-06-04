import { Injectable } from '@angular/core';
import { Chunk } from '../../models/chunk';
import { BehaviorSubject } from 'rxjs';
import { WebTorrentService } from '../web-torrent/web-torrent.service';

@Injectable({
  providedIn: 'root'
})
export class LiveService {

  // Used for live streaming
  private _chunksBuffer: Array<Chunk>;
  private _manifestSubject: BehaviorSubject<Array<Chunk>>; // The "manifest" is actually only the last recorded chunks ids and magnets
  private BUFFER_MAX_COUNT = 6;

  constructor(private wtService: WebTorrentService) {
    this._manifestSubject = new BehaviorSubject([]);
    this._chunksBuffer = [];
  }

  get manifestSubject(): BehaviorSubject<Array<Chunk>> {
    return this._manifestSubject;
  }

  // Add a new chunk from a recorded video file
  addChunk(chunk: Chunk) {

    // Seed the chunk, and record its magnet URI
    this.wtService.seedFiles([chunk.file], (torrent) => {
      chunk.magnet = torrent.magnetURI;
      this._chunksBuffer.push(chunk);
      console.log(`Seeding ${chunk.file.name} with magnet URI ${chunk.magnet}`);
      let manifest = this.makeManifest()
      this._manifestSubject.next(manifest);
    });

    // If the chunk buffer is longer than the max buffer size, remove the chunk from the buffer and destroy the torrent
    if (this._chunksBuffer.length > this.BUFFER_MAX_COUNT) {
      let removedChunk = this._chunksBuffer.shift();
      this.wtService.removeTorrent(removedChunk.magnet);
    }
  }

  // Make the manifest with the magnets URI
  makeManifest(): any {
    let shortChunks = [];
    for (let chunk of this._chunksBuffer) {
      shortChunks.push({
        magnet: chunk.magnet,
        id: chunk.id,
      });
    }
    return shortChunks;
  };
}
