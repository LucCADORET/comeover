import { AudioCodecsEnum } from '../enums/audioCodecsEnum';

export class AudioStream {
    index: number;
    language: string;
    codec: AudioCodecsEnum;

    constructor(indexStr: string, language: string, codecsStr: string) {
        this.index = parseFloat(indexStr);
        this.language = language;

        let firstCodec = codecsStr.split(',')[0];
        if (firstCodec.toLowerCase().includes('flac')) {
            this.codec = AudioCodecsEnum.FLAC;
        } else if (firstCodec.toLowerCase().includes('mp3')) {
            this.codec = AudioCodecsEnum.MP3;
        } else if (firstCodec.toLowerCase().includes('opus')) {
            this.codec = AudioCodecsEnum.OPUS;
        } else if (firstCodec.toLowerCase().includes('vorbis')) {
            this.codec = AudioCodecsEnum.VORBIS;
        } else if (firstCodec.toLowerCase().includes('aac')) {
            this.codec = AudioCodecsEnum.AAC;
        } else if (firstCodec.toLowerCase().includes('eac3')) {
            this.codec = AudioCodecsEnum.EAC3;
        } else {
            this.codec = AudioCodecsEnum.UNKNOWN;
        }
    }
}