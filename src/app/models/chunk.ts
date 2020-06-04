
export class Chunk {
    id: number;
    file: any; // Can be vanilla file, or webtorrent file
    magnet: string;

    constructor(id: number, file: any, magnet?: string) {
        this.id = id;
        this.file = file;
        this.magnet = magnet;
    }
}