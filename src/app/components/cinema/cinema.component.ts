import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebTorrentService } from 'src/app/services/web-torrent.service';
import { SyncService } from 'src/app/services/sync.service';

@Component({
  selector: 'app-cinema',
  templateUrl: './cinema.component.html',
  styleUrls: ['./cinema.component.scss']
})
export class CinemaComponent implements OnInit {

  channelId: String;
  magnet: String = "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent";
  progress: String;
  info: String;
  error: String;
  isCreator: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private webTorrentService: WebTorrentService,
    private syncService: SyncService,
  ) { }

  async ngOnInit() {
    console.log();
    this.channelId = this.route.snapshot.paramMap.get("channelId");
    this.route.queryParams.subscribe(params => {
      this.isCreator = params['is_creator'];

      // The creator creates the torrent
      if(this.isCreator) {
        this.addTorrent();
      } 
      
      // The others will wait on messages to get their version of the torrent 
      else {

      }
      this.syncService.init(this.channelId);
      this.startBroadcasting();
    });
  }

  // Broadcast the current time of the stream
  startBroadcasting() {
    var interval = setInterval(() => {
      this.syncService.broadcastToChannel({testData: "sodfjspoj", isCreator: this.isCreator});
    }, 1000);
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


    // Render all files into to the page
    torrent.files.forEach(function (file) {
      if (self.isVideoFile(file)) file.appendTo('#media');
    })
  }

  isVideoFile(file): boolean {
    return file.name.endsWith('.mp4');
  }
}
