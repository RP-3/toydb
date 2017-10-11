import { FilescanNode } from './nodes/FileScanNode2'
import { ProjectionNode } from './nodes/ProjectionNode';
import { SortNode, sortDirection } from './nodes/SortNode';
import { SelectionNode, operator } from './nodes/SelectionNode';
import { DistinctNode } from './nodes/DistinctNode';
import { primitive } from './Schema'

const dataDir = '/Users/rohanpethiyagoda/Documents/code/academics/bradfield/databases/toyDb/data/';

export interface INode {
    next: () => any | null;
}

const nodeMap = {
    'SELECTION': (child: INode, o: operator, column: string, constant: primitive) => new SelectionNode(child, o, column, constant),
    'DISTINCT': (child: INode, column: string) => new DistinctNode(child, column),
    'SORT': (child: INode, column: string, direction: sortDirection) => new SortNode(child, column, direction),
    'PROJECTION': (child: INode, columnList: string[]) => new ProjectionNode(child, columnList),
    'FILESCAN': (sourceName: string) => new FilescanNode(dataDir, sourceName)
}

type nodeType = 'SELECTION' | 'DISTINCT' | 'SORT' | 'PROJECTION' | 'FILESCAN';

class Executor{

    public rootNode: INode;
    private empty = false;

    constructor(query: any[]){

        const queryLength = query.length - 1;

        const nodeType = query[queryLength][0] as nodeType;
        if( nodeType !== 'FILESCAN') throw new Error(`Leaf node of query must be a FILESCAN. Got ${nodeType}`);
        const sourceName = query[queryLength][1];

        let childNode: INode = nodeMap['FILESCAN'](sourceName);
        let currentNode: INode;

        for(let i = query.length -2; i >= 0; i--){

            const nodeType = query[i][0] as nodeType;
            const nodeArgs = query[i].slice(1);
            if(!nodeMap[nodeType]) throw new Error(`Unknown node type ${nodeType}`);

            currentNode = nodeMap[nodeType].apply(null, [childNode].concat(nodeArgs));
            childNode = currentNode;
        }

        this.rootNode = childNode;
    }

    next(): any {
        if(this.empty) return null;

        const result = this.rootNode.next();

        if(result) return result;

        this.empty = true;
        return null;
    }
}

const query = [
    ['SORT', 'title', 'ASC'],
    ['SELECTION', '>', 'movieId', 3000],
    ['DISTINCT', 'title'],
    ['SORT', 'movieId', 'DESC'],
    ['PROJECTION', ['movieId', 'title']],
    ['FILESCAN', 'movies']
];

let x = new Executor(query);
let tmp;
while(tmp = x.next()){
    console.log(tmp);
}
