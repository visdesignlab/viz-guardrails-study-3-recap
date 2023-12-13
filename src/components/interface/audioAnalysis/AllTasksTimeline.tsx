import { useMemo } from 'react';
import * as d3 from 'd3';
import { ParticipantData } from '../../../storage/types';
import { SingleTask } from './SingleTask';



const margin = {left: 5, top: 0, right: 5, bottom: 0};
export function AllTasksTimeline({participantData, width, height, setSelectedTask, selectedTask} : {participantData: ParticipantData, width: number, height: number, setSelectedTask: (task: string | null) => void, selectedTask: string | null}) {
    const xScale = useMemo(() => {
        const allStartTimes = Object.values(participantData.answers).map((answer) => [answer.startTime, answer.endTime]).flat();

        const scale = d3.scaleLinear([margin.left, width + margin.left + margin.right]).domain(d3.extent(allStartTimes));

        return scale;
    }, [participantData.answers, width]);

    return <svg style={{width, height}}>
        {Object.entries(participantData.answers).map((entry) => {
            const [name, answer] = entry;

            return <SingleTask isSelected={selectedTask === name} setSelectedTask={setSelectedTask} answer={answer} height={height} name={name} xScale={xScale}></SingleTask>;
        })}

    </svg>;
}
  