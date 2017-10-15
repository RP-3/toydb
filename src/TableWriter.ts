require('source-map-support').install()

import { TupleSerializer } from "./TupleSerializer";
import { movies, ratings, table } from './Schema';
import * as parse from 'csv-parse';
import * as fs from 'fs';
import { TupleBlock } from './TupleBlock';
const transform = require('stream-transform');

export class TableWriter {

    private currentBlock: TupleBlock;

    constructor(private tupleSerializer: TupleSerializer){}

    public createTable(table: table, sourcePath: string, destinationPath: string){

        this.currentBlock = new TupleBlock(this.tupleSerializer, table);

        return new Promise((resolve, reject) => {

            const parser = parse({columns: true, auto_parse: true});
            const input = fs.createReadStream(sourcePath);
            const destination = fs.createWriteStream(destinationPath);

            let linesParsed = 0;

            const transformer = transform((record: any, cb: any) => {

                const added = this.currentBlock.addTuple(record);

                if(!added){
                    destination.write(this.currentBlock.getBytes());
                    this.currentBlock = new TupleBlock(this.tupleSerializer, table);
                    this.currentBlock.addTuple(record);
                }

                cb();
                if(++linesParsed % 10000 === 0) process.stdout.write('.');

            }, {parallel: 1})

            input.pipe(parser).pipe(transformer).pipe(process.stdout);
            input.on('end', () => setTimeout(resolve, 100) );

        });
    }
}

const x = new TableWriter(new TupleSerializer());

// x.createTable(
//     movies,
//     '/Users/sarith21/Documents/code/toydb/data/originalData/movies.csv',
//     '/Users/sarith21/Documents/code/toydb/data/movies.table'
// )
// .then(() => {
//     console.log('finished movies');
//     return x.createTable(
//         ratings,
//         '/Users/sarith21/Documents/code/toydb/data/originalData/ratings.csv',
//         '/Users/sarith21/Documents/code/toydb/data/ratings.table'
//     );
// })
// .then(() => {
//     console.log('finished ratings');
//     setTimeout(() => process.exit(0), 200);
// })
