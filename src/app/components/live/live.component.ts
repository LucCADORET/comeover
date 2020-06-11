import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebTorrentService } from 'src/app/services/web-torrent/web-torrent.service';
import { SyncService } from 'src/app/services/sync/sync.service';
import { UserService } from 'src/app/services/user/user.service';
import { UserData } from 'src/app/models/userData';
import { Subscription } from 'rxjs';
import { LoggerService } from 'src/app/services/logger/logger.service';
import { RecordingService } from '../../services/recording/recording.service';
import { LiveService } from '../../services/live/live.service';
import Plyr from 'plyr';

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
  error: string;
  isCreator: boolean = false;
  isLive: boolean = false;
  userId: string;
  broadcastInterval: any;
  userDataSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private webTorrentService: WebTorrentService,
    private syncService: SyncService,
    private userService: UserService,
    private logger: LoggerService,
    private recordingService: RecordingService,
    private liveService: LiveService,
  ) {

  }

  ngOnInit() {
    this.channelId = this.route.snapshot.paramMap.get("channelId");
    this.userId = this.userService.getUserId();
    this.isCreator = this.userService.isUserCreator();

    // Start webtorrent client
    this.webTorrentService.startClient();

    // The creator creates the torrent
    // The others will wait on messages to get their version of the torrent 
    if (this.isCreator) {

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
  }

  ngOnDestroy(): void {
    this.stopBroadcasting();
    this.userDataSubscription.unsubscribe();
    this.webTorrentService.destroyClient();
    window.onbeforeunload = null;
  }

  ngAfterViewInit() {

    // Add the media source as source of the video elem
    this.videoElem.nativeElement.src = URL.createObjectURL(this.liveService.mediaSource);

    // If the user is the creator, start recording + show what's being recorded to the video elem
    if (this.isCreator) {
      this.liveService.startLive();
    }

    // Determine controls depending on if the user is the creator or not
    let opts = {}
    opts = {
      controls: ['mute', 'volume', 'fullscreen'],
      clickToPlay: false,
      keyboard: { focused: false, global: false },
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
    });
    this.syncService.broadcastUserData(dataToBroadcast);
  }

  onUserData(data: UserData) {
    this.logger.log(JSON.stringify(data));

    // The creator doesn't synchronize with anyone, and nobody synchronizes with people other than the creator
    if (this.isCreator || !data.isCreator) return;
  }

  // Utility function to check if the video is playing or not
  isVideoPlaying() {
    let video = this.videoElem.nativeElement;
    return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
  }
}
