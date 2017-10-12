import { INode } from '../executor';

export class DistinctNode {

    constructor(
        private column: string,
        private child: INode
    ){}

    private previous: any = undefined

    reset(){
        this.child.reset();
        this.previous = undefined;
    }

    next(): any | null {
        // get the next row from its child
        const nextRow = this.child.next();

        if(nextRow === null) return null; // we've run out of rows

        if(nextRow[this.column] === this.previous) return this.next();

        this.previous = nextRow[this.column];
        return nextRow;
    }
}
