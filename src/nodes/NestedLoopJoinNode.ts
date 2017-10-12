import { INode } from '../executor';

export class NestedLoopJoin {

    private currentLeft: any;

    constructor(
        private leftColumn: string,
        private rightColumn: string,
        private leftChild: INode,
        private rightChild: INode
    ){}

    reset(){
        this.leftChild.reset();
        this.rightChild.reset();
        this.currentLeft = null;
    }

    private joinRecords(a: any, b: any){
        for(let key in b) a[key] = b[key];
        return a;
    }

    next(): any | null {

        this.currentLeft = this.currentLeft || this.leftChild.next();
        let nextLeftJoinField = this.currentLeft[this.leftColumn];

        while(true){
            let nextRight = this.rightChild.next();

            if(!nextRight){

                this.currentLeft = this.leftChild.next();
                if(!this.currentLeft) return null;

                nextLeftJoinField = this.currentLeft[this.leftColumn];
                this.rightChild.reset();
                nextRight = this.rightChild.next();
            }

            let nextRightJoinField = nextRight[this.rightColumn];
            if(nextLeftJoinField === nextRightJoinField) return this.joinRecords(this.currentLeft, nextRight);
        }

    }
}
