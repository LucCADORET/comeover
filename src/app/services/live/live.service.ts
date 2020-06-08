import { Injectable } from '@angular/core';
import { Chunk } from '../../models/chunk';
import { WebTorrentService } from '../web-torrent/web-torrent.service';
import { LoggerService } from '../logger/logger.service';
import { SyncService } from '../sync/sync.service';
import { Subscription } from 'rxjs';
import { UserService } from '../user/user.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LiveService {

  // Used for live streaming
  private _chunksBuffer: Record<number, Chunk>;
  private _manifest: Array<Chunk>; // The "manifest" is actually only the last recorded chunks ids and magnets
  private BUFFER_MAX_COUNT = 6;
  private manifestSubscription: Subscription;
  private _mediaSource: MediaSource;
  private _sourceBuffer: SourceBuffer;

  constructor(
    private wtService: WebTorrentService,
    private logger: LoggerService,
    private syncService: SyncService,
    private userService: UserService,
  ) {
    this._manifest = [];
    this._chunksBuffer = {};

    // Create media source for the stream, and create the source buffer when ready
    let self = this;
    this._mediaSource = new MediaSource();
    this._mediaSource.addEventListener('sourceopen', function () {
      self._sourceBuffer = self.mediaSource.addSourceBuffer(environment.recordingMimeType);
      self._sourceBuffer.mode = 'sequence';
      self._sourceBuffer.addEventListener('error', function (ev) {
        console.error("Source buffer error ??");
        console.error(ev);
      });
    });

    this.manifestSubscription = this.syncService.getManifestObservable().subscribe(this.onManifest.bind(this));
  }

  get mediaSource() {
    return this._mediaSource;
  }

  // Add a new chunk from a recorded video file, and seeds it
  seedChunk(chunk: Chunk) {
    let self = this;

    // Seed the chunk, and record its magnet URI
    this.wtService.seedFiles([chunk.file], (torrent) => {
      self.appendBlobToBuffer(chunk.file);
      chunk.magnet = torrent.magnetURI;
      this._chunksBuffer[chunk.id] = chunk;
      console.log(`Seeding ${chunk.file.name} with magnet URI ${chunk.magnet}`);
      this._manifest = this.makeManifest();
      this.syncService.broadcastManifest(this._manifest);
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

    // On previous torrent download end, start downloading next chunk (id there is any)
    // And add the downloaded buffer to the source buffer
    torrent.on('done', function () {
      console.log("Finished downloading chunk " + chunk.id);
      chunk.setReady();
      chunk.file.getBlob((err: any, blob: Blob) => {
        self.appendBlobToBuffer(blob);
      });

      // Download next chunk if any
      let nextChunk = self._chunksBuffer[(chunk.id + 1)];
      if (nextChunk) {
        console.log("Start downloading new chunk " + nextChunk.id);
        self.addTorrent(nextChunk.magnet);
      } else {
        console.log("No chunk to download in buffer");
      };

    });
  }

  appendBlobToBuffer(blob: Blob) {

    // We call the arrayBuffer in this dirty way, since typescript doesn't have all the types for blob
    blob['arrayBuffer']().then((buffer: ArrayBuffer) => {
      this._sourceBuffer.appendBuffer(buffer)
    });
    // Event for view to play video ?
  }

  getChunkId(name: string): number {
    let match = name.match(/(chunk)(\d+)(\.webm)/);
    return parseFloat(match[2]);
  }

  onManifest(data: Array<Chunk>) {
    console.log("Received new manifest of size " + data.length);

    // If the user is not the creator, we have to download the chunks
    if (!this.userService.isUserCreator()) {
      this.setChunksFromManifest(data);
    }
  }
}
