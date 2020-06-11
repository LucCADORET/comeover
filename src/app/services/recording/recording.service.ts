/// <reference types="@types/dom-mediacapture-record" />

import { Injectable } from '@angular/core';
import { Chunk } from '../../models/chunk';
import { environment } from '../../../environments/environment';
import { LiveService } from '../live/live.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecordingService {

  private recorder: MediaRecorder;
  private chunkId = 0;
  private _chunkSubject: Subject<Chunk>;

  constructor() { }

  get chunkSubject() {
    return this._chunkSubject;
  }

  // Starts recording, and returns the MIME type of the recording
  startRecording(ms: MediaStream): string {
    let options = { };
    this.recorder = new MediaRecorder(ms, options);
    this.recorder.ondataavailable = this.handleDataAvailable.bind(this);
    this.startChunkRecording();
    return this.recorder.mimeType;
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
      let file = this.blobToFile(event.data, `chunk${this.chunkId}`);
      let chunk = new Chunk(this.chunkId, file)
      this.chunkSubject.next(chunk);
      // var url = URL.createObjectURL(event.data);
      // var a = document.createElement("a");
      // document.body.appendChild(a);
      // a.href = url;
      // a.download = `test${this.chunkId}`;
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
