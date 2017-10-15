import { TupleSerializer } from "./TupleSerializer";
import { table } from './Schema';

export class TupleBlock {

    public static readonly blockSize = 1 << 12;
    private readonly tupleSize: number;

    constructor(
        private readonly serializer: TupleSerializer,
        private readonly table: table,
        private readonly buffer?: ArrayBuffer
    ){
        this.table = table;
        this.tupleSize = table.columns.map((col) => col.size).reduce((a, b) => a + b);

        if(!buffer){
            this.buffer = new ArrayBuffer(TupleBlock.blockSize);
            new Int32Array(this.buffer, 0, 1)[0] = 4;
        }else{
            this.buffer = buffer;
        }
    }

    getAvailableBytes(){
        return this.buffer!.byteLength - this.getbytesUsed();
    }

    private getbytesUsed(){
        return new Int32Array(this.buffer!, 0, 1)[0];
    }

    private setBytesUsed(bytesUsed: number){
        new Int32Array(this.buffer!, 0, 1)[0] = bytesUsed;
    }

    addTuple(obj: any){

        if(this.tupleSize > this.getAvailableBytes()) return false;

        const entry = this.serializer.serialize(this.table, obj);

        const mutableSourceBufferView = new Uint8Array(entry);
        const mutableTargetBufferView = new Uint8Array(this.buffer!, this.getbytesUsed(), this.tupleSize);

        if(mutableSourceBufferView.byteLength !== mutableTargetBufferView.byteLength) throw new Error(`Misaligned buffers on write!`);

        for(let i=0; i<mutableSourceBufferView.byteLength; i++){
            mutableTargetBufferView[i] = mutableSourceBufferView[i];
        }

        this.setBytesUsed(this.getbytesUsed() + this.tupleSize);

        return true;
    }

    getAllTuples(){

        const results: any[] = [];
        const tupleCount = Math.floor((this.getbytesUsed() - 4) / this.tupleSize);
        const rowCountOffset = 4; // in bytes, starting at four because the first four bytes store the rowCount

        for(let i=0; i<tupleCount; i++){
            const readOffset = rowCountOffset + (i*this.tupleSize);
            const sourceBuffer = this.buffer!.slice(readOffset, this.tupleSize + readOffset);
            const resultBuffer = this.serializer.deserialize(this.table, sourceBuffer);
            results.push(resultBuffer);
        }

        return results;
    }

    getBytes(){
        const buf = new Buffer(this.buffer!.byteLength);
        const view = new Uint8Array(this.buffer!);
        for (let i = 0; i < buf.length; ++i) {
            buf[i] = view[i];
        }
        return buf;
    }
}