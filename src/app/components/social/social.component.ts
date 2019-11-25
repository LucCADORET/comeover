import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserSettingsModalComponent } from '../user-settings-modal/user-settings-modal.component';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss']
})
export class SocialComponent implements OnInit {

  username: string;
  color: string;

  constructor(
    private modalService: NgbModal,
    private userService: UserService,
  ) { }

  ngOnInit() {
    this.username = this.userService.getUsername();
    this.color = this.userService.getColor();
  }

  openUserSettingsModal() {
    const modalRef = this.modalService.open(UserSettingsModalComponent, { size: "lg" });
    modalRef.result.then(() => {
      this.username = this.userService.getUsername();
      this.color = this.userService.getColor();
    });
  }

}
