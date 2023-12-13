import  { useMemo } from 'react';
import * as d3 from 'd3';
import { ParticipantData } from '../../../storage/types';
import { SingleTaskProvenance } from './SingleTaskProvenance';
import { AnimatedPath } from './AnimatedPath';

const margin = {left: 5, top: 0, right: 5, bottom: 0};
export function SingleTaskTimeline({participantData, width, height, selectedTask, currentNode, setCurrentNode} : {participantData: ParticipantData, width: number, height: number, selectedTask?: string | null, currentNode: string | null, setCurrentNode: (node: string) => void}) {

    const wholeXScale = useMemo(() => {
        const allStartTimes = Object.values(participantData.answers).map((answer) => [answer.startTime, answer.endTime]).flat();

        const scale = d3.scaleLinear([margin.left, width + margin.left + margin.right]).domain(d3.extent(allStartTimes));

        return scale;
    }, [participantData.answers, width]);
    
    const xScale = useMemo(() => {
        const allStartTimes = selectedTask ? [participantData.answers[selectedTask].startTime, participantData.answers[selectedTask].endTime] : Object.values(participantData.answers).map((answer) => [answer.startTime, answer.endTime]).flat();

        const scale = d3.scaleLinear([margin.left, width + margin.left + margin.right]).domain(d3.extent(allStartTimes));

        return scale;
    }, [participantData.answers, selectedTask, width]);

    return <svg style={{width, height}}>
        <line stroke={'black'} strokeWidth={1} x1={margin.left} x2={width + margin.left} y1={height / 2} y2={height / 2}></line>
        {/* {selectedTask ? <line stroke="cornflowerblue" strokeWidth={1} opacity={1} x1={margin.left} x2={wholeXScale(participantData.answers[selectedTask].startTime)} y1={height / 2} y2={0}></line> : null } */}
        {selectedTask ? <AnimatedPath d={`M 0,${height/2} C 0,0 ${wholeXScale(participantData.answers[selectedTask].startTime)},${height/4} ${wholeXScale(participantData.answers[selectedTask].startTime)},0`}></AnimatedPath> : null }
        {selectedTask ? <AnimatedPath d={`M ${width},${height/2} C ${width},0 ${wholeXScale(participantData.answers[selectedTask].endTime)},${height/4} ${wholeXScale(participantData.answers[selectedTask].endTime)},0`}></AnimatedPath> : null }

        {/* {selectedTask ? <line stroke="cornflowerblue" strokeWidth={1} opacity={1} x1={margin.left + width} x2={wholeXScale(participantData.answers[selectedTask].endTime)} y1={height / 2} y2={0}></line> : null } */}

        {Object.entries(participantData.answers).map((entry) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [name, answer] = entry;

            return <SingleTaskProvenance answer={answer} height={height} currentNode={currentNode} setCurrentNode={setCurrentNode} xScale={xScale}></SingleTaskProvenance>;
        })}

    </svg>;
}

