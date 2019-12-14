import { VideoStream } from './videoStream';

export class VideoStreamOption {
    videoStream: VideoStream;

    constructor(videoStream: VideoStream) {
        this.videoStream = videoStream;
    }
}