import { TupleSerializer } from "./TupleSerializer";
import { movies, ratings, table } from './Schema';
import * as parse from 'csv-parse';
import * as fs from 'fs';
import { TupleBlock } from './TupleBlock';
import * as ProgressBar from 'progress';

import { exec } from 'child_process';

const transform = require('stream-transform');

export class TableWriter {

    private currentBlock: TupleBlock;
    private progressBar: ProgressBar;

    constructor(private tupleSerializer: TupleSerializer){}

    private countInputRows(sourcePath: string): Promise<number>{
        return new Promise((resolve, reject) => {

            exec(`wc -l ${sourcePath}`, (err, stdout, stderr) => {
                return err ? reject(err) : resolve(parseInt(stdout));
            });
        })
    }

    private setupProgressBar(rowCount: number){
        this.progressBar = new ProgressBar(':percent [:bar] :rate/rps', {
            complete: '=',
            incomplete: ' ',
            width: 100,
            total: rowCount,
            renderThrottle: 100
        });
    }

    private writeTableToDisk(table: table, sourcePath: string, destinationPath: string){
        return new Promise((resolve, reject) => {

            const parser = parse({columns: true, auto_parse: true});
            const input = fs.createReadStream(sourcePath);
            const destination = fs.createWriteStream(destinationPath);

            let linesParsed = 0;

            const transformer = transform((record: any, cb: any) => {

                const added = this.currentBlock.addTuple(record);
                this.progressBar.tick();

                if(!added){
                    destination.write(this.currentBlock.getBytes());
                    this.currentBlock = new TupleBlock(this.tupleSerializer, table);
                    this.currentBlock.addTuple(record);
                    this.progressBar.tick();
                }

                cb();

            }, {parallel: 1})

            input.pipe(parser).pipe(transformer).pipe(process.stdout);
            input.on('end', () => {
                setTimeout(resolve, 100);
                this.progressBar.tick = () => null;
                this.progressBar.terminate();
            });
        });
    }

    public createTable(table: table, sourcePath: string, destinationPath: string){

        this.currentBlock = new TupleBlock(this.tupleSerializer, table);

        return this.countInputRows(sourcePath)
        .then((rowCount) => this.setupProgressBar(rowCount))
        .then(() => this.writeTableToDisk(table, sourcePath, destinationPath))
        .then(() => console.log('\n Done! \n'));
    }
}

const x = new TableWriter(new TupleSerializer());

// x.createTable(
//     movies,
//     '/Users/rohanpethiyagoda/Documents/code/academics/bradfield/databases/toyDb/data/movies.csv',
//     '/Users/rohanpethiyagoda/Documents/code/academics/bradfield/databases/toyDb/data/movies.table'
// )
// .then(() => process.exit());
// .then(() => {
    x.createTable(
        ratings,
        '/Users/rohanpethiyagoda/Documents/code/academics/bradfield/databases/toyDb/data/ratings.csv',
        '/Users/rohanpethiyagoda/Documents/code/academics/bradfield/databases/toyDb/data/ratings.table'
    )
// })
.then(() => {
    setTimeout(() => process.exit(0), 200);
})
