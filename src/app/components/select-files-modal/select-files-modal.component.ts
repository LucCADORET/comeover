import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranscodingService } from 'src/app/services/transcoding/transcoding.service';
import { VideoStream } from 'src/app/models/videoStream';
import { AudioStream } from 'src/app/models/audioStream';
import { SubtitleStream } from 'src/app/models/subtitleStream';
import { FormGroup, FormBuilder } from '@angular/forms';
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
  supportedMessage: string;
  unsupportedMessage: string;
  analysisLoading: boolean = false;
  validateLoading: boolean = false;
  showAdvancedOptions: boolean = false;
  ffmpegWorker: Worker;
  videoStreams: Array<VideoStream> = [];
  audioStreams: Array<AudioStream> = [];
  subtitleStreams: Array<SubtitleStream> = [];

  optionsForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private transcodingService: TranscodingService,
    private formBuilder: FormBuilder
  ) {
    this.optionsForm = this.formBuilder.group({
      videoStreamControl: [null],
      audioStreamControl: [null],
      subtitleStreamControl: [null],
      subtitleFileControl: [null],
    });
  }

  ngOnInit() { }

  validate() {

    let videoStream = this.optionsForm.get('videoStreamControl').value;
    let audioStream = this.optionsForm.get('audioStreamControl').value;
    let subtitleStream = this.optionsForm.get('subtitleStreamControl').value;
    let subtitleFile = this.optionsForm.get('subtitleFileControl').value;

    // Verify that at least a video and an audio stream is selected
    if (!videoStream || !audioStream) {
      this.error = "At least one video and one audio stream must be selected";
      return;
    }
    this.validateLoading = true;

    // Get subtitle file either from a given file, either from the video file (if needed)
    let getSubbtitlePromise = new Promise((resolve, reject) => {
      resolve();
    });
    if (subtitleFile) {
      getSubbtitlePromise = this.transcodingService.convertSubtitlesIfNeeded(subtitleFile);
      this.transcodingService.convertSubtitlesIfNeeded(subtitleFile);
    } else if (subtitleStream) {
      getSubbtitlePromise = this.transcodingService.extractSubtitleFile(this.videoFile, subtitleStream);
      this.transcodingService.extractSubtitleFile(this.videoFile, subtitleStream);
    }

    getSubbtitlePromise.then((file: File) => {
      this.subtitlesFile = file;

      // Convert video files depending on the selected streams selected
      // Todo eventually: check if the stream combination is compatible
      this.transcodingService.convertVideoFile(this.videoFile, videoStream, audioStream).then((file: File) => {
        this.videoFile = file;
        if (this.subtitlesFile) {
          this.activeModal.close([this.videoFile, this.subtitlesFile]);
        } else {
          this.activeModal.close([this.videoFile]);
        }
      }).catch((err) => {
        this.error = err;
        this.validateLoading = false;
      });
    }).catch((err) => {
      this.error = err;
      this.validateLoading = false;
    });


  }

  clearOptionsForms() {
    this.optionsForm.setValue({
      videoStreamControl: null,
      audioStreamControl: null,
      subtitleStreamControl: null,
      subtitleFileControl: null,
    });
  }

  setOptionsFormDefaultValues() {

    // Set the default values to the options form
    this.optionsForm.setValue({
      videoStreamControl: this.videoStreams[0],
      audioStreamControl: this.audioStreams[0],
      subtitleStreamControl: this.subtitleStreams && this.subtitleStreams.length ? this.subtitleStreams[0] : null,
      subtitleFileControl: null,
    });
  }

  handleVideoFileInput(files: FileList) {
    let file = files.item(0);

    this.analysisLoading = true;
    this.unsupportedMessage = null;
    this.supportedMessage = null
    this.audioStreams = [];
    this.videoStreams = []

    this.transcodingService.loadAnalyzeFile(file).then(() => {
      let isSupported = this.transcodingService.isFileSupported();
      if (isSupported) {
        this.videoFile = file;
        this.supportedMessage = 'This file is compatible for streaming.';
        this.videoStreams = this.transcodingService.videoStreams;
        this.audioStreams = this.transcodingService.audioStreams;
        this.subtitleStreams = this.transcodingService.subtitleStreams;
        this.setOptionsFormDefaultValues();
      } else {
        this.unsupportedMessage = 'The video codecs of that file are not supported. Supported codecs for video are h264, VP8 and VP9, supported codecs for audio are AAC, Vorbis and Opus. Come Over will support transcoding in the future ! But for now, you\'ll have to try with another file.';
        this.clearOptionsForms();
      }
    }).catch((err) => {
      this.unsupportedMessage = 'There was an error processing the file. This sometimes happens when the file is too big. If the issue remains, please contact support.';
      this.clearOptionsForms();
    }).finally(() => {
      this.analysisLoading = false;
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
