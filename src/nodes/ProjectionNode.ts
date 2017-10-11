import { INode } from '../executor';

export class ProjectionNode {

    constructor(private child: INode, private columnList: string[]){}

    next(): any | null {
        // get the next row from its child
        const result = {}; 
        const nextRow = this.child.next();

        if(nextRow){
            return this.columnList.reduce((result: any, key) => {
                result[key] = nextRow[key];
                return result;
            }, {});
        }

        return null;
    }
}
