import { INode } from '../executor';

type primitiveType = "string" | "number" | "boolean" | "symbol" | "undefined" | "object" | "function";

export type sortDirection = "ASC" | "DESC";

type Predicate = (x: any, y: any) => any;

type LoadablePredicate = (key: string) => Predicate;

type SortPredicateSet = {
    [type in sortDirection]: LoadablePredicate
}

type PredicateExpressionSet = {
    [type in primitiveType]: SortPredicateSet
}

const predicateExpressions = {
    number: {
        ASC: (key: string) => (a: any, b: any) => a[key] - b[key],
        DESC: (key: string) => (a: any, b: any) => b[key] - a[key]
    },
    string: {
        ASC: (key: string) => (a: any, b: any) => a[key] < b[key] ? -1 : a[key] === b[key] ? 0 : 1,
        DESC: (key: string) => (a: any, b: any) => a[key] < b[key] ? 1 : a[key] === b[key] ? 0 : -1,
    },
    boolean: {
        ASC: (key: string) => (a: any, b: any) => a[key] < b[key] ? -1 : a[key] === b[key] ? 0 : 1,
        DESC: (key: string) => (a: any, b: any) => a[key] < b[key] ? 1 : a[key] === b[key] ? 0 : -1,
    }
} as PredicateExpressionSet;

export class SortNode {

    private storage: any[] = [];
    private filledAndSorted = false;
    private yieldedRowCount = 0;

    constructor(
        private child: INode,
        private columnName: string,
        private direction: sortDirection
    ){}

    next(): any | null {
        // get the next row from its child
        if(!this.filledAndSorted){

            // fill up storage
            let tmp;
            while(tmp = this.child.next()) this.storage.push(tmp);
            this.filledAndSorted = true;
            
            // bail out if we were given an empty set
            if(!this.storage.length) return null;

            // validate sorting is possible
            const type = typeof this.storage[0][this.columnName];
            if(!type) throw new Error(`Column ${this.columnName} does not exist`);
            if(!predicateExpressions.hasOwnProperty(type)) throw new Error(`Unknown type ${type} in column ${this.columnName}`);

            // tease out the correct predicate
            const predicateSet = predicateExpressions[type] as SortPredicateSet;
            const loadablePredicate = predicateSet[this.direction] as LoadablePredicate;
            const predicate = loadablePredicate(this.columnName);

            // sort
            this.storage.sort(predicate);
        }

        if(this.yieldedRowCount < this.storage.length){
            return this.storage[this.yieldedRowCount++];
        }else{
            return null;
        }
    }
}
