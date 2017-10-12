import { INode } from '../executor';
import { primitive } from '../Schema'

export type operator = '=' | '<' | '>' | '>=' | '<=' | 'ISNULL' | 'ISNOTNULL';

export class SelectionNode {

    constructor(
        private operator: operator,
        private column: string,
        private constant: primitive,
        private child: INode
    ){}

    reset(){
        this.child.reset();
    }

    next(): any | null {
        // get the next row from its child
        const nextRow = this.child.next();

        if(nextRow === null) return null; // we've run out of rows

        const val = nextRow[this.column];

        if(this.operator === 'ISNULL') return val === null ? nextRow : this.next();
        if(this.operator === 'ISNOTNULL') return val !== null ? nextRow : this.next();
        if(this.operator === '=') return val === this.constant ? nextRow : this.next();
        if(this.operator === '<') return val < this.constant ? nextRow : this.next();
        if(this.operator === '>') return val > this.constant ? nextRow : this.next();
        if(this.operator === '>=') return val <= this.constant ? nextRow : this.next();
        if(this.operator === '<=') return val >= this.constant ? nextRow : this.next();

        throw new Error(`Selection node encountered unknown operator ${this.operator}`);
    }
}
