import { SubtitleTypesEnum } from '../enums/subtitleTypesEnum';

export class SubtitleStream {
    index: number;
    language: string;
    type: SubtitleTypesEnum;

    constructor(indexStr: string, language: string, typeStr: string) {
        this.index = parseFloat(indexStr);
        this.language = language;
        if (typeStr.toLowerCase().includes('dvd_subtitle')) {
            this.type = SubtitleTypesEnum.DVD_SUBTITLE;
        } else {
            this.type = SubtitleTypesEnum.UNKNOWN;
        }
    }
}