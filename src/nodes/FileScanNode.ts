import * as fs from 'fs';
import parse = require('csv-parse/lib/sync');
import { TupleBlock } from '../TupleBlock';
import { TupleSerializer as Serializer } from '../TupleSerializer';
import { table } from '../schema';

function toArrayBuffer(buf: Buffer) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

export class FilescanNode {

    private readonly blockSize = 1 << 12; // 4kb 4096 bytes
    private currentBlockIndex = 0;
    private tableSize: number;

    private fileDescriptor: number;

    private parsedDataBuffer: any[] = []; // parsed rows from disk saved here
    private readIndex = 0;

    loadNextBlock(): void {

        this.readIndex = 0;

        if((this.currentBlockIndex + TupleBlock.blockSize) > this.tableSize){
            this.parsedDataBuffer = [];
            return;
        }

        const intermediateBuffer = new Buffer(TupleBlock.blockSize);

        fs.readSync(
            this.fileDescriptor,
            intermediateBuffer,
            0,
            TupleBlock.blockSize,
            this.currentBlockIndex
        );

        this.currentBlockIndex += TupleBlock.blockSize;
        const targetBuffer = toArrayBuffer(intermediateBuffer);
        this.parsedDataBuffer = new TupleBlock(new Serializer(), this.source, targetBuffer).getAllTuples();
    }

    constructor(dataDir: string, private source: table){
        this.tableSize = fs.statSync(`${dataDir}/${source.name}.table`).size;
        this.fileDescriptor = fs.openSync(`${dataDir}/${source.name}.table`, 'r');
        this.loadNextBlock();
    }

    reset(){
        this.currentBlockIndex = 0;
        this.parsedDataBuffer = [];
        this.readIndex = 0;
        this.loadNextBlock();
    }

    next(): any | null {
        // if there isn't a current block or we're at the end of the current block
        if(this.readIndex === this.parsedDataBuffer.length) this.loadNextBlock(); // try loading a new current block

        // if there *still* is no current block
        if(!this.parsedDataBuffer.length) return null; // return null. We're at the end

        // we definitely have a current block and are not at the end of it
        return this.parsedDataBuffer[this.readIndex++];
    }
}
