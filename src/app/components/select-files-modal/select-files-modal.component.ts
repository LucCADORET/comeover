import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import VTTConverter from 'srt-webvtt';
import { resolve } from 'url';
import { reject } from 'q';

@Component({
  selector: 'app-select-files-modal',
  templateUrl: './select-files-modal.component.html',
  styleUrls: ['./select-files-modal.component.scss']
})
export class SelectFilesModalComponent implements OnInit {

  videoFile: File;
  subtitlesFile: File;
  error: string;
  mkvWarning: string;
  validateLoading: boolean = false;
  ffmpegWorker: Worker;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
  }

  // If file has mkv format, it will perform a convertion
  convertVideoFileIfNeeded(file: File): Promise<File> {
    return new Promise((resolve, reject) => {

      if (this.videoFile.type == 'video/x-matroska') {
        // Start worker for the convertion
        var worker = new Worker("workers/worker-ffmpeg.js");
        let self = this;
        let mkvName = file.name;
        let mp4Name = mkvName.replace('.mkv', '.mp4');

        worker.onmessage = function (e) {
          var msg = e.data;
          switch (msg.type) {
            case "ready":

              // Add file to MEMFS
              var reader = new FileReader();

              reader.addEventListener("loadend", function () {
                let buffer = reader.result as ArrayBuffer;
                var mkvUint8Array = new Uint8Array(buffer);


                // Encode test video to VP8.
                worker.postMessage({
                  type: "command",
                  file: {
                    data: mkvUint8Array,
                    name: mkvName,
                  }
                });
              });

              reader.readAsArrayBuffer(self.videoFile);
              break;
            case "stdout":
              console.log(msg.data + "\n");
              break;
            case "stderr":
              console.log(msg.data + "\n");
              break;
            case "error":
              console.log(msg.data + "\n");
              break;
            case "done":
              resolve(new File([msg.data as Uint8Array], mp4Name, { type: 'video/mp4' }));
              break;
            case "exit":
              console.log("Process exited with code " + msg.data);
              worker.terminate();
              break;
          }
        };
      } else {
        resolve(file);
      }
    });
  }

  convertSubtitlesIfNeeded(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      if (this.subtitlesFile.type == 'application/x-subrip') {
        const vttConverter = new VTTConverter(this.subtitlesFile); // the constructor accepts a parameer of SRT subtitle blob/file object
        let self = this;
        vttConverter.getURL()
          .then(function (url) { // Its a valid url that can be used further
            fetch(url).then(res => {
              return res.blob()
            }).then(blob => {
              resolve(new File([blob], self.subtitlesFile.name + '.vtt', { type: 'text/vtt' }));
            });
          });
      } else {
        resolve(file);
      }
    });
  }

  validate() {
    this.convertVideoFileIfNeeded(this.videoFile).then((file: File) => {
      this.videoFile = file;
      if (this.subtitlesFile) {
        this.convertSubtitlesIfNeeded(this.subtitlesFile).then((file: File) => {
          this.subtitlesFile = file;
          this.activeModal.close([this.videoFile, this.subtitlesFile]);
        });
      }
      else {
        this.activeModal.close([this.videoFile]);
      }
    });
  }

  handleVideoFileInput(files: FileList) {
    let file = files.item(0);
    if (file.type != 'video/mp4' && file.type != 'video/x-matroska') {
      this.error = 'Only mp4 and mkv files are supported';
      this.mkvWarning = null;
    } else {
      this.videoFile = file;
      this.error = null;
      if (file.type == 'video/x-matroska') {
        this.mkvWarning = ".mkv files are not nativelty supported, it might take a few minutes ton convert";
      } else {
        this.mkvWarning = null;
      }
    }
  }

  handleSubtitlesFileInput(files: FileList) {
    let file = files.item(0);
    if (file.type != 'application/x-subrip' && file.type != 'text/vtt') {
      this.error = 'Subtitles file must be .srt or .vtt files';
    } else {
      this.subtitlesFile = file;
      this.error = null;
    }
  }
}
