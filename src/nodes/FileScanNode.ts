import * as fs from 'fs';
const parse = require('csv-parse/lib/sync');

export class FilescanNode {

    private readonly blockSize = 1 << 12; // 4kb 4096 bytes
    private currentBlockIndex = 0;
    // private fileDescriptor: number;

    private headerParsed = false;
    private header: string = '';
    private file: string;

    private parsedDataBuffer: any[] = []; // parsed rows from disk saved here
    private readIndex = 0;

    parseBlockToCSV(buffer: Buffer){
        const newTupleBuffer = parse(this.file, {columns: true, auto_parse: true});
        this.parsedDataBuffer = newTupleBuffer;
    }

    loadNextBlock(): void {
        this.parseBlockToCSV(new Buffer(4));
    }

    constructor(dataDir: string, source: string){
        this.file = fs.readFileSync(`${dataDir}/${source}.csv`).toString('utf8');
        this.loadNextBlock();
    }

    reset(){
        this.currentBlockIndex = 0;
        this.headerParsed = false;
        this.header = '';
        this.parsedDataBuffer = [];
        this.readIndex = 0;
        this.loadNextBlock();
    }

    next(): any | null {
        // if there isn't a current block or we're at the end of the current block
        if(this.readIndex === this.parsedDataBuffer.length) return null;// this.loadNextBlock(); // try loading a new current block

        // if there *still* is no current block
        if(!this.parsedDataBuffer.length) return null; // return null. We're at the end

        // we definitely have a current block and are not at the end of it
        return this.parsedDataBuffer[this.readIndex++];
    }
}
