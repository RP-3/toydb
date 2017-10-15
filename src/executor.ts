import { FilescanNode } from './nodes/FileScanNode'
import { HashJoinNode } from './nodes/HashJoinNode'
import { NestedLoopJoin } from './nodes/NestedLoopJoinNode'
import { ProjectionNode } from './nodes/ProjectionNode';
import { SortNode, sortDirection } from './nodes/SortNode';
import { SelectionNode, operator } from './nodes/SelectionNode';
import { DistinctNode } from './nodes/DistinctNode';
import { primitive, table, movies, ratings } from './Schema'

const dataDir = '/Users/sarith21/Documents/code/toydb/data/';

export interface INode {
    next: () => any | null;
    reset: () => void;
}

const nodeMap = {
    'SELECTION': (o: operator, column: string, constant: primitive, child: INode) => new SelectionNode(o, column, constant, child),
    'DISTINCT': (column: string, child: INode) => new DistinctNode(column, child),
    'SORT': (column: string, direction: sortDirection, child: INode) => new SortNode(column, direction, child),
    'PROJECTION': (columnList: string[], child: INode) => new ProjectionNode(columnList, child),
    'HASHJOIN': (leftColumn: string, rightColumn: string, leftChild: INode, rightChild: INode) => new HashJoinNode(leftColumn, rightColumn, leftChild, rightChild),
    'NESTEDJOIN': (leftColumn: string, rightColumn: string, leftChild: INode, rightChild: INode) => new NestedLoopJoin(leftColumn, rightColumn, leftChild, rightChild),
    'FILESCAN': (sourceName: table) => new FilescanNode(dataDir, sourceName),
}

type nodeType = 'SELECTION' | 'DISTINCT' | 'SORT' | 'PROJECTION' | 'FILESCAN';

class Executor{

    public rootNode: INode;
    private empty = false;

    private isNode(arg: any){
        return Array.isArray(arg) && nodeMap.hasOwnProperty(arg[0]);
    }

    private instantiateNode(nodeArgs: any[]){

        const nodeType: nodeType = nodeArgs[0];
        if(!nodeMap.hasOwnProperty(nodeType)) throw new Error(`Unknown node type ${nodeType}`);

        // if its a leaf, return immediately
        if(nodeType === 'FILESCAN') return nodeMap['FILESCAN'](nodeArgs[1]);

        // else recursively parse the remaining arguments
        const fixedNodeArgs: any = nodeArgs.slice(1).map((nodeArg) => {
            return this.isNode(nodeArg) ? this.instantiateNode(nodeArg) : nodeArg;
        });

        // and then return the top-level one
        return nodeMap[nodeType].apply(null, fixedNodeArgs);
    }

    constructor(query: any[]){
        this.rootNode = this.instantiateNode(query);
    }

    next(): any {
        if(this.empty) return null;

        const result = this.rootNode.next();

        if(result) return result;

        this.empty = true;
        return null;
    }
}

const query =
// ['SORT', 'title', 'ASC',
    // ['SELECTION', '>', 'movieId', 50,
        // ['DISTINCT', 'title',
            // ['SORT', 'movieId', 'DESC',
                ['NESTEDJOIN', 'movieId', 'movieId',
                    ['PROJECTION', ['movieId', 'title'],
                        ['FILESCAN', movies]
                    ],
                    ['FILESCAN', ratings]
                ]
            // ]
        // ]
    // ]
// ];

let x = new Executor(query);
let tmp;
while(tmp = x.next()) console.log(tmp);
