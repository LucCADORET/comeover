import { Injectable } from '@angular/core';
import { Chunk } from '../../models/chunk';
import { WebTorrentService } from '../web-torrent/web-torrent.service';
import { LoggerService } from '../logger/logger.service';

@Injectable({
  providedIn: 'root'
})
export class LiveService {

  // Used for live streaming
  private _chunksBuffer: Record<number, Chunk>;
  private _currentChunk: Chunk; // Currently playing chunk
  private _manifest: Array<Chunk>; // The "manifest" is actually only the last recorded chunks ids and magnets
  private BUFFER_MAX_COUNT = 6;

  constructor(
    private wtService: WebTorrentService,
    private logger: LoggerService,
  ) {
    this._manifest = [];
    this._chunksBuffer = {};
  }

  get manifest(): Array<Chunk> {
    return this._manifest;
  }

  // Add a new chunk from a recorded video file, and seeds it
  seedChunk(chunk: Chunk) {
    let self = this;

    // Seed the chunk, and record its magnet URI
    this.wtService.seedFiles([chunk.file], (torrent) => {
      chunk.magnet = torrent.magnetURI;
      this._chunksBuffer[chunk.id] = chunk;
      console.log(`Seeding ${chunk.file.name} with magnet URI ${chunk.magnet}`);
      this._manifest = this.makeManifest()
      self.cleanBuffer();
    });
  }

  // Cleans the buffer if its length exceeded
  cleanBuffer() {

    // If the chunk buffer is longer than the max buffer size, remove the chunk from the buffer and destroy the torrent
    let keys = Object.keys(this._chunksBuffer);
    if (keys.length > this.BUFFER_MAX_COUNT) {
      let removedChunk = this._chunksBuffer[keys[0]];
      this.wtService.removeTorrent(removedChunk.magnet);
      delete (this._chunksBuffer[keys[0]]);
    }
  }

  setChunksFromManifest(manifest: Array<Chunk>): any {

    // Add the received chunks to the buffer if they are not here already
    for (let shortChunk of manifest) {
      let existingChunk = this._chunksBuffer[shortChunk.id];

      // if the chunk is not existing, add it right after the last id
      if (existingChunk == null) {
        this._chunksBuffer[shortChunk.id] = shortChunk;
      }
    }
    this.cleanBuffer();

    // Add chunk torrent if no chunk is being downloaded 
    // AND if this is a new chunk (not downloaded, and not downloading)
    if (!this.wtService.isDownloading()) {
      for (let chunkId in this._chunksBuffer) {
        let chunk = this._chunksBuffer[chunkId];
        if (this.wtService.magnetExists(chunk.magnet)) {
          this.addTorrent(chunk.magnet);
          return;
        }
      }
    }
  }

  // If there is no playing chunk, returns the first chunk we have on hand
  // If there is already a current chunk, returns the next one
  nextChunk() {
    let keys = Object.keys(this._chunksBuffer);

    // If there are no playing current chunk, get the first ready chunk
    if (!this._currentChunk) {
      for (let index in this._chunksBuffer) {
        if (this._chunksBuffer[index].isReady()) {
          this._currentChunk = this._chunksBuffer[keys[0]];
          console.log("Loading first chunk " + this._currentChunk.file.name);
          return this._currentChunk;
        }
      }
      console.log("No ready chunk to load");
      return null;
    }

    // Else get the next ready chunk
    else {
      console.log(`${this._currentChunk.file.name} ended`)
      let nextChunk = this._chunksBuffer[(this._currentChunk.id + 1)];
      if (!nextChunk || !nextChunk.isReady()) return null;
      this._currentChunk = nextChunk;
      console.log(`Loading chunk ${this._currentChunk.file.name}`)
      return this._currentChunk;
    }
  }

  // Make the manifest with the magnets URI
  makeManifest(): any {
    let shortChunks = [];
    for (let index in this._chunksBuffer) {
      shortChunks.push({
        magnet: this._chunksBuffer[index].magnet,
        id: this._chunksBuffer[index].id,
      });
    }
    return shortChunks;
  };

  addTorrent(magnet: string) {
    this.wtService.addTorrent(magnet, this.onTorrent.bind(this));
  }

  onTorrent(torrent) {
    let self = this;
    this.logger.log('Got torrent metadata!');
    let videoFile = torrent.files.find(function (file) {
      return file.name.endsWith('.webm')
    });
    let chunk = this._chunksBuffer[this.getChunkId(videoFile.name)];
    chunk.file = videoFile;

    // On previous torrent download end, add next chunk (id there is any)
    torrent.on('done', function () {
      console.log("Finished downloading chunk " + chunk.id);
      chunk.setReady();
      let nextChunk = self._chunksBuffer[(chunk.id + 1)];
      if (nextChunk) {
        console.log("Start downloading new chunk " + nextChunk.id);
        self.addTorrent(nextChunk.magnet);
      } else {
        console.log("No chunk to download in buffer");
      };
    });
  }

  getChunkId(name: string): number {
    let match = name.match(/(chunk)(\d+)(\.webm)/);
    return parseFloat(match[2]);
  }
}
