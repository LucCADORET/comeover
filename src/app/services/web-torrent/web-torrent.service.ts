import { Injectable } from '@angular/core';

import WebTorrent from 'webtorrent';
import { Chunk } from '../../models/chunk';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebTorrentService {

  // Used for file streaming
  private _magnet: string;
  private _filesToSeed: File[];

  // Used for live streaming
  private _chunks: Array<Chunk>;
  private _manifestSubject: BehaviorSubject<string>;

  private client: any;

  constructor() {
    this._manifestSubject = new BehaviorSubject('');
    this._chunks = [];
  }

  get magnet(): string {
    return this._magnet;
  }

  set magnet(magnet: string) {
    this._magnet = magnet;
  }

  set filesToSeed(files: File[]) {
    this._filesToSeed = files;
  }

  get manifestSubject(): BehaviorSubject<string> {
    return this._manifestSubject;
  }

  // Starts the webtorrent client, and either adds a magnet, or starts to seed files
  startTorrent(callback: any) {
    this.client = new WebTorrent();
    if (this._filesToSeed) {
      this.client.seed(this._filesToSeed, (torrent) => {
        this._magnet = torrent.magnetURI;
        callback(torrent)
      });
    } else if (this._magnet) {
      this.client.add(this._magnet, callback);
    }
  }

  destroyClient() {
    if (this.client) {
      this.client.destroy();
    }
  }

  // Gets all the chunks to seed at the moment
  // If some chunks are already beeing seeded, it will just keep them as they are
  seedChunks(chunks: Array<Chunk>) {
    for (let chunk of chunks) {
      let existingChunk = this._chunks.find((c: Chunk) => c.id == chunk.id);
      if (!existingChunk) {
        this._chunks.push(chunk);
        this.client.seed(chunk.file, (torrent) => {
          chunk.magnet = torrent.magnetURI;
          console.log(`Seeding ${chunk.file.name} with magnet URI ${chunk.magnet}`);
          this.makeManifest()
        });
        // Seed this new chunk
      }
    }

    // Cleanup chunk to not seed anymore
    this._chunks = this._chunks.filter((chunk: Chunk) => {
      let chunkIndex = chunks.findIndex((c: Chunk) => c.id == chunk.id);
      return chunkIndex != -1;
    });
  }

  // Make the m3u8 manifest
  makeManifest() {
    let manifest = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:${environment.targetDuration}\n#EXT-X-MEDIA-SEQUENCE:${this._chunks[0].id}` // The sequence id of the id of the first chunk of the sequence
    for (let chunk of this._chunks) {
      manifest += `\n#EXTINF: ${environment.targetDuration}\n###${chunk.magnet}\n${chunk.file.name}`; // TODO: get exact duration of the chunk
    }
    this._manifestSubject.next(manifest);
  }
}
