import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import WebTorrent from 'webtorrent';

@Injectable({
  providedIn: 'root'
})
export class WebTorrentService {

  private magnet: string;
  private fileToSeed: File;
  private client: any;

  constructor() {
    this.client = new WebTorrent();
  }

  getMagnet(): string {
    return this.magnet;
  }

  setMagnet(magnet: string) {
    this.magnet = magnet;
  }

  setFileToSeed(file: File) {
    this.fileToSeed = file;
  }

  startTorrent(callback: any) {
    if (this.fileToSeed) {
      let options = {
        name: this.fileToSeed.name
      }
      this.client.seed(this.fileToSeed, options, (torrent) => {
        this.magnet = torrent.magnetURI;
        callback(torrent)
      });
    } else if (this.magnet) {
      this.client.add(this.magnet, callback);
    }
  }
}
