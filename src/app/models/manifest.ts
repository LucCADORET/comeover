import { Chunk } from './chunk';

export class Manifest {
    mimeType: string;
    chunks: Array<Chunk>;

    constructor(data: any) {
        this.mimeType = data.mimeType;
        this.chunks = data.chunks.map((d: any) => new Chunk(d.id, d.file, d.magnet));
    }
}