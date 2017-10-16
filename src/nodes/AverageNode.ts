import { INode } from '../executor';

export class AverageNode {

    private sum = 0;
    private count = 0;
    private returned = false;

    constructor(
        private column: string,
        private child: INode
    ){}

    reset(){
        this.child.reset();
        this.sum = 0;
        this.count = 0;
        this.returned = false;
    }

    next(): any | null {

        if(this.returned) return null; // only return one value

        while(true){
            const nextRow = this.child.next(); // get the next row from its child

            // once we run out of rows
            if(nextRow === null){
                // return the average, and remember that we've already returned
                this.returned = true;
                return this.sum / this.count;
            }

            this.count++;
            this.sum += nextRow[this.column];
        }
    }
}
