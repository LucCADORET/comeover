import { Injectable } from '@angular/core';
import swarm from 'webrtc-swarm';
import signalhub from 'signalhub';


@Injectable({
  providedIn: 'root'
})
export class SyncService {

  hub: any;
  swarm: any;
  channeldId: any;

  constructor() {
    this.hub = signalhub('signalhub', ['https://signalhub-jccqtwhdwc.now.sh'])
  }

  init(channelId) {
    this.channeldId = channelId;
    this.hub.subscribe(this.channeldId)
      .on('data', function (message) {
        console.log('new message received', message);
      })
  }

  broadcastToChannel(data) {
    this.hub.broadcast(this.channeldId, data);
  }
}
