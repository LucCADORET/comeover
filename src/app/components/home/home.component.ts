import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as uuidv4 from 'uuid/v4';
import { UserService } from 'src/app/services/user/user.service';
import { WebTorrentService } from 'src/app/services/web-torrent/web-torrent.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  channelId: string = "";
  magnet: string = "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent";
  fileToSeed: File = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private webTorrentService: WebTorrentService,
  ) { }

  ngOnInit() {
  }

  createNewChannel() {
    this.channelId = uuidv4();
    this.userService.setIsCreator();
    if (this.fileToSeed) {
      this.webTorrentService.setFileToSeed(this.fileToSeed);
    } else if (this.magnet) {
      this.webTorrentService.setMagnet(this.magnet);
    }
    this.joinChannel();
  }

  joinChannel() {
    this.router.navigate(['/cinema', this.channelId]);
  }

  handleFileInput(files: FileList) {

    // TODO: check for the file type !!!

    this.fileToSeed = files.item(0);
  }
}
