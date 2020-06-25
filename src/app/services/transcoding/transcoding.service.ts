import { Injectable } from '@angular/core';
import VTTConverter from 'srt-webvtt';
import { VideoStream } from 'src/app/models/videoStream';
import { AudioStream } from 'src/app/models/audioStream';
import { VideoCodecsEnum } from 'src/app/enums/videoCodecsEnum';
import { AudioCodecsEnum } from 'src/app/enums/audioCodecsEnum';
import { SubtitleStream } from 'src/app/models/subtitleStream';
import { isCodecSupported } from 'src/app/utils/utils';
import { Observable, Subject } from 'rxjs';
import * as moment from 'moment';
import { LoggerService } from '../logger/logger.service';
import { SubtitleTypesEnum } from 'src/app/enums/subtitleTypesEnum';

@Injectable({
  providedIn: 'root'
})
export class TranscodingService {


  // Codecs info: https://www.chromium.org/audio-video
  private _videoStreams: Array<VideoStream> = [];
  private _audioStreams: Array<AudioStream> = [];
  private _subtitleStreams: Array<SubtitleStream> = [];
  private _transcodeProgress: Subject<number> = new Subject<number>();


  constructor(
    private logger: LoggerService
  ) { }

  get videoStreams(): Array<VideoStream> {
    return this._videoStreams;
  }

  get audioStreams(): Array<AudioStream> {
    return this._audioStreams;
  }

  get subtitleStreams(): Array<SubtitleStream> {
    return this._subtitleStreams;
  }

  get transcodeProgress(): Observable<number> {
    return this._transcodeProgress.asObservable();
  }

  /**
   * 
   * @param file The file to transcode to a format that is readable for the webtorrent seeking player
   * @param videoStream The target video stream of the file (to transcode or adapt)
   * @param audioStream The target audio stream of the file (to transcode or adapt)
   */
  buildCompatibleFile(file: File, videoStream: VideoStream, audioStream: AudioStream): Promise<File> {

    // Reset progress
    this._transcodeProgress.next(0);

    return new Promise((resolve, reject) => {

      // If no stream is provided for either the video or the audio, find which codec to use (if codec = null, we keep the codec)
      let videoCodec = null;
      let audioCodec = null;
      if (!isCodecSupported(videoStream.codec)) {
        if (audioStream && (audioStream.codec == AudioCodecsEnum.OPUS || audioStream.codec == AudioCodecsEnum.VORBIS)) {
          videoCodec = VideoCodecsEnum.VP8;
        } else if (audioStream && (audioStream.codec == AudioCodecsEnum.AAC)) {
          videoCodec = VideoCodecsEnum.H264;
        } else {
          videoCodec = VideoCodecsEnum.VP8;
          audioCodec = AudioCodecsEnum.OPUS;
        }
      } else if (!isCodecSupported(audioStream.codec)) {
        if (videoStream && (videoStream.codec == VideoCodecsEnum.VP8 || videoStream.codec == VideoCodecsEnum.VP9)) {
          audioCodec = AudioCodecsEnum.OPUS;
        } else if (videoStream && (videoStream.codec == VideoCodecsEnum.H264)) {
          audioCodec = AudioCodecsEnum.AAC;
        } else {
          videoCodec = VideoCodecsEnum.VP8;
          audioCodec = AudioCodecsEnum.OPUS;
        }
      }

      // Start worker for the convertion
      var worker = new Worker("workers/worker-ffmpeg.js");
      let self = this;
      let inputName = file.name;
      let outputExtension = this.getOutputExtension(videoCodec || videoStream.codec, audioCodec || audioStream.codec);
      if (!outputExtension) {
        reject("Could not find any suitable file format from the provided codecs");
      }
      let outputName = [this.getFileWithoutExtension(inputName), outputExtension].join('.');
      let isOutputSection = false;
      let inputDuration = null;

      worker.onmessage = function (e) {
        var msg = e.data;
        if (msg) {
          switch (msg.type) {
            case "ready":

              var reader = new FileReader();

              reader.addEventListener("error", function (error) {
                reject("Error converting the file: it might be too big");
              });

              reader.addEventListener("abort", function (error) {
                reject("Error converting the file: it might be too big");
              });

              reader.addEventListener("loadend", function (data) {
                let inputBuffer = reader.result as ArrayBuffer;

                let commandData = {
                  type: "transcode",
                  file: {
                    data: inputBuffer,
                    name: inputName,
                  },
                  videoStreamIndex: videoStream ? videoStream.index : null,
                  videoCodec: videoCodec,
                  audioStreamIndex: audioStream ? audioStream.index : null,
                  audioCodec: audioCodec,
                  outputExtension: outputExtension,
                };
                worker.postMessage(commandData, [commandData.file.data]);
              });

              reader.readAsArrayBuffer(file);
              break;
            case "stdout":
              self.logger.log(msg.data + "\n")
              break;
            case "stderr":

              let line = msg.data.trim();

              // If we get the line 'Output #0' then we know we can stop looking at the data
              if (line.includes('Output #0')) {
                isOutputSection = true;
              }

              if (!isOutputSection) {
                // Parse input duration
                // Example duration:   Duration: 00:32:03.93, start: 0.000000, bitrate: 1651 kb/s
                let regexInputDuration = /^Duration: (.*), start: .*/
                let groups = line.match(regexInputDuration);
                if (groups) {

                  // Getting groups depending on how many there was
                  let durationGroup = groups[1];
                  if (durationGroup != null) {
                    inputDuration = moment.duration(durationGroup);
                  }
                }
              }

              // Parse progress duration
              // Example: frame=  168 fps=0.0 q=-1.0 size=    1024kB time=00:00:07.16 bitrate=1170.2kbits/s speed=14.3x
              if (line.startsWith('frame=')) {
                let regexProgressDuration = /^frame=(.*) fps=(.*) q=(.*) size=(.*) time=(.*) bitrate=(.*) speed=(.*)/
                let groups = line.match(regexProgressDuration);
                if (groups) {
                  groups = groups.map(group => group.trim());

                  // Getting groups depending on how many there was
                  let timeGroup = groups[5];
                  if (timeGroup != null) {
                    let progressDuration = moment.duration(timeGroup);
                    let progress = Math.floor(100 - (((inputDuration.asMilliseconds() - progressDuration.asMilliseconds()) * 100) / inputDuration.asMilliseconds()))
                    self._transcodeProgress.next(progress);
                  }
                }
              }
              self.logger.log(line);
              break;
            case "error":
              self.logger.log("Process errored with code " + msg.data);
              worker.terminate();
              reject(msg.data + "\n");
              break;
            case "done":
              self._transcodeProgress.next(100);
              worker.terminate();
              resolve(new File([msg.data], outputName, { type: outputExtension == 'mp4' ? 'video/mp4' : 'video/webm' }));
              break;
            case "exit":
              self.logger.log("Process exited with code " + msg.data);
              worker.terminate();
              reject(msg.data + "\n");
              break;
          }
        }
      };
    });
  }

  convertSubtitlesIfNeeded(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      if (file.type == 'application/x-subrip') {
        const vttConverter = new VTTConverter(file); // the constructor accepts a parameer of SRT subtitle blob/file object
        let self = this;
        vttConverter.getURL()
          .then(function (url) { // Its a valid url that can be used further
            fetch(url).then(res => {
              return res.blob()
            }).then(blob => {
              resolve(new File([blob], file.name + '.vtt', { type: 'text/vtt' }));
            });
          });
      } else {
        resolve(file);
      }
    });
  }

  extractSubtitleFile(file: File, subtitleStream: SubtitleStream): Promise<File> {
    return new Promise((resolve, reject) => {

      let self = this;

      // Start worker for the convertion
      var worker = new Worker("workers/worker-ffmpeg.js");
      let fileName = file.name;

      worker.onmessage = function (e) {
        var msg = e.data;
        if (msg) {
          switch (msg.type) {
            case "ready":

              // Add file to MEMFS
              var reader = new FileReader();

              reader.addEventListener("error", function (error) {
                reject("Error converting the file: it might be too big");
              });

              reader.addEventListener("abort", function (error) {
                reject("Error converting the file: it might be too big");
              });

              reader.addEventListener("loadend", function (data) {
                let mkvBuffer = reader.result as ArrayBuffer;
                let commandData = {
                  type: "subtitles",
                  file: {
                    data: mkvBuffer,
                    name: fileName,
                  },
                  index: subtitleStream.index
                };
                worker.postMessage(commandData, [commandData.file.data]);
              });
              reader.readAsArrayBuffer(file);
              break;
            case "stdout":
              self.logger.log(msg.data + "\n");
              break;
            case "stderr":
              self.logger.log(msg.data + "\n");
              break;
            case "error":
              self.logger.log("Process errored with code " + msg.data);
              worker.terminate();
              reject(msg.data + "\n");
              break;
            case "done":
              let fileNameWithoutExtension = self.getFileWithoutExtension(fileName);
              let subtitleFile = new File([msg.data], fileNameWithoutExtension + '.vtt', { type: 'text/vtt' });
              worker.terminate();
              resolve(subtitleFile);
              break;
            case "exit":
              self.logger.log("Process exited with code " + msg.data);
              worker.terminate();
              reject(msg.data + "\n");
              break;
          }
        }
      };
    });
  }

  getFileWithoutExtension(filename: string): string {
    return filename.split('.').slice(0, -1).join('.');
  };

  // Uses ffmpeg to check if the video codecs of the file are supported
  loadFile(file: File): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      var worker = new Worker("workers/worker-ffmpeg.js");
      let self = this;
      let filename = file.name;
      this._videoStreams = [];
      this._audioStreams = [];
      this._subtitleStreams = [];
      let isOutputSection = false;
      worker.onmessage = function (e) {
        var msg = e.data;
        if (msg) {
          switch (msg.type) {
            case "ready":

              // Add file to MEMFS
              var reader = new FileReader();

              reader.addEventListener("error", function (error) {
                reject("Error converting the file: it might be too big");
              });

              reader.addEventListener("abort", function (error) {
                reject("Error converting the file: it might be too big");
              });

              reader.addEventListener("loadend", function (data) {
                let filedata = reader.result as ArrayBuffer;

                let commandData = {
                  type: "codecs",
                  file: {
                    data: filedata,
                    name: filename,
                  }
                };
                worker.postMessage(commandData, [commandData.file.data]);
              });

              reader.readAsArrayBuffer(file);
              break;
            case "stdout":
              // nothing to do
              break;
            case "stderr":

              // Parse video/audio/subtitle tracks
              // examples: Stream #0:0: Video: h264 (High), yuv420p(progressive), 1916x796 [SAR 1:1 DAR 479:199], q=2-31, 25 fps, 25 tbr, 1k tbn, 1k tbc (default)
              // Stream #0:0(und): Video: h264 (High), yuv420p(progressive), 1916x796 [SAR 1:1 DAR 479:199], q=2-31, 25 fps, 25 tbr, 1k tbn, 1k tbc (default)
              // Stream #0:2(eng): Subtitle: subrip
              let streamRegex = /^Stream #[0-9]:([0-9])(\([a-z]{3}\))?: (Video|Audio|Subtitle): (.+)/

              let line = msg.data.trim();

              // If we get the line 'Output #0' then we know we can stop looking at the data
              if (line.includes('Output #0')) {
                isOutputSection = true;
              }

              if (!isOutputSection) {
                let groups = line.match(streamRegex);
                if (groups) {

                  // Getting groups depending on how many there was
                  let trackNumberGroup = groups[1];
                  let languageGroup = groups[2];
                  let trackTypeGroup = groups[3];
                  let codecsGroup = groups[4];

                  if (trackTypeGroup == 'Video') {
                    self._videoStreams.push(new VideoStream(trackNumberGroup, codecsGroup));
                  } else if (trackTypeGroup == 'Audio') {
                    self._audioStreams.push(new AudioStream(trackNumberGroup, languageGroup, codecsGroup));
                  } else if (trackTypeGroup == 'Subtitle') {
                    self._subtitleStreams.push(new SubtitleStream(trackNumberGroup, languageGroup, codecsGroup));
                  }
                }
                self.logger.log(line);
              }
              break;
            case "error":
              self.logger.log("Process errored with code " + msg.data);
              worker.terminate();
              reject(msg.data + "\n");
              break;
            case "done":
              worker.terminate();
              resolve(true);
              break;
            case "exit":
              self.logger.log("Process exited with code " + msg.data);
              worker.terminate();
              reject(msg.data + "\n");
              break;
          }
        }
      };
    });
  }

  isFileSupported(): boolean {
    return this.canBuildMp4(this._videoStreams, this._audioStreams) || this.canBuildWebm(this._videoStreams, this._audioStreams);
  }

  isSubtitlesSupported(): boolean {
    return this.subtitleStreams.some((ss) => ss.type != SubtitleTypesEnum.DVD_SUBTITLE);
  }

  // Check if the streams have h264 & AAC streams
  canBuildMp4(videoStreams: Array<VideoStream>, audioStreams: Array<AudioStream>): boolean {
    let H264Stream = videoStreams.find(vs => vs.codec == VideoCodecsEnum.H264);
    if (!H264Stream) return false;

    let AACStream = audioStreams.find(vs => vs.codec == AudioCodecsEnum.AAC);
    if (!AACStream) return false;

    return true;
  }

  // Check if the streams have vp8/vp9 & opus/vorbis streams
  canBuildWebm(videoStreams: Array<VideoStream>, audioStreams: Array<AudioStream>): boolean {
    let VP8Stream = videoStreams.find(vs => vs.codec == VideoCodecsEnum.VP8);
    let VP9Stream = videoStreams.find(vs => vs.codec == VideoCodecsEnum.VP9);
    if (!VP9Stream && !VP8Stream) return false;

    let OpusStream = audioStreams.find(vs => vs.codec == AudioCodecsEnum.OPUS);
    let VorbisStream = audioStreams.find(vs => vs.codec == AudioCodecsEnum.VORBIS);
    if (!OpusStream && !VorbisStream) return false;

    return true;
  }

  // Returns the output format that sould be built depending on the codecs
  getOutputExtension(videoCodec: VideoCodecsEnum, audioCodec: AudioCodecsEnum) {
    if (videoCodec == VideoCodecsEnum.H264 && audioCodec == AudioCodecsEnum.AAC) {
      return 'mp4';
    } else if (
      (videoCodec == VideoCodecsEnum.VP8 || videoCodec == VideoCodecsEnum.VP9)
      && (audioCodec == AudioCodecsEnum.VORBIS || audioCodec == AudioCodecsEnum.OPUS)
    ) {
      return 'webm';
    }
    return null;
  }
}
