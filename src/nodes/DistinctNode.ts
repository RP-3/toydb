import { INode } from '../executor';

export class DistinctNode {

    constructor(
        private child: INode,
        private column: string
    ){}

    private previous: any = undefined

    next(): any | null {
        // get the next row from its child
        const nextRow = this.child.next();

        if(nextRow === null) return null; // we've run out of rows

        if(nextRow[this.column] === this.previous) return this.next();

        this.previous = nextRow[this.column];
        return nextRow;
    }
}
