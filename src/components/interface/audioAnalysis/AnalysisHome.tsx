/* eslint-disable @typescript-eslint/no-explicit-any */

import { useStorageEngine } from '../../../store/storageEngineHooks';
import { useAsync } from '../../../store/hooks/useAsync';
import { StorageEngine } from '../../../storage/engines/StorageEngine';
import { Loader, Stack } from '@mantine/core';
import { AnalysisSingleParticipant } from './AnalysisSingleParticipant';

function getParticipantData(storageEngine: StorageEngine | undefined) {
    if(storageEngine) {
        return storageEngine.getAllParticipantsData();
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AnalysisHome() {
    const { storageEngine } = useStorageEngine();

    const {value: allPartsData, status} = useAsync(getParticipantData, [storageEngine]);

    return status === 'success' && allPartsData ? <Stack spacing={50} style={{width: '100%'}}>
        {allPartsData?.map((participant) => {
            return <AnalysisSingleParticipant key={participant.participantId} participant={participant}/>;
        })}
    </Stack> : <Loader/>;
}
  