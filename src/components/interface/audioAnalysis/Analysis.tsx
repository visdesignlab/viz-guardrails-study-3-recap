import { Box, Stack } from '@mantine/core';
import { useParams } from 'react-router-dom';

import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';



import { WaveSurfer, WaveForm } from 'wavesurfer-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StudyState, useFirebaseDb } from '../../../store/store';
import { useElementSize } from '@mantine/hooks';
import { TrialResult } from '../../../store/types';
import * as d3 from 'd3';



async function getAudioFromFirebase(trrackId: string): Promise<string> {
    const storage = getStorage();

    const url = await getDownloadURL(ref(storage, trrackId));
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
            const blob = xhr.response;
    
            const url = URL.createObjectURL( blob );
    
            resolve(url);
        };
        xhr.open('GET', url);
        xhr.send();
    });
}

export function Analysis() {
    const {trrackId, trialName} = useParams();

    const {width, ref} = useElementSize<HTMLDivElement>();

    const db = useFirebaseDb().firestore;

    const [endState, setEndState] = useState<StudyState | null>(null);


    useEffect(() => {
        const docRef = doc(db, 'dev-sessions', trrackId!);

        getDoc(docRef).then((snap) => {
            if(snap.exists()) {
                const currentNode = snap.data().current;
                const nodeRef = doc(db, 'dev-sessions', trrackId!, 'nodes', currentNode);
                getDoc(nodeRef).then((node) => {
                    if(node.exists()) {
                        setEndState(node.data().state.val);
                    }
                });
            }
        });
    }, [db, trrackId]);

    const xScale = useMemo(() => {
        if(endState && trialName) {
            const trial = endState.trrackedSlice[trialName] as unknown as TrialResult;
            return d3.scaleLinear([0, width]).domain([trial.startTime, trial.endTime]);
        }

        return null;
    }, [endState, trialName, width]);

    const waveSurferRef = useRef<any>();

    const handleWSMount = useCallback(
        (waveSurfer: any) => {
          waveSurferRef.current = waveSurfer;
    
          if (waveSurferRef.current) {
            getAudioFromFirebase(trrackId!).then((url) => {
                if(waveSurferRef.current) {
                    waveSurferRef.current.load(url);

                    waveSurferRef.current.on('interaction', () => {
                        waveSurferRef.current.play();
                    });
                }
                
            });
          }
        },
        [trrackId]
      );

    const events = useMemo(() => {
        if(endState && trialName && xScale) {
            const trial = endState.trrackedSlice[trialName] as unknown as TrialResult;

            const nodes = trial.provenanceGraph.nodes;

            return Object.values(nodes).filter((node) => node.label !== 'Root').map((node) => {
                return <circle r={5} cy={150} cx={xScale(node.createdOn as unknown as number)} fill ="cornflowerblue" ></circle>;
            });
        }

        return null;
    }, [endState, trialName, xScale]);

    return <Stack ref={ref} style={{width: '100%'}}>
        <svg style={{width: '100%', height: '300px'}}>
            <line x1={0} x2={width} y1={150} y2={150} strokeWidth={1} stroke={'lightgray'}></line>
            {events}
        </svg>
        <Box style={{width: '100%'}}>
            <WaveSurfer onMount={handleWSMount}>
                <WaveForm id="waveform"/>
            </WaveSurfer>
        </Box>
    </Stack>;
}
  