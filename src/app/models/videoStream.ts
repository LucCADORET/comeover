import { VideoCodecsEnum } from '../enums/videoCodecsEnum';

export class VideoStream {
    index: number;
    codec: VideoCodecsEnum;

    constructor(indexStr: string, codecsStr: string) {
        this.index = parseFloat(indexStr);

        let firstCodec = codecsStr.split(',')[0];
        if (firstCodec.toLowerCase().includes('vp8')) {
            this.codec = VideoCodecsEnum.VP8;
        } else if (firstCodec.toLowerCase().includes('vp9')) {
            this.codec = VideoCodecsEnum.VP9;
        } else if (firstCodec.toLowerCase().includes('264')) {
            this.codec = VideoCodecsEnum.H264;
        } else if (firstCodec.toLowerCase().includes('theora')) {
            this.codec = VideoCodecsEnum.THEORA;
        } else {
            this.codec = VideoCodecsEnum.UNKNOWN;
        }
    }
}