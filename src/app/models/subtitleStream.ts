export class SubtitleStream {
    index: number;
    language: string;
    type: string;

    constructor(indexStr: string, language: string, typeStr: string) {
        this.index = parseFloat(indexStr);
        this.language = language;
        this.type = typeStr;
    }
}