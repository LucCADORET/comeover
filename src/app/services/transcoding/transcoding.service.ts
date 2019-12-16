import { Injectable } from '@angular/core';
import VTTConverter from 'srt-webvtt';
import { resolve } from 'url';
import { reject } from 'q';
import { VideoStream } from 'src/app/models/videoStream';
import { AudioStream } from 'src/app/models/audioStream';
import { VideoCodecsEnum } from 'src/app/enums/videoCodecsEnum';
import { AudioCodecsEnum } from 'src/app/enums/audioCodecsEnum';
import { SubtitleStream } from 'src/app/models/subtitleStream';

@Injectable({
  providedIn: 'root'
})
export class TranscodingService {

  // Source: https://www.chromium.org/audio-video
  supportedContainers: Array<string> = [
    'MP4',
    'Ogg',
    'WebM',
    'WAV',
  ]

  private _videoStreams: Array<VideoStream> = [];
  private _audioStreams: Array<AudioStream> = [];
  private _subtitleStreams: Array<SubtitleStream> = [];

  constructor() { }

  get videoStreams(): Array<VideoStream> {
    return this._videoStreams;
  }

  get audioStreams(): Array<AudioStream> {
    return this._audioStreams;
  }

  get subtitleStreams(): Array<SubtitleStream> {
    return this._subtitleStreams;
  }

  // If file has mkv format, it will perform a convertion
  convertVideoFile(file: File, videoStream: VideoStream, audioStream: AudioStream): Promise<File> {
    return new Promise((resolve, reject) => {

      // Start worker for the convertion
      var worker = new Worker("workers/worker-ffmpeg.js");
      let self = this;
      let inputName = file.name;
      let outputExtension = this.getOutputFormat(videoStream, audioStream);
      if (!outputExtension) {
        reject("Could not find any suitable file format from the provided codecs");
      }
      let outputName = [this.getFileWithoutExtension(inputName), outputExtension].join('.');

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
                let inputBuffer = reader.result as ArrayBuffer;

                let commandData = {
                  type: "transcode",
                  file: {
                    data: inputBuffer,
                    name: inputName,
                  },
                  videoStreamIndex: videoStream.index,
                  audioStreamIndex: audioStream.index,
                  outputExtension: outputExtension,
                };
                worker.postMessage(commandData, [commandData.file.data]);
              });

              reader.readAsArrayBuffer(file);
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
              resolve(new File([msg.data], outputName, { type: outputExtension == 'mp4' ? 'video/mp4' : 'video/webm' }));
              break;
            case "exit":
              console.log("Process exited with code " + msg.data);
              worker.terminate();
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
              console.log(msg.data + "\n");
              break;
            case "stderr":
              console.log(msg.data + "\n");
              break;
            case "error":
              console.log(msg.data + "\n");
              break;
            case "done":
              let fileNameWithoutExtension = self.getFileWithoutExtension(fileName);
              let subtitleFile = new File([msg.data], fileNameWithoutExtension + '.vtt', { type: 'text/vtt' });
              resolve(subtitleFile);
              break;
            case "exit":
              console.log("Process exited with code " + msg.data);
              worker.terminate();
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
  loadAnalyzeFile(file: File): Promise<boolean> {
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



              // let regex = /^Stream #[0-9]:[0-9](\([a-z]{3}\))?: (Video|Audio): ([a-z0-9\s]+,)*([a-z0-9\s]+){1}/;
              // let v2 = /^Stream #[0-9]:[0-9](\([a-z]{3}\))?: (Video|Audio): ([a-zA-Z0-9\s\(\)\/]+),/gmi;
              let v3 = /^Stream #[0-9]:([0-9])(\([a-z]{3}\))?: (Video|Audio|Subtitle): (.+)/
              /**
               * Tests:
               * Stream #0:0: Video: h264 (High), yuv420p(progressive), 1916x796 [SAR 1:1 DAR 479:199], q=2-31, 25 fps, 25 tbr, 1k tbn, 1k tbc (default)
               
               Stream #0:0(und): Video: h264 (High), yuv420p(progressive), 1916x796 [SAR 1:1 DAR 479:199], q=2-31, 25 fps, 25 tbr, 1k tbn, 1k tbc (default)
               
               Stream #0:1(eng): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 127 kb/s (default)

               Stream #0:2(eng): Subtitle: subrip
               */
              let line = msg.data.trim();

              // If we get the line 'Output #0' then we know we can stop looking at the data
              if (line.includes('Output #0')) {
                isOutputSection = true;
              }

              if (!isOutputSection) {
                let groups = line.match(v3);
                if (groups) {
                  let trackNumberGroup = null;
                  let languageGroup = null;
                  let trackTypeGroup = null;
                  let codecsGroup = null;

                  // Getting groups depending on how many there was
                  trackNumberGroup = groups[1];
                  languageGroup = groups[2];
                  trackTypeGroup = groups[3];
                  codecsGroup = groups[4];

                  if (trackTypeGroup == 'Video') {
                    self._videoStreams.push(new VideoStream(trackNumberGroup, codecsGroup));
                  } else if (trackTypeGroup == 'Audio') {
                    self._audioStreams.push(new AudioStream(trackNumberGroup, languageGroup, codecsGroup));
                  } else if (trackTypeGroup == 'Subtitle') {
                    self._subtitleStreams.push(new SubtitleStream(trackNumberGroup, languageGroup, codecsGroup));
                  }
                }
                console.log(line);
              }
              break;
            case "error":
              reject(msg.data + "\n");
              break;
            case "done":
              worker.terminate();
              resolve(true);
              break;
            case "exit":
              console.log("Process exited with code " + msg.data);
              worker.terminate();
              break;
          }
        }
      };
    });
  }

  isFileSupported() {
    return this.canBuildMp4(this._videoStreams, this._audioStreams) || this.canBuildWebm(this._videoStreams, this._audioStreams);
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
  getOutputFormat(videoStream: VideoStream, audioStream: AudioStream) {
    if (this.canBuildWebm([videoStream], [audioStream])) {
      return 'webm';
    } else if (this.canBuildMp4([videoStream], [audioStream])) {
      return 'mp4';
    }
    return null;
  }
}
