import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as uuidv4 from 'uuid/v4';
import { UserService } from 'src/app/services/user/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectFilesModalComponent } from '../select-files-modal/select-files-modal.component';
import { FormControl, Validators } from '@angular/forms';
import { CinemaService } from '../../services/cinema/cinema.service';

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
    private modalService: NgbModal,
    private cinemaService: CinemaService,
  ) { }

  ngOnInit() {
  }

  createNewChannel(isLive: boolean) {
    this.channelId = uuidv4();
    this.userService.setIsCreator();

    // If it's not live, load the files to seed in memory
    if (!isLive) {
      this.cinemaService.filesToSeed = this.filesToSeed;
    }
    this.joinChannel(isLive);
  }

  submitChannelId() {
    if (this.channelIdInput.valid && this.channelIdInput.value) {
      this.channelId = this.channelIdInput.value;
      this.joinChannel(false);
    } else {
      this.channelIdInput.setErrors({ 'incorrect': true });
    }
  }

  joinChannel(isLive: boolean) {
    if (isLive) {
      this.router.navigate(['/live', this.channelId]);
    } else {
      this.router.navigate(['/cinema', this.channelId]);
    }
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
      this.createNewChannel(false);
    }).catch(err => {
      // nothing
    });
  }

  startLiveStream() {
    this.createNewChannel(true);
  }
}
