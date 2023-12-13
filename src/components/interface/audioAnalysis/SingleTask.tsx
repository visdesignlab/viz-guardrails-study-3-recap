
import { useState } from 'react';
import {Center, Text} from '@mantine/core';
import * as d3 from 'd3';

import { StoredAnswer } from '../../../store/types';

export function SingleTask({xScale, answer, name, height, setSelectedTask, isSelected} : {answer: StoredAnswer, name: string, height: number, xScale: d3.ScaleLinear<number, number>, setSelectedTask: (task: string | null) => void, isSelected: boolean}) {
    const [isHover, setIsHover] = useState(false);

    return (
        <g onClick={() => setSelectedTask(isSelected ? null : name)} onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)} style={{cursor: 'pointer'}}>
            <rect opacity={.2} fill={isHover || isSelected ? 'cornflowerblue' : 'white'} x={xScale(answer.startTime)} width={xScale(answer.endTime) - xScale(answer.startTime)} y={0} height={height}></rect>
            <line stroke={'black'} strokeWidth={1} x1={xScale(answer.startTime)} x2={xScale(answer.startTime)} y1={0} y2={height}></line>
            <foreignObject x={xScale(answer.startTime)} width={xScale(answer.endTime) - xScale(answer.startTime)} y={0} height={height}><Center style={{height: '100%'}}><Text mx={'xs'} style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} >{name}</Text></Center></foreignObject>
            {/* <line stroke={'black'} strokeWidth={2} x1={xScale(answer.endTime)} x2={xScale(answer.endTime)} y1={0} y2={height}></line> */}
        </g>);
}
  