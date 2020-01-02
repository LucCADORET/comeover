import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebTorrentService } from 'src/app/services/web-torrent/web-torrent.service';
import { SyncService } from 'src/app/services/sync/sync.service';
import { UserService } from 'src/app/services/user/user.service';
import { UserData } from 'src/app/models/userData';
import Plyr from 'plyr';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
  selector: 'app-cinema',
  templateUrl: './cinema.component.html',
  styleUrls: ['./cinema.component.scss']
})
export class CinemaComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('videoElem', { static: false }) videoElem: ElementRef;
  @ViewChild('subtitlesElem', { static: false }) subtitlesElem: ElementRef;

  player: any;
  channelId: string;
  shareURL: string;
  info: string;
  error: string;
  isCreator: boolean = false;
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
    private modalService: NgbModal,
    private toastService: ToastService,
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

    // Determine controls depending on if the user is the creator or not
    if (this.isCreator) {
      opts = {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'fullscreen'],
      }
    } else {
      opts = {
        controls: ['current-time', 'mute', 'volume', 'captions', 'fullscreen'],
        clickToPlay: false,
        keyboard: { focused: false, global: false },
      }
    }
    let player = new Plyr(this.videoElem.nativeElement, opts);
    let self = this;
    player.on('ready', event => {
      self.player = event.detail.plyr;
      if (self.isCreator) {
        self.player.volume = 1;
        self.player.muted = false;
      } else {
        self.player.volume = 1;
        self.player.muted = true;
      }
    });
  }

  // Broadcast the current time of the stream
  startBroadcasting() {
    this.broadcastInterval = setInterval(() => {

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

  stopBroadcasting() {
    clearInterval(this.broadcastInterval);
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
    this.torrentLoading = false;
    this.torrentTimedout = false;
    this.clearLoadingTimeout();

    let self = this;

    console.log('Got torrent metadata!')

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

  notifyShareURLCopied(payload: string) {
    this.toastService.show('URL copied to clipboard', { delay: 1000 });
  }
}
