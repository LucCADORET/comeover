export class Chunk {
    id: number;
    file: File;
    magnet: string;

    constructor(id: number, file: File, magnet?: string) {
        this.id = id;
        this.file = file;
        this.magnet = magnet;
    }
}