import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranscodingService } from 'src/app/services/transcoding/transcoding.service';
import { VideoStream } from 'src/app/models/videoStream';
import { AudioStream } from 'src/app/models/audioStream';
import { VideoStreamOption } from 'src/app/models/videoStreamOption';
import { AudioStreamOption } from 'src/app/models/audioStreamOption';

@Component({
  selector: 'app-select-files-modal',
  templateUrl: './select-files-modal.component.html',
  styleUrls: ['./select-files-modal.component.scss']
})
export class SelectFilesModalComponent implements OnInit {

  videoFile: File;
  subtitlesFile: File;
  error: string;
  supportedMessage: string;
  unsupportedMessage: string;
  analysisLoading: boolean = false;
  validateLoading: boolean = false;
  showAdvancedOptions: boolean = false;
  ffmpegWorker: Worker;
  videoStreamOptions: Array<VideoStreamOption> = [];
  audioStreamOptions: Array<AudioStreamOption> = [];

  constructor(public activeModal: NgbActiveModal, private transcodingService: TranscodingService) { }

  ngOnInit() { }

  validate() {
    this.validateLoading = true;
    this.transcodingService.convertVideoFileIfNeeded(this.videoFile).then((file: File) => {
      this.videoFile = file;
      if (this.subtitlesFile) {
        this.transcodingService.convertSubtitlesIfNeeded(this.subtitlesFile).then((file: File) => {
          this.subtitlesFile = file;
          this.activeModal.close([this.videoFile, this.subtitlesFile]);
        }).catch((err) => {
          this.error = err;
          this.validateLoading = false;
        });
      }
      else {
        this.activeModal.close([this.videoFile]);
      }
    }).catch((err) => {
      this.error = err;
      this.validateLoading = false;
    });
  }

  handleVideoFileInput(files: FileList) {
    let file = files.item(0);
    this.transcodingService.loadAnalyzeFile(file).then(() => {
      let isSupported = this.transcodingService.isFileSupported();
      if (isSupported) {
        this.videoFile = file;
        this.unsupportedMessage = null;
        this.supportedMessage = 'This file is compatible for streaming.';
        this.videoStreamOptions = this.transcodingService.videoStreams.map(vs => new VideoStreamOption(vs));
        this.audioStreamOptions = this.transcodingService.audioStreams.map(as => new AudioStreamOption(as));
      } else {
        this.unsupportedMessage = 'The video codecs of that file are not supported. Supported codecs for video are h264, VP8 and VP9, supported codecs for audio are AAC, Vorbis and Opus. Come Over will support transcoding in the future ! But for now, you\'ll have to try with another file.';
        this.supportedMessage = null
        this.audioStreamOptions = [];
        this.videoStreamOptions = []
      }
    }).catch((err) => {
      this.unsupportedMessage = 'There was an error processing the file. This sometimes happens when the file is too big. If the issue remains, please contact support.';
      this.supportedMessage = null
      this.audioStreamOptions = [];
      this.videoStreamOptions = []
    });
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
