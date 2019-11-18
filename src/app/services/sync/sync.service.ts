import { Injectable } from '@angular/core';
import signalhub from 'signalhub';
import { UserData } from 'src/app/models/userData';


@Injectable({
  providedIn: 'root'
})
export class SyncService {

  hub: any;
  channeldId: any;

  constructor() {
    this.hub = signalhub('signalhub', ['https://signalhub-jccqtwhdwc.now.sh'])
  }

  init(channelId, callback) {
    this.channeldId = channelId;
    this.hub.subscribe(this.channeldId)
      .on('data', callback)
  }

  broadcastToChannel(data: UserData) {
    this.hub.broadcast(this.channeldId, data);
  }
}
