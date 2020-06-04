import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebTorrentService } from 'src/app/services/web-torrent/web-torrent.service';
import { SyncService } from 'src/app/services/sync/sync.service';
import { UserService } from 'src/app/services/user/user.service';
import { UserData } from 'src/app/models/userData';
import { Subscription } from 'rxjs';
import { LoggerService } from 'src/app/services/logger/logger.service';
import { RecordingService } from '../../services/recording/recording.service';
import * as Hls from 'hls.js'
import { Chunk } from '../../models/chunk';
import { LiveService } from '../../services/live/live.service';

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

  // Buffers for the live streaming
  chunksBuffer: Record<number, Chunk>;
  playingChunk: Chunk;

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
    this.chunksBuffer = {};

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

    // If the user is the creator, start recording + show what's being recorded to the video elem
    if (this.isCreator) {
      let displayMediaOptions = {
        video: {
          cursor: "always"
        },
        audio: true
      };
      const mediaDevices = navigator.mediaDevices as any; // Workaround for typescript warning

      // Capture the user media
      mediaDevices.getDisplayMedia(displayMediaOptions).then((ms: MediaStream) => {
        this.videoElem.nativeElement.srcObject = ms;

        // When video is loaded, start recording
        this.videoElem.nativeElement.onloadedmetadata = () => {
          this.recordingService.startRecording(ms)

          // Broadcast user data (with the manifest) whenever the manifest changes
          this.liveService.manifestSubject.subscribe((manifest: Array<Chunk>) => {
            this.broadcastUserData();
          });
        };
      });
    }

    // If the use is not the created, we had to set the chunks as video sources as the live goes through
    else {
      this.videoElem.nativeElement.addEventListener('ended', this.onVideoEnded.bind(this))
    }
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
      manifest: this.liveService.manifestSubject.getValue(),
    });
    this.syncService.broadcastUserData(dataToBroadcast);
  }

  onUserData(data: UserData) {
    this.logger.log(JSON.stringify(data));

    // The creator doesn't synchronize with anyone, and nobody synchronizes with people other than the creator
    if (this.isCreator || !data.isCreator) return;

    console.log("Received new manifest of size " + data.manifest.length);

    // Add the received chunks to the buffer if they are not here already
    for (let shortChunk of data.manifest) {
      let existingChunk = this.chunksBuffer[shortChunk.id];

      // if the chunk is not existing, add it right after the last id
      if (existingChunk == null) {
        this.chunksBuffer[shortChunk.id] = shortChunk;
      }
    }

    // Add chunk torrent if no chunk is being downloaded 
    // AND if this is a new chunk (not downloaded, and not downloading)
    if (!this.webTorrentService.isDownloading()) {
      for (let chunkId in this.chunksBuffer) {
        let chunk = this.chunksBuffer[chunkId];
        if (this.webTorrentService.magnetExists(chunk.magnet)) {
          this.addTorrent(chunk.magnet);
          return;
        }
      }
    }
  }

  addTorrent(magnet: string) {
    this.webTorrentService.addTorrent(magnet, this.onTorrent.bind(this));
  }

  onTorrent(torrent) {
    let self = this;
    this.logger.log('Got torrent metadata!');
    let videoFile = torrent.files.find(function (file) {
      return file.name.endsWith('.webm')
    });
    let chunk = this.chunksBuffer[this.getChunkId(videoFile.name)];
    chunk.file = videoFile;

    // On previous torrent download end, add next chunk (id there is any)
    torrent.on('done', function () {
      console.log("Finished downloading chunk " + chunk.id);
      let nextChunk = self.chunksBuffer[(chunk.id + 1)];
      if (nextChunk) {
        console.log("Start downloading new chunk " + nextChunk.id);
        self.addTorrent(nextChunk.magnet);
      } else {
        console.log("No chunk to download in buffer");
      };
    });


    // If no video is playing, just render the file we are currently downloading
    if (!this.isVideoPlaying()) {
      this.playChunk(chunk)
    }
  }

  // When the current video chunk ended, play the next chunk
  onVideoEnded() {
    console.log(`${this.playingChunk.file.name} ended`)
    let nextChunk = this.chunksBuffer[(this.playingChunk.id + 1)];
    console.log(`Loading chunk ${nextChunk.file.name}`)
    this.playChunk(nextChunk);
  }

  getChunkId(name: string): number {
    let match = name.match(/(chunk)(\d+)(\.webm)/);
    return parseFloat(match[2]);
  }

  isVideoPlaying() {
    let video = this.videoElem.nativeElement;
    return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
  }

  // Render a chunk to the video element, and set the currently playing chunk as this chunk
  playChunk(chunk: Chunk) {
    let opts = null;
    if (!this.isCreator) opts = { autoplay: true, muted: true, controls: false };
    else opts = { autoplay: false, muted: false, controls: false };
    chunk.file.renderTo('video#player', opts);
    this.playingChunk = chunk;
  }
}
