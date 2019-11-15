import { Component, OnInit } from '@angular/core';
import { SyncService } from 'src/app/services/sync.service';
import { Router } from '@angular/router';
import * as uuidv4 from 'uuid/v4';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  channelId: string = "";

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }

  createNewChannel() {
    this.channelId = uuidv4();
    this.joinChannel(true);
  }

  joinChannel(isCreator) {
    this.router.navigate(['/cinema', this.channelId], { queryParams: { 'is_creator': isCreator } });
  }
}
