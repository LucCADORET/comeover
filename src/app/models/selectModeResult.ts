import { ModesEnum } from '../enums/modesEnum';

export class SelectModeResult {
    mode: ModesEnum;
    data: Array<File> | MediaStream;

    constructor(mode: ModesEnum, data: Array<File> | MediaStream) {
        this.mode = mode;
        this.data = data;
    }
}