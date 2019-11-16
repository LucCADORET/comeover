import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as uuidv4 from 'uuid/v4';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  channelId: string = "";

  constructor(
    private router: Router,
    private userService: UserService,
  ) { }

  ngOnInit() {
  }

  createNewChannel() {
    this.channelId = uuidv4();
    this.userService.currentUserIsCreator();
    this.joinChannel();
  }

  joinChannel() {
    this.router.navigate(['/cinema', this.channelId]);
  }
}
