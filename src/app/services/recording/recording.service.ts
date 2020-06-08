/// <reference types="@types/dom-mediacapture-record" />

import { Injectable } from '@angular/core';
import { TranscodingService } from '../transcoding/transcoding.service';
import { WebTorrentService } from '../web-torrent/web-torrent.service';
import { Chunk } from '../../models/chunk';
import { environment } from '../../../environments/environment';
import { LiveService } from '../live/live.service';

@Injectable({
  providedIn: 'root'
})
export class RecordingService {

  private source: MediaStream;
  private recorder: MediaRecorder;
  private chunkId = 0;

  constructor(
    private liveService: LiveService,
  ) { }

  startRecording(source: MediaStream) {
    this.source = source;

    let options = { mimeType: "video/webm; codecs=vp9" };
    this.recorder = new MediaRecorder(this.source, options);
    this.recorder.ondataavailable = this.handleDataAvailable.bind(this);
    this.startChunkRecording();
  }

  startChunkRecording() {
    this.recorder.start();
    setTimeout(() => {
      this.recorder.stop();
      this.startChunkRecording();
    }, environment.targetDuration * 1000);
  }

  /**
   * When data is available from the recorder, we give it to the live service that will
   * Add it to the chunk buffer + torrent seed it
   * @param event event on data available containing the blob
   */
  handleDataAvailable(event: any) {
    console.log("data-available");
    if (event.data.size > 0) {
      this.chunkId++;
      let file = this.blobToFile(event.data, `chunk${this.chunkId}.webm`);
      let chunk = new Chunk(this.chunkId, file)
      this.liveService.seedChunk(chunk);
      // var url = URL.createObjectURL(blob);
      // var a = document.createElement("a");
      // document.body.appendChild(a);
      // a.href = url;
      // a.download = `test${this.chunkId}.webm`;
      // a.click();
      // window.URL.revokeObjectURL(url);
    }
  }

  public blobToFile = (theBlob: Blob, fileName: string): File => {
    var b: any = theBlob;
    b.lastModifiedDate = new Date();
    b.name = fileName;
    return <File>theBlob;
  }
}
