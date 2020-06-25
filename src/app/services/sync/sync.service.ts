import { Injectable } from '@angular/core';
import signalhub from 'signalhub';
import { UserData } from 'src/app/models/userData';
import { Subject, Observable } from 'rxjs';
import { ChatMessage } from 'src/app/models/chatMessage';
import { Message } from 'src/app/models/message';
import { MessageTypeEnum } from 'src/app/enums/messageTypeEnum';
import { Manifest } from '../../models/manifest';


@Injectable({
  providedIn: 'root'
})
export class SyncService {

  hub: any;
  channeldId: any;
  private userDataSubject = new Subject<UserData>();
  private chatMessageSubject = new Subject<ChatMessage>();
  private manifestSubject = new Subject<Manifest>();

  constructor() {
    this.hub = signalhub('signalhub', ['https://signalhub-jccqtwhdwc.now.sh'])
  }

  init(channelId) {
    this.channeldId = channelId;
    this.hub.subscribe(this.channeldId)
      .on('data', this.onMessage.bind(this))
  }

  onMessage(data: any) {
    let message = new Message(data);
    if (message.type == MessageTypeEnum.PING) {
      this.userDataSubject.next(message.data as UserData);
    } else if (message.type == MessageTypeEnum.CHAT) {
      this.chatMessageSubject.next(message.data as ChatMessage);
    } else if (message.type == MessageTypeEnum.MANIFEST) {
      this.manifestSubject.next(message.data as Manifest);
    }
  }

  getUserDataObservable(): Observable<UserData> {
    return this.userDataSubject.asObservable();
  }

  getChatMessageObservable(): Observable<ChatMessage> {
    return this.chatMessageSubject.asObservable();
  }

  getManifestObservable(): Observable<Manifest> {
    return this.manifestSubject.asObservable();
  }

  broadcastUserData(data: UserData) {
    let message = new Message({ type: MessageTypeEnum.PING, data: data });
    this.broadcastToChannel(message);
  }

  broadcastChatMessage(data: ChatMessage) {
    let message = new Message({ type: MessageTypeEnum.CHAT, data: data });
    this.broadcastToChannel(message);
  }

  broadcastManifest(data: Manifest) {
    let message = new Message({ type: MessageTypeEnum.MANIFEST, data: data });
    this.broadcastToChannel(message);
  }

  private broadcastToChannel(data: Message) {
    this.hub.broadcast(this.channeldId, data);
  }
}
