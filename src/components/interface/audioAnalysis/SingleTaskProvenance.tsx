/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from 'd3';

import { StoredAnswer } from '../../../store/types';
import { AnimatedCircle } from './AnimatedCircle';

export function SingleTaskProvenance({xScale, answer, height, currentNode, setCurrentNode, lineLoc} : {answer: StoredAnswer, height: number, xScale: d3.ScaleLinear<number, number>, currentNode: string | null, setCurrentNode: (node: string) => void, lineLoc: number}) {
    return (
        <g style={{cursor: 'pointer'}}>
            {answer.provenanceGraph ? Object.entries(answer.provenanceGraph.nodes).map((entry) => {
                const [nodeId, node] = entry;

                return <g key={nodeId} onClick={() => setCurrentNode(nodeId)}><AnimatedCircle color={nodeId === currentNode ? 'cornflowerblue' : 'lightgray'} cx={xScale(node.createdOn)} cy={height / 2} r={5}></AnimatedCircle></g>;
            }) : null}
            {currentNode && answer.provenanceGraph && answer.provenanceGraph.nodes[currentNode] ? <circle fill={'cornflowerblue'} cx={xScale(answer.provenanceGraph.nodes[currentNode].createdOn)} cy={height / 2} r={5}></circle> : null}
            <line x1={lineLoc} x2={lineLoc} y1={50} y2={height - 50} strokeWidth={1} stroke="cornflowerblue"></line>
        </g>);
}
  