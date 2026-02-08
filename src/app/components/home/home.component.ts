import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as uuidv4 from 'uuid/v4';
import { UserService } from 'src/app/services/user/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormControl, Validators } from '@angular/forms';
import { CinemaService } from '../../services/cinema/cinema.service';
import { SelectModeModalComponent } from '../select-mode-modal/select-mode-modal.component';
import { SelectModeResult } from '../../models/selectModeResult';
import { ModesEnum } from '../../enums/modesEnum';
import { LiveService } from 'src/app/services/live/live.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  channelId: string = "";
  magnet: string = "";
  channelIdInput = new UntypedFormControl('', Validators.pattern(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));

  constructor(
    private router: Router,
    private userService: UserService,
    private modalService: NgbModal,
    private cinemaService: CinemaService,
    private liveService: LiveService,
  ) { }

  ngOnInit() { }

  createNewChannel(result: SelectModeResult) {
    this.channelId = uuidv4();
    this.userService.setIsCreator();

    // Not live: just set the files to seed in the cinema service
    if (result.mode == ModesEnum.FILE) {
      this.cinemaService.filesToSeed = result.data as File[];
      this.router.navigate(['/cinema', this.channelId]);
    }

    // Live: set the mediastream source in the recording service
    else if (result.mode == ModesEnum.LIVE) {
      this.liveService.mediaStream = result.data as MediaStream;
      this.router.navigate(['/live', this.channelId]);
    }
  }

  openSelectModeModal() {
    const modalRef = this.modalService.open(
      SelectModeModalComponent,
      {
        size: "lg",
        backdrop: "static",
        keyboard: false,
        centered: true,
      }
    );

    modalRef.result.then((result: SelectModeResult) => {
      this.createNewChannel(result);
    }).catch(err => {
      // nothing
    });
  }
}
