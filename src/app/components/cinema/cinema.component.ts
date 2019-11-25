import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebTorrentService } from 'src/app/services/web-torrent/web-torrent.service';
import { SyncService } from 'src/app/services/sync/sync.service';
import { UserService } from 'src/app/services/user/user.service';
import { UserData } from 'src/app/models/userData';
import Plyr from 'plyr';

@Component({
  selector: 'app-cinema',
  templateUrl: './cinema.component.html',
  styleUrls: ['./cinema.component.scss']
})
export class CinemaComponent implements OnInit, AfterViewInit {

  @ViewChild('videoElem', { static: false }) videoElem: ElementRef;
  @ViewChild('subtitlesElem', { static: false }) subtitlesElem: ElementRef;

  player: any;
  channelId: string;
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
    // The others will wait on messages to get their version of the torrent 
    if (this.isCreator) {
      this.startTorrent();
    }

    this.syncService.init(this.channelId);
    this.syncService.getUserDataObservable().subscribe(this.onUserData.bind(this));
    this.startBroadcasting();
  }

  ngAfterViewInit() {
    let opts = {};

    // Determine controls depending on if the user is the creator or not
    if (this.isCreator) {
      opts = {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'pip', 'airplay', 'fullscreen']
      }
    } else {
      opts = {
        controls: ['current-time', 'mute', 'volume', 'captions', 'pip', 'fullscreen'],
        clickToPlay: false,
        keyboard: { focused: false, global: false }
      }
    }
    this.player = new Plyr(this.videoElem.nativeElement, opts);
  }

  // Broadcast the current time of the stream
  startBroadcasting() {
    var interval = setInterval(() => {

      let dataToBroadcast = new UserData({
        timestamp: new Date().getTime(),
        userId: this.userId,
        username: this.userService.getUsername(),
        color: this.userService.getColor(),
        isCreator: this.isCreator,
        currentTime: this.getVideoCurrentTime(),
        magnet: this.webTorrentService.magnet,
        paused: this.isVideoPaused(),
      });

      this.syncService.broadcastUserData(dataToBroadcast);
    }, 5000);
  }

  onUserData(data: UserData) {

    console.log(data);

    // The creator doesn't synchronize with anyone, and nobody synchronizes with people other than the creator
    if (this.isCreator || !data.isCreator) return;

    // Add the magnet is none is registered yet
    if (this.webTorrentService.magnet == null) {
      this.webTorrentService.magnet = data.magnet;
      this.startTorrent();
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

  startTorrent() {
    this.webTorrentService.startTorrent(this.onTorrent.bind(this));
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
    if (!this.isCreator) opts = { autoplay: true, muted: true };

    // Render all files into to the page
    torrent.files.forEach(function (file) {
      if (self.isVideoFile(file)) {
        file.renderTo('video#player', opts);
      } else if (self.isSubtitleFile(file)) {

        // Get subtitle blob in order to set it on the view
        file.getBlobURL(function (err, url) {
          self.subtitlesElem.nativeElement.src = url;
        });
      }
    })
  }

  isVideoFile(file): boolean {
    return file.name.endsWith('.mp4');
  }

  isSubtitleFile(file): boolean {
    return file.name.endsWith('.vtt');
  }

  isVideoPaused(): boolean {
    return this.videoElem.nativeElement.paused;
  }

  playVideo(): void {
    this.videoElem.nativeElement.play();
  }

  pauseVideo(): void {
    this.videoElem.nativeElement.pause();
  }

  setVideoCurrentTime(time: number) {
    if (!this.videoElem) return;
    return this.videoElem.nativeElement.currentTime = time;
  }

  getVideoCurrentTime(): number {
    if (!this.videoElem) return 0;
    return this.videoElem.nativeElement.currentTime;
  }
}
