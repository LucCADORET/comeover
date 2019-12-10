import { Injectable } from '@angular/core';
import VTTConverter from 'srt-webvtt';
import { resolve } from 'url';
import { reject } from 'q';
import { VideoStream } from 'src/app/models/videoStream';
import { AudioStream } from 'src/app/models/audioStream';
import { VideoCodecsEnum } from 'src/app/enums/videoCodecsEnum';
import { AudioCodecsEnum } from 'src/app/enums/audioCodecsEnum';

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

  supportedVideoCodecs: Array<string> = [
    'VP8',
    'VP9',
    'H.264',
    'Theora',
  ]

  supportedAudioCodecs: Array<string> = [
    'FLAC',
    'MP3',
    'Opus',
    'Vorbis',
    'AAC',
  ]

  constructor() { }

  // If file has mkv format, it will perform a convertion
  convertVideoFileIfNeeded(file: File): Promise<File> {
    return new Promise((resolve, reject) => {

      if (file.type == 'video/x-matroska') {
        // Start worker for the convertion
        var worker = new Worker("workers/worker-ffmpeg.js");
        let self = this;
        let mkvName = file.name;
        let mp4Name = mkvName.replace('.mkv', '.mp4');

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
                    type: "transcode",
                    file: {
                      data: mkvBuffer,
                      name: mkvName,
                    }
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
                resolve(new File([msg.data], mp4Name, { type: 'video/mp4' }));
                break;
              case "exit":
                console.log("Process exited with code " + msg.data);
                worker.terminate();
                break;
            }
          }
        };
      } else {
        resolve(file);
      }
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

  // Uses ffmpeg to check if the video codecs of the file are supported
  isFileSupported(file: File): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      var worker = new Worker("workers/worker-ffmpeg.js");
      let self = this;
      let filename = file.name;
      let i = 0;
      let videoStreams: Array<VideoStream> = [];
      let audioStreams: Array<AudioStream> = [];
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
              let regex = /^Stream #[0-9]:[0-9](\([a-z]{3}\))?: (Video|Audio): ([a-z0-9\s]+,)*([a-z0-9\s]+){1}/;
              let v2 = /^Stream #[0-9]:[0-9](\([a-z]{3}\))?: (Video|Audio): ([a-zA-Z0-9\s\(\)\/]+),/gmi;
              let v3 = /^Stream #[0-9]:([0-9])(\([a-z]{3}\))?: (Video|Audio): (.+)/
              /**
               * Tests:
               * Stream #0:0: Video: h264 (High), yuv420p(progressive), 1916x796 [SAR 1:1 DAR 479:199], q=2-31, 25 fps, 25 tbr, 1k tbn, 1k tbc (default)
 
                Stream #0:0(und): Video: h264 (High), yuv420p(progressive), 1916x796 [SAR 1:1 DAR 479:199], q=2-31, 25 fps, 25 tbr, 1k tbn, 1k tbc (default)
 
                Stream #0:1(eng): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 127 kb/s (default)
               */
              let line = msg.data.trim();
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
                  videoStreams.push(new VideoStream(trackNumberGroup, codecsGroup));
                } else if (trackTypeGroup == 'Audio') {
                  audioStreams.push(new AudioStream(trackNumberGroup, languageGroup, codecsGroup));
                }
              }
              console.log(line);
              break;
            case "error":
              console.error(msg.data + "\n");
              break;
            case "done":
              resolve(self.canBuildMp4(videoStreams, audioStreams) || self.canBuildWebm(videoStreams, audioStreams));
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

  canBuildMp4(videoStreams: Array<VideoStream>, audioStreams: Array<AudioStream>): boolean {
    let H264Stream = videoStreams.find(vs => vs.codec == VideoCodecsEnum.H264);
    if (!H264Stream) return false;

    let AACStream = audioStreams.find(vs => vs.codec == AudioCodecsEnum.AAC);
    if (!AACStream) return false;

    return true;
  }

  canBuildWebm(videoStreams: Array<VideoStream>, audioStreams: Array<AudioStream>): boolean {
    let VP8Stream = videoStreams.find(vs => vs.codec == VideoCodecsEnum.VP8);
    let VP9Stream = videoStreams.find(vs => vs.codec == VideoCodecsEnum.VP9);
    if (!VP9Stream && !VP8Stream) return false;

    let OpusStream = audioStreams.find(vs => vs.codec == AudioCodecsEnum.OPUS);
    let VorbisStream = audioStreams.find(vs => vs.codec == AudioCodecsEnum.VORBIS);
    if (!OpusStream && !VorbisStream) return false;

    return true;
  }
}
