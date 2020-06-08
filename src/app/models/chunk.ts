
export class Chunk {
    id: number;
    file: any; // Can be vanilla file, or webtorrent file
    magnet: string;
    private ready: boolean; // True when the chunk is ready to be used by the view

    constructor(id: number, file: any, magnet?: string) {
        this.id = id;
        this.file = file;
        this.magnet = magnet;
        this.ready = false;
    }

    setReady() {
        this.ready = true;
    }

    isReady() {
        return this.ready;
    }
}