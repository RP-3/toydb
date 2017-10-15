import { table, ratings } from './Schema';

export class TupleSerializer{

    private serializeString(targetBuffer: ArrayBuffer, offset: number, size: number,  str: string){

        const mutableView = new Uint8Array(targetBuffer, offset, size);

        for(let i=0; i<str.length; i++){
            mutableView[i] = str.charCodeAt(i);
        }

        return targetBuffer;
    };

    private serializeInteger(targetBuffer: ArrayBuffer, offset: number, integer: number){

        const mutableView = new Int32Array(targetBuffer, offset, 1);
        mutableView[0] = integer;
        return targetBuffer;
    };

    private serializeFloat(targetBuffer: ArrayBuffer, offset: number, float: number){

        const mutableView = new Float32Array(targetBuffer, offset, 1);
        mutableView[0] = float;
        return targetBuffer;
    };

    private serializeBoolean(targetBuffer: ArrayBuffer, offset: number, boolean: boolean){

        const mutableView = new Uint8Array(targetBuffer, offset, 1);
        mutableView[0] = boolean ? 1 : 0;
        return targetBuffer;
    };

    public serialize(table: table, obj: any){

        const tupleSize = table.columns
        .map((col) => col.size)
        .reduce((a, b) => a + b);

        const result = new ArrayBuffer(tupleSize);
        let offset = 0;

        table.columns.forEach((column) => {

            const columnName = column.name;
            if(obj[columnName] === undefined) throw new Error(`Cannot serialize object to ${table.name}. Column ${columnName} is missing.`);

            if(column.type === 'string') this.serializeString(result, offset, column.size, obj[columnName]);
            else if(column.type === 'integer') this.serializeInteger(result, offset, obj[columnName]);
            else if(column.type === 'float') this.serializeFloat(result, offset, obj[columnName]);
            else if(column.type === 'boolean') this.serializeBoolean(result, offset, obj[columnName]);
            else throw new Error(`Cannot serialize unknown type ${column.type}`);

            offset += column.size;
        });

        return result;
    };

    private deserializeString(targetBuffer: ArrayBuffer, offset: number, size: number){

        const mutableView = new Uint8Array(targetBuffer, offset, size);
        let result = '';

        for(let i=0; i<mutableView.byteLength; i++){
            result += mutableView[i] ? String.fromCharCode(mutableView[i]) : '';
        }

        return result;
    };

    private deserializeInteger(targetBuffer: ArrayBuffer, offset: number){
        return new Int32Array(targetBuffer, offset, 1)[0];
    }

    private deserializeFloat(targetBuffer: ArrayBuffer, offset: number){
        return new Float32Array(targetBuffer, offset, 1)[0];
    }

    private deserializeBoolean(targetBuffer: ArrayBuffer, offset: number){
        return new Uint8Array(targetBuffer, offset, 1)[0] === 1 ? 1 : 0;
    }

    public deserialize(table: table, tuple: ArrayBuffer){

        const tupleSize = table.columns
        .map((col) => col.size)
        .reduce((a, b) => a + b);

        const result: any = {};
        let offset = 0;

        table.columns.forEach((column) => {

            if(column.type === 'string') result[column.name] = this.deserializeString(tuple, offset, column.size);
            else if(column.type === 'integer') result[column.name] = this.deserializeInteger(tuple, offset);
            else if(column.type === 'float') result[column.name] = this.deserializeFloat(tuple, offset);
            else if(column.type === 'boolean') result[column.name] = this.deserializeBoolean(tuple, offset);
            else throw new Error(`Cannot deserialize unknown type ${column.type}`);

            offset += column.size;
        });

        return result;
    };
};

// const ts = new TupleSerializer();

// const tb = ts.serialize(ratings, { userId: 1, movieId: 2, rating: 3.5, timestamp: 1112486027 });
// const to = ts.deserialize(ratings, tb);

// console.log(to);