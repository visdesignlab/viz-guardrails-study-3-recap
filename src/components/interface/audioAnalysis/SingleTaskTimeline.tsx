import  { useCallback, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { ParticipantData } from '../../../storage/types';
import { SingleTaskProvenance } from './SingleTaskProvenance';
import { AnimatedPath } from './AnimatedPath';
import { useEvent } from '../../../store/hooks/useEvent';
import { Button, Group, Stack, Text } from '@mantine/core';

const margin = {left: 5, top: 0, right: 5, bottom: 0};
export function SingleTaskTimeline({participantData, width, height, selectedTask, currentNode, setCurrentNode} : {participantData: ParticipantData, width: number, height: number, selectedTask?: string | null, currentNode: string | null, setCurrentNode: (node: string) => void}) {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playTime, setPlayTime] = useState<number>(0);

    const [taskIndex, setTaskIndex] = useState<number>(0);
    const [provNodeIndex, setProvNodeIndex] = useState<number>(0);

    const xScale = useMemo(() => {
        const allStartTimes = selectedTask ? [participantData.answers[selectedTask].startTime, participantData.answers[selectedTask].endTime] : Object.values(participantData.answers).map((answer) => [answer.startTime, answer.endTime]).flat();

        const scale = d3.scaleLinear([margin.left, width + margin.left + margin.right]).domain(d3.extent(allStartTimes));

        return scale;
    }, [participantData.answers, selectedTask, width]);

    const {allTaskTimes} = useMemo(() => {
        const allTaskTimes = Object.entries(participantData.answers).map((answer) => ({time: answer[1].startTime, name: answer[0], nodes: answer[1].provenanceGraph ? Object.entries(answer[1].provenanceGraph?.nodes).map((entry) => ({time: entry[1].createdOn, name: entry[0]})).sort((a, b) => a.time - b.time) : []})).flat().sort((a, b) => a.time - b.time);
        return { allTaskTimes }; 
    }, [participantData.answers]);

    const timerCallback = useEvent(() => {
            if(isPlaying && playTime <= xScale.domain()[1]) {
                const newPlayTime = playTime + 35;
                if(newPlayTime > allTaskTimes[taskIndex + 1].time){
                    setTaskIndex(taskIndex + 1);
                    setProvNodeIndex(0);
                }
                else if(newPlayTime > allTaskTimes[taskIndex].nodes[provNodeIndex + 1].time) {
                    setProvNodeIndex(provNodeIndex + 1);
                    setCurrentNode(allTaskTimes[taskIndex].nodes[provNodeIndex + 1].name);
                }
                setPlayTime(newPlayTime);
            }
    });

    useEffect(() => {
        setPlayTime(xScale.domain()[0]);
    }, [xScale]);

    useEffect(() => {
        setTaskIndex(allTaskTimes.indexOf(allTaskTimes.find((task) => task.name === selectedTask)!));
    }, [selectedTask, allTaskTimes]);

    useEffect(() => {
        const interval = setInterval(timerCallback, 35);

        return () => clearInterval(interval);
    }, []);
    
    const wholeXScale = useMemo(() => {
        const allStartTimes = Object.values(participantData.answers).map((answer) => [answer.startTime, answer.endTime]).flat();

        const scale = d3.scaleLinear([margin.left, width + margin.left + margin.right]).domain(d3.extent(allStartTimes));

        return scale;
    }, [participantData.answers, width]);

    const currentNodeCallback = useCallback((node: string) => {
        console.log(allTaskTimes, node);
        setPlayTime(allTaskTimes[taskIndex].nodes.find((n) => n.name === node)!.time);
        setProvNodeIndex(allTaskTimes[taskIndex].nodes.indexOf(allTaskTimes[taskIndex].nodes.find((n) => n.name === node)!));

        setIsPlaying(false);

        setCurrentNode(node);
    }, [setCurrentNode, allTaskTimes, taskIndex]);
    
    return <Stack>
        <svg style={{width, height}}>
            <line stroke={'black'} strokeWidth={1} x1={margin.left} x2={width + margin.left} y1={height / 2} y2={height / 2}></line>
            {/* {selectedTask ? <line stroke="cornflowerblue" strokeWidth={1} opacity={1} x1={margin.left} x2={wholeXScale(participantData.answers[selectedTask].startTime)} y1={height / 2} y2={0}></line> : null } */}
            {selectedTask ? <AnimatedPath d={`M 0,${height/2} C 0,0 ${wholeXScale(participantData.answers[selectedTask].startTime)},${height/4} ${wholeXScale(participantData.answers[selectedTask].startTime)},0`}></AnimatedPath> : null }
            {selectedTask ? <AnimatedPath d={`M ${width},${height/2} C ${width},0 ${wholeXScale(participantData.answers[selectedTask].endTime)},${height/4} ${wholeXScale(participantData.answers[selectedTask].endTime)},0`}></AnimatedPath> : null }

            {/* {selectedTask ? <line stroke="cornflowerblue" strokeWidth={1} opacity={1} x1={margin.left + width} x2={wholeXScale(participantData.answers[selectedTask].endTime)} y1={height / 2} y2={0}></line> : null } */}

            {Object.entries(participantData.answers).map((entry) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [name, answer] = entry;

                return <SingleTaskProvenance lineLoc={xScale(playTime)} key={name}  answer={answer} height={height} currentNode={currentNode} setCurrentNode={currentNodeCallback} xScale={xScale}></SingleTaskProvenance>;
            })}

        </svg>
        <Group>
            <Button onClick={() => setIsPlaying(true)}>Play</Button>
            <Button onClick={() => setIsPlaying(false)}>Pause</Button>
            <Text>{new Date(playTime).toLocaleString()}</Text>
        </Group>
    </Stack>;
}

