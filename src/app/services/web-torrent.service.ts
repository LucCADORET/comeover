import { Injectable } from '@angular/core';
import WebTorrent from 'webtorrent';

@Injectable({
  providedIn: 'root'
})
export class WebTorrentService {

  private client: any;

  constructor() {
    this.client = new WebTorrent();
  }

  add(magnet: String, callback: any) {
    this.client.add(magnet, callback);
  }
}
