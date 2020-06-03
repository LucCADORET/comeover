import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebTorrentService } from 'src/app/services/web-torrent/web-torrent.service';
import { SyncService } from 'src/app/services/sync/sync.service';
import { UserService } from 'src/app/services/user/user.service';
import { UserData } from 'src/app/models/userData';
import { Subscription } from 'rxjs';
import { LoggerService } from 'src/app/services/logger/logger.service';
import { LiveService } from '../../services/live/live.service';
import * as Hls from 'hls.js'

@Component({
  selector: 'app-live',
  templateUrl: './live.component.html',
  styleUrls: ['./live.component.scss']
})
export class LiveComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('videoElem', { static: false }) videoElem: ElementRef;
  @ViewChild('subtitlesElem', { static: false }) subtitlesElem: ElementRef;

  player: any;
  hls: any;
  channelId: string;
  shareURL: string;
  info: string;
  error: string;
  isCreator: boolean = false;
  isLive: boolean = false;
  userId: string;
  allowedShift: number = 5;
  torrentLoading: boolean = true;
  torrentTimedout: boolean = false;
  torrentLoadingTimeoutMs: number = 30000;
  torrentLoadingTimeout: any;
  broadcastInterval: any;
  userDataSubscription: Subscription;

  // Some torrent metadata
  progress: number = 0;
  downloaded: number = 0;
  length: number = 0;
  timeRemaining: number = 0;
  downloadSpeed: number = 0;
  uploadSpeed: number = 0;
  numPeers: number = 0;


  constructor(
    private route: ActivatedRoute,
    private webTorrentService: WebTorrentService,
    private syncService: SyncService,
    private userService: UserService,
    private logger: LoggerService,
    private liveService: LiveService,
  ) {

  }

  ngOnInit() {
    this.channelId = this.route.snapshot.paramMap.get("channelId");
    this.shareURL = location.href;
    this.userId = this.userService.getUserId();
    this.isCreator = this.userService.isUserCreator();

    // The creator creates the torrent
    // The others will wait on messages to get their version of the torrent 
    if (this.isCreator) {
      this.startTorrent();

      // Show warning message to ask the creator if he is sure to shut down the stream. Note: string will probably be not shown.
      window.onbeforeunload = function (e) {
        var e = e || window.event;

        // For IE and Firefox
        if (e) {
          e.returnValue = 'Are you sure you want to exit the room ? You are the creator of the room, it will stop the file seeding, and the synchronization between the viewers.';
        }

        // For Safari
        return 'Are you sure you want to exit the room ? You are the creator of the room, it will stop the file seeding, and the synchronization between the viewers.';
      };
    }

    this.syncService.init(this.channelId);
    this.userDataSubscription = this.syncService.getUserDataObservable().subscribe(this.onUserData.bind(this));
    this.startBroadcasting();
    this.torrentLoadingTimeout = setTimeout(this.onTorrentLoadingTimeout.bind(this), this.torrentLoadingTimeoutMs);
  }

  ngOnDestroy(): void {
    this.stopBroadcasting();
    this.clearLoadingTimeout();
    this.userDataSubscription.unsubscribe();
    this.webTorrentService.destroyClient();
    window.onbeforeunload = null;
  }

  clearLoadingTimeout() {
    clearTimeout(this.torrentLoadingTimeout);
  }

  ngAfterViewInit() {
    let opts = {};

    // User "hls" player for the live stream
    this.hls = new Hls();
    this.hls.attachMedia(this.videoElem.nativeElement);
    let displayMediaOptions = {
      video: {
        cursor: "always"
      },
      audio: false
    };
    const mediaDevices = navigator.mediaDevices as any; // Workaround for typescript warning

    // Capture the user media
    mediaDevices.getDisplayMedia(displayMediaOptions).then((ms: MediaStream) => {
      this.videoElem.nativeElement.srcObject = ms;

      // When video is loaded, start recording
      this.videoElem.nativeElement.onloadedmetadata = () => {
        this.liveService.startRecording(ms)

        // Broadcast user data (with the manifest) whenever the manifest changes
        this.webTorrentService.manifestSubject.subscribe((manifest: string) => {
          this.broadcastUserData();
        });
      };
    });
  }

  // Broadcast the current time of the stream
  startBroadcasting() {
    this.broadcastInterval = setInterval(this.broadcastUserData.bind(this), 5000);
  }

  stopBroadcasting() {
    clearInterval(this.broadcastInterval);
  }

  broadcastUserData() {
    let dataToBroadcast = new UserData({
      timestamp: new Date().getTime(),
      userId: this.userId,
      username: this.userService.getUsername(),
      color: this.userService.getColor(),
      isCreator: this.isCreator,
      manifest: this.webTorrentService.manifestSubject.getValue(),
    });
    this.syncService.broadcastUserData(dataToBroadcast);
  }

  onUserData(data: UserData) {
    this.logger.log(JSON.stringify(data));

    // The creator doesn't synchronize with anyone, and nobody synchronizes with people other than the creator
    if (this.isCreator || !data.isCreator) return;

    // Add the magnet is none is registered yet
    if (this.webTorrentService.magnet == null) {
      this.webTorrentService.magnet = data.magnet;
      this.startTorrent();
    }
  }

  startTorrent() {
    this.webTorrentService.startTorrent(this.onTorrent.bind(this));
  }

  onTorrent(torrent) {
    this.torrentLoading = false;
    this.torrentTimedout = false;
    this.clearLoadingTimeout();

    let self = this;

    this.logger.log('Got torrent metadata!');

    this.info = 'Torrent info hash: ' + torrent.infoHash + ' ' +
      '<a href="' + torrent.magnetURI + '" target="_blank">[Magnet URI]</a> ' +
      '<a href="' + torrent.torrentFileBlobURL + '" target="_blank" download="' + torrent.name + '.torrent">[Download .torrent]</a>';

    // Print out progress every 5 seconds
    setInterval(function () {
      self.progress = torrent.progress;
      self.downloaded = torrent.downloaded;
      self.length = torrent.length;
      self.timeRemaining = torrent.timeRemaining;
      self.downloadSpeed = torrent.downloadSpeed;
      self.uploadSpeed = torrent.uploadSpeed;
      self.numPeers = torrent.numPeers;
    }, 2000);

    torrent.on('done', function () {
      self.progress = 1;
    })

    let opts = null;
    if (!this.isCreator) opts = { autoplay: true, muted: true, controls: false };
    else opts = { autoplay: false, muted: false, controls: false };

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
    return file.name.endsWith('.mp4') || file.name.endsWith('.webm');
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

  onTorrentLoadingTimeout() {
    this.torrentTimedout = true;
  }
}
