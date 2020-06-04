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
  private _manifestSubject: BehaviorSubject<Array<Chunk>>;

  private client: any;

  constructor() {
    this._manifestSubject = new BehaviorSubject([]);
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

  get manifestSubject(): BehaviorSubject<Array<Chunk>> {
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

  addTorrent(magnet: string, callback: any) {
    this.client.add(magnet, callback);
  }


  // Seed the last chunks of recorded data
  seedChunks(chunks: Array<Chunk>) {
    for (let chunk of chunks) {
      let existingChunk = this._chunks.find((c: Chunk) => c.id == chunk.id);
      if (!existingChunk) {
        this._chunks.push(chunk);
        this.client.seed(chunk.file, (torrent) => {
          chunk.magnet = torrent.magnetURI;
          console.log(`Seeding ${chunk.file.name} with magnet URI ${chunk.magnet}`);
          let manifest = this.makeManifest()
          this._manifestSubject.next(manifest);
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

  // Checks if the client if currently downloading anything
  isDownloading() {
    if (!this.client) return false;
    if (this.client.torrents.length == 0) return false;
    if (this.client.torrents.some((t: any) => t.done == false)) return true;
    return false;
  }

  // Looks through the client's torrents to check if a chunk isn't already in the list of torrents
  isChunkNew(chunk: Chunk): boolean {
    if (!this.client) return false;
    if (this.client.torrents.length == 0) return true;
    for (let torrent of this.client.torrents) {
      if (torrent.magnetURI == chunk.magnet) {
        return false;
      }
    }
    return true;
  }

  // Make the manifest with the magnets URI
  makeManifest(): any {
    let shortChunks = [];

    for (let chunk of this._chunks) {
      shortChunks.push({
        magnet: chunk.magnet,
        id: chunk.id,
      });
    }
    return shortChunks;
  };

  destroyClient() {
    if (this.client) {
      this.client.destroy();
    }
  }
}
