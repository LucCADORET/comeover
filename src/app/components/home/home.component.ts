import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as uuidv4 from 'uuid/v4';
import { UserService } from 'src/app/services/user/user.service';
import { WebTorrentService } from 'src/app/services/web-torrent/web-torrent.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectFilesModalComponent } from '../select-files-modal/select-files-modal.component';
import { FormControl, PatternValidator, Validators } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  channelId: string = "";
  magnet: string = "";
  filesToSeed: File[] = null;
  channelIdInput = new FormControl('', Validators.pattern(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));

  constructor(
    private router: Router,
    private userService: UserService,
    private webTorrentService: WebTorrentService,
    private modalService: NgbModal,
  ) { }

  ngOnInit() {
  }

  createNewChannel() {
    this.channelId = uuidv4();
    this.userService.setIsCreator();
    if (this.filesToSeed) {
      this.webTorrentService.filesToSeed = this.filesToSeed;
    } else if (this.magnet) {
      this.webTorrentService.magnet = this.magnet;
    }
    this.joinChannel();
  }

  submitChannelId() {
    if (this.channelIdInput.valid && this.channelIdInput.value) {
      this.channelId = this.channelIdInput.value;
      this.joinChannel();
    } else {
      this.channelIdInput.setErrors({ 'incorrect': true });
    }
  }

  joinChannel() {
    this.router.navigate(['/cinema', this.channelId]);
  }

  openSelectFilesModal() {
    const modalRef = this.modalService.open(
      SelectFilesModalComponent,
      {
        size: "lg",
        backdrop: "static",
        keyboard: false
      }
    );
    modalRef.result.then(result => {
      this.filesToSeed = result;
      this.createNewChannel();
    }).catch(err => {
      // nothing
    });
  }
}
