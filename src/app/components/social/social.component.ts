import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserSettingsModalComponent } from '../user-settings-modal/user-settings-modal.component';

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss']
})
export class SocialComponent implements OnInit {

  constructor(
    private modalService: NgbModal,
  ) { }

  ngOnInit() {

  }

  openUserSettingsModal() {
    const modalRef = this.modalService.open(UserSettingsModalComponent, { size: "lg" });
    modalRef.result.then(result => {
      // this.createNewChannel();
      // TODO: fetch data from dataservice
    });
  }

}
