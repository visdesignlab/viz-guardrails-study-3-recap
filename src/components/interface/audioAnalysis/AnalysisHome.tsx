/* eslint-disable @typescript-eslint/no-explicit-any */

import { useNavigate } from 'react-router-dom';
import { useStorageEngine } from '../../../store/storageEngineHooks';
import { useAsync } from '../../../store/hooks/useAsync';
import { StorageEngine } from '../../../storage/engines/StorageEngine';
import { Anchor, Loader, Stack } from '@mantine/core';
import { AllTasksTimeline } from './AllTasksTimeline';
import { useResizeObserver } from '@mantine/hooks';

function getParticipantData(storageEngine: StorageEngine | undefined) {
    if(storageEngine) {
        return storageEngine.getAllParticipantsData();
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AnalysisHome() {
    const { storageEngine } = useStorageEngine();

    const navigate = useNavigate();

    const {value: allPartsData, status} = useAsync(getParticipantData, [storageEngine]);

    const [ref, {width}] = useResizeObserver();

    console.log(allPartsData, status, width);

    return status === 'success' && allPartsData ? <Stack spacing={20} style={{width: '100%'}} ref={ref}>
        {allPartsData?.map((participant) => {
            return (<Stack key={participant.participantId}>
                <Anchor onClick={() => navigate(`${participant.participantId}/${participant.sequence[0]}`)}>{participant.participantId}</Anchor>
                <AllTasksTimeline selectedTask={null} setSelectedTask={() => null} participantData={participant} width={500} height={50}/>
            </Stack>);
        })}
    </Stack> : <Loader/>;
}
  