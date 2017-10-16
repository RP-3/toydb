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

    private tuplePassesPredicate(val: any){
        if(this.operator === 'ISNULL') return val === null;
        else if(this.operator === 'ISNOTNULL') return val !== null;
        else if(this.operator === '=') return val === this.constant;
        else if(this.operator === '<') return val < this.constant;
        else if(this.operator === '>') return val > this.constant;
        else if(this.operator === '>=') return val <= this.constant;
        else if(this.operator === '<=') return val >= this.constant;
        else new Error(`Selection node encountered unknown operator ${this.operator}`);
    }

    next(): any | null {

        while(true){
            const nextRow = this.child.next(); // get the next row from its child
            if(nextRow === null) return null; // we've run out of rows

            const val = nextRow[this.column]; // parse the desired value out
            if(this.tuplePassesPredicate(val)) return nextRow;
        }
    }
}
