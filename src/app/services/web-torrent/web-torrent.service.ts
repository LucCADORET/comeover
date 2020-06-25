import { Injectable } from '@angular/core';
import WebTorrent from 'webtorrent';
import { LoggerService } from '../logger/logger.service';

@Injectable({
  providedIn: 'root'
})
export class WebTorrentService {

  private client: any;

  constructor(private logger: LoggerService) { }

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
    let self = this;
    try {
      this.client.remove(magnet, function () {
        self.logger.log("Removed torrent " + magnet);
      });
    } catch (error) {
      self.logger.error("Failed removing torrent");
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
    if (this.client.torrents.length == 0) return false;
    for (let torrent of this.client.torrents) {
      if (torrent.magnetURI == magnet) {
        return true;
      }
    }
    return false;
  }
}
