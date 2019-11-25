import { Component, OnInit, ElementRef, ViewChild, QueryList, AfterViewInit, ViewChildren } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserSettingsModalComponent } from '../user-settings-modal/user-settings-modal.component';
import { UserService } from 'src/app/services/user/user.service';
import { SyncService } from 'src/app/services/sync/sync.service';
import { UserData } from 'src/app/models/userData';
import { ChatMessage } from 'src/app/models/chatMessage';

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss']
})
export class SocialComponent implements OnInit, AfterViewInit {

  @ViewChildren('chatMessageElem') chatMessageElem: QueryList<ElementRef>;
  userId: string;
  username: string;
  color: string;
  message: string = "";
  connectedUsers: UserData[] = new Array<UserData>();
  chatMessages: ChatMessage[] = new Array<ChatMessage>();
  timeoutMs: number = 30000;

  constructor(
    private modalService: NgbModal,
    private userService: UserService,
    private syncService: SyncService,
  ) { }

  ngOnInit() {
    this.username = this.userService.getUsername();
    this.color = this.userService.getColor();
    this.userId = this.userService.getUserId();
    this.syncService.getUserDataObservable().subscribe(this.onUserData.bind(this));
    this.syncService.getChatMessageObservable().subscribe(this.onChatMessage.bind(this));
  }

  ngAfterViewInit() {
    this.chatMessageElem.changes.subscribe(() => {
      if (this.chatMessageElem && this.chatMessageElem.last) {
        this.chatMessageElem.last.nativeElement.scrollIntoView();
      }
    });
  }

  openUserSettingsModal() {
    const modalRef = this.modalService.open(UserSettingsModalComponent, { size: "lg" });
    modalRef.result.then(() => {
      this.username = this.userService.getUsername();
      this.color = this.userService.getColor();
    });
  }

  onUserData(data: UserData) {

    // Check if user already in list
    let user = this.connectedUsers.find(u => u.userId == data.userId);

    // Update user data
    if (user) {
      user.setAll(data);
    }

    // Add new
    else {
      this.connectedUsers.push(data);
    }

    // Kick out users that timed out
    let now = new Date().getTime();
    this.connectedUsers = this.connectedUsers.filter(u => (u.timestamp + this.timeoutMs) > now);
  }

  onChatMessage(data: ChatMessage) {
    this.chatMessages.push(data);
  }

  sendChatMessage() {
    if (!this.message) return;
    let chatMessage = new ChatMessage({
      username: this.username,
      color: this.color,
      content: this.message,
      timestamp: new Date().getTime()
    });
    this.syncService.broadcastChatMessage(chatMessage);
    this.message = "";
  }
}
