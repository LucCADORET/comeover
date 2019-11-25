import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserSettingsModalComponent } from '../user-settings-modal/user-settings-modal.component';
import { UserService } from 'src/app/services/user/user.service';
import { SyncService } from 'src/app/services/sync/sync.service';
import { UserData } from 'src/app/models/userData';

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss']
})
export class SocialComponent implements OnInit {

  userId: string;
  username: string;
  color: string;

  connectedUsers: UserData[] = [];
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
    this.syncService.getMessageObservable().subscribe(this.onMessage.bind(this));
  }

  openUserSettingsModal() {
    const modalRef = this.modalService.open(UserSettingsModalComponent, { size: "lg" });
    modalRef.result.then(() => {
      this.username = this.userService.getUsername();
      this.color = this.userService.getColor();
    });
  }

  onMessage(data: UserData) {

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
}
