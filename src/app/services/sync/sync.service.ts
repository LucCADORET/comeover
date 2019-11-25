import { Injectable } from '@angular/core';
import signalhub from 'signalhub';
import { UserData } from 'src/app/models/userData';
import { Subject, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class SyncService {

  hub: any;
  channeldId: any;
  private messageSubject = new Subject<UserData>();

  constructor() {
    this.hub = signalhub('signalhub', ['https://signalhub-jccqtwhdwc.now.sh'])
  }

  init(channelId) {
    this.channeldId = channelId;
    this.hub.subscribe(this.channeldId)
      .on('data', this.onMessage.bind(this))
  }

  onMessage(data: any) {
    let userData = new UserData(data);
    this.messageSubject.next(userData);
  }

  getMessageObservable(): Observable<UserData> {
    return this.messageSubject.asObservable();
  }

  broadcastToChannel(data: UserData) {
    this.hub.broadcast(this.channeldId, data);
  }
}
