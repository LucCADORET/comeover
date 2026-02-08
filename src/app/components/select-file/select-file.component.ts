import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TranscodingService } from 'src/app/services/transcoding/transcoding.service';
import { VideoStream } from 'src/app/models/videoStream';
import { AudioStream } from 'src/app/models/audioStream';
import { SubtitleStream } from 'src/app/models/subtitleStream';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { codecValidator } from 'src/app/validators/codec.validator';

@Component({
  selector: 'app-select-file',
  templateUrl: './select-file.component.html',
  styleUrls: ['./select-file.component.scss']
})
export class SelectFileComponent implements OnInit {

  videoFile: File;
  subtitlesFile: File;
  error: string;
  supportedMessage: string;
  unsupportedMessage: string;
  isSubtitlesSupported: boolean = false;
  analysisLoading: boolean = false;
  validateLoading: boolean = false;
  transcodingProgress = 0;
  showAdvancedOptions: boolean = false;
  ffmpegWorker: Worker;
  videoStreams: Array<VideoStream> = [];
  audioStreams: Array<AudioStream> = [];
  subtitleStreams: Array<SubtitleStream> = [];

  optionsForm: UntypedFormGroup;
  @Output() files: EventEmitter<Array<File>>;


  constructor(
    private transcodingService: TranscodingService,
    private formBuilder: UntypedFormBuilder
  ) {
    this.optionsForm = this.formBuilder.group({
      videoStreamControl: [null, codecValidator],
      audioStreamControl: [null, codecValidator],
      subtitleStreamControl: [null],
      subtitleFileControl: [null],
    });
    this.files = new EventEmitter<Array<File>>();
  }

  ngOnInit() { }

  validate() {

    // Get video stream if it's a valid codec
    let videoStream = this.optionsForm.get('videoStreamControl').value;

    // Get audio stream if it's a valid codec
    let audioStream = this.optionsForm.get('audioStreamControl').value;

    let subtitleStream = this.optionsForm.get('subtitleStreamControl').value;
    let subtitleFile = this.optionsForm.get('subtitleFileControl').value;

    // Verify that at least a video and an audio stream is selected
    this.validateLoading = true;
    this.optionsForm.disable();
    this.transcodingProgress = 0;

    // Get subtitle file either from a given file, either from the video file (if needed)
    let getSubbtitlePromise = new Promise((resolve, reject) => {
      resolve();
    });
    if (subtitleFile) {
      getSubbtitlePromise = this.transcodingService.convertSubtitlesIfNeeded(subtitleFile);
    } else if (subtitleStream) {
      getSubbtitlePromise = this.transcodingService.extractSubtitleFile(this.videoFile, subtitleStream);
    }

    getSubbtitlePromise.then((file: File) => {
      this.subtitlesFile = file;

      let progressSubscription = this.transcodingService.transcodeProgress.subscribe(progress => {
        this.transcodingProgress = progress;
      });

      // Convert video files depending on the selected streams selected
      // Todo eventually: check if the stream combination is compatible
      this.transcodingService.buildCompatibleFile(this.videoFile, videoStream, audioStream).then((file: File) => {
        progressSubscription.unsubscribe();
        this.videoFile = file;
        if (this.subtitlesFile) {
          this.files.emit([this.videoFile, this.subtitlesFile]);
        } else {
          this.files.emit([this.videoFile]);
        }
      }).catch((err) => {
        progressSubscription.unsubscribe();
        this.error = err;
        this.validateLoading = false;
        this.optionsForm.enable();
      });
    }).catch((err) => {
      this.error = err;
      this.validateLoading = false;
      this.optionsForm.enable();
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

    if (!file.type.includes('video')) {
      this.error = 'Only video files are supported.';
      return;
    }

    this.analysisLoading = true;
    this.optionsForm.disable();
    this.unsupportedMessage = null;
    this.supportedMessage = null
    this.isSubtitlesSupported = false;
    this.error = null;
    this.audioStreams = [];
    this.videoStreams = [];
    this.subtitleStreams = [];

    this.transcodingService.loadFile(file).then(() => {
      let isSupported = this.transcodingService.isFileSupported();
      if (isSupported) {
        this.supportedMessage = 'This file is compatible for streaming.';
      } else {
        this.unsupportedMessage = 'This file is not natively supported and will need to be transcoded (this can take a few minutes).';
      }
      this.videoFile = file;
      this.videoStreams = this.transcodingService.videoStreams;
      this.audioStreams = this.transcodingService.audioStreams;
      this.subtitleStreams = this.transcodingService.subtitleStreams;
      this.isSubtitlesSupported = this.transcodingService.isSubtitlesSupported();
      this.setOptionsFormDefaultValues();
    }).catch((err) => {
      this.error = 'There was an error processing the file. This sometimes happens when the file is too big. If the issue remains, please contact support.';
      this.clearOptionsForms();
    }).finally(() => {
      this.optionsForm.enable();
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
