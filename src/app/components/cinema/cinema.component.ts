import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebTorrentService } from 'src/app/services/web-torrent/web-torrent.service';
import { SyncService } from 'src/app/services/sync/sync.service';
import { UserService } from 'src/app/services/user/user.service';
import { UserData } from 'src/app/models/userData';


@Component({
  selector: 'app-cinema',
  templateUrl: './cinema.component.html',
  styleUrls: ['./cinema.component.scss']
})
export class CinemaComponent implements OnInit {

  @ViewChild('videoPlayer', { static: false }) videoPlayer: ElementRef;

  channelId: string;
  magnet: string;
  progress: string;
  info: string;
  error: string;
  isCreator: boolean = false;
  userId: string;
  allowedShift: number = 5;

  constructor(
    private route: ActivatedRoute,
    private webTorrentService: WebTorrentService,
    private syncService: SyncService,
    private userService: UserService,
  ) { }

  async ngOnInit() {
    this.channelId = this.route.snapshot.paramMap.get("channelId");
    this.userId = this.userService.getUserId();
    this.isCreator = this.userService.isUserCreator();

    // The creator creates the torrent
    if (this.isCreator) {
      this.magnet = "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent";
      this.addTorrent();
    }

    // The others will wait on messages to get their version of the torrent 
    else {

    }
    this.syncService.init(this.channelId, this.onMessage.bind(this));
    this.startBroadcasting();
  }

  // Broadcast the current time of the stream
  startBroadcasting() {
    var interval = setInterval(() => {

      let dataToBroadcast: UserData = {
        userId: this.userId,
        isCreator: this.isCreator,
        currentTime: this.getVideoCurrentTime(),
        magnet: this.magnet,
        paused: this.isVideoPaused(),
      }

      this.syncService.broadcastToChannel(dataToBroadcast);
    }, 5000);
  }

  onMessage(data: UserData) {

    console.log(data);

    // The creator doesn't synchronize with anyone, and nobody synchronizes with people other than the creator
    if (this.isCreator || !data.isCreator) return;

    if (this.magnet == null) {
      this.magnet = data.magnet;
      this.addTorrent();
    }

    // Set current video time if the shift is too high
    let currentTime = this.getVideoCurrentTime();
    if (Math.abs(currentTime - data.currentTime) > this.allowedShift) {
      this.setVideoCurrentTime(data.currentTime);
    }

    let paused = this.isVideoPaused();
    if (!paused && data.paused) {
      this.pauseVideo();
    }

    if (paused && !data.paused) {
      this.playVideo();
    }
  }

  addTorrent() {
    this.webTorrentService.add(this.magnet, this.onTorrent.bind(this));
  }

  onTorrent(torrent) {
    let self = this;

    console.log('Got torrent metadata!')

    this.info = 'Torrent info hash: ' + torrent.infoHash + ' ' +
      '<a href="' + torrent.magnetURI + '" target="_blank">[Magnet URI]</a> ' +
      '<a href="' + torrent.torrentFileBlobURL + '" target="_blank" download="' + torrent.name + '.torrent">[Download .torrent]</a>';

    // Print out progress every 5 seconds
    var interval = setInterval(function () {
      self.progress = (torrent.progress * 100).toFixed(1) + '%';
    }, 5000)

    torrent.on('done', function () {
      self.progress = '100%'
      clearInterval(interval);
    })

    let opts = null;
    if (!this.isCreator) opts = { autoplay: true, controls: false, muted: true };

    // Render all files into to the page
    torrent.files.forEach(function (file) {
      if (self.isVideoFile(file)) file.renderTo('video#player', opts);
    })
  }

  isVideoFile(file): boolean {
    return file.name.endsWith('.mp4');
  }

  isVideoPaused(): boolean {
    return this.videoPlayer.nativeElement.paused;
  }

  playVideo(): void {
    this.videoPlayer.nativeElement.play();
  }

  pauseVideo(): void {
    this.videoPlayer.nativeElement.pause();
  }

  setVideoCurrentTime(time: number) {
    if (!this.videoPlayer) return;
    return this.videoPlayer.nativeElement.currentTime = time;
  }

  getVideoCurrentTime(): number {
    if (!this.videoPlayer) return 0;
    return this.videoPlayer.nativeElement.currentTime;
  }
}
