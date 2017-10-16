import { INode } from '../executor';

export class HashJoinNode {

    private storage: any = {};
    private leftLoaded = false;

    constructor(
        private leftColumn: string,
        private rightColumn: string,
        private leftChild: INode,
        private rightChild: INode
    ){}

    reset(){
        this.leftChild.reset();
        this.rightChild.reset();
        this.storage = {};
        this.leftLoaded = false;
    }

    private loadLeftRelation(){
        let nextVal;
        while(nextVal = this.leftChild.next()) this.storage[nextVal[this.leftColumn]] = nextVal;
        this.leftLoaded = true;
    }

    private joinRecords(a: any, b: any){
        for(let key in b) a[key] = b[key];
        return a;
    }

    next(): any | null {

        if(!this.leftLoaded) this.loadLeftRelation();

        while(true){
            const nextVal = this.rightChild.next();
            if(!nextVal) return null;

            const matchedRecord = this.storage[nextVal[this.rightColumn]];
            if(matchedRecord) return this.joinRecords(matchedRecord, nextVal);
        }
    }
}
