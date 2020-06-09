import { Injectable } from '@angular/core';

import WebTorrent from 'webtorrent';
import { Chunk } from '../../models/chunk';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebTorrentService {

  private client: any;

  constructor() { }

  startClient() {
    this.client = new WebTorrent();
  }

  seedFiles(files: File[], callback: any) {
    this.client.seed(files, (torrent) => {
      callback(torrent);
    });
  }

  addTorrent(magnet: string, callback: any) {
    this.client.add(magnet, callback);
  }

  // Remove a torrent from its magnet URI
  removeTorrent(magnet: string) {
    try {
      this.client.remove(magnet, function () {
        console.log("Removed torrent " + magnet);
      });
    } catch (error) {
      console.log("Failed removing torrent");
      return;
    }
  }


  // Checks if the client if currently downloading anything
  isDownloading() {
    if (!this.client) return false;
    if (this.client.torrents.length == 0) return false;
    if (this.client.torrents.some((t: any) => t.done == false)) return true;
    return false;
  }

  destroyClient() {
    if (this.client) {
      this.client.destroy();
    }
  }

  // Looks through the client's torrents to check if a chunk isn't already in the list of torrents
  magnetExists(magnet: string): boolean {
    if (!this.client) return false;
    if (this.client.torrents.length == 0) return true;
    for (let torrent of this.client.torrents) {
      if (torrent.magnetURI == magnet) {
        return false;
      }
    }
    return true;
  }
}
