import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import VTTConverter from 'srt-webvtt';

@Component({
  selector: 'app-select-files-modal',
  templateUrl: './select-files-modal.component.html',
  styleUrls: ['./select-files-modal.component.scss']
})
export class SelectFilesModalComponent implements OnInit {

  videoFile: File;
  subtitlesFile: File;
  error: string;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
  }

  validate() {
    if (this.subtitlesFile) {
      if (this.subtitlesFile.type == 'application/x-subrip') {
        const vttConverter = new VTTConverter(this.subtitlesFile); // the constructor accepts a parameer of SRT subtitle blob/file object
        let self = this;
        vttConverter.getURL()
          .then(function (url) { // Its a valid url that can be used further
            fetch(url).then(res => {
              return res.blob()
            }).then(blob => {
              let vttFile = new File([blob], self.subtitlesFile.name + '.vtt', { type: 'text/vtt' });
              self.activeModal.close([self.videoFile, vttFile]);
            });
          });
      } else {
        this.activeModal.close([this.videoFile, this.subtitlesFile]);
      }
    }
    else {
      this.activeModal.close([this.videoFile]);
    }
  }

  handleVideoFileInput(files: FileList) {
    let file = files.item(0);
    if (file.type != 'video/mp4') {
      this.error = 'Only mp4 files are supported (for now)';
    } else {
      this.videoFile = file;
      this.error = null;
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
