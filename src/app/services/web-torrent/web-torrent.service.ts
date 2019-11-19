import { Injectable } from '@angular/core';

import WebTorrent from 'webtorrent';

@Injectable({
  providedIn: 'root'
})
export class WebTorrentService {

  private _magnet: string;
  private _filesToSeed: File[];
  private client: any;

  constructor() {
    this.client = new WebTorrent();
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

  startTorrent(callback: any) {
    if (this._filesToSeed) {
      // let options = {
      //   name: uuidv4()
      // }
      this.client.seed(this._filesToSeed, (torrent) => {
        this._magnet = torrent.magnetURI;
        callback(torrent)
      });
    } else if (this._magnet) {
      this.client.add(this._magnet, callback);
    }
  }
}
