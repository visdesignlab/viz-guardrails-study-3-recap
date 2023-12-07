import { Box, Button, Center, Group, Stack, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';

import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';



import { WaveSurfer, WaveForm } from 'wavesurfer-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StudyState, useFirebaseDb } from '../../../store/store';
import { useElementSize } from '@mantine/hooks';
import { TrialResult } from '../../../store/types';
import * as d3 from 'd3';
import { ProvenanceGraph } from '@trrack/core/graph/graph-slice';
import { useEvent } from '../../../store/hooks/useEvent';


export interface TranscribedAudioSnippet {
    alternatives: {confidence: number, transcript: string}[]
    languageCode: string;
    resultEndTime: string;
}
export interface TranscribedAudio {
    results: TranscribedAudioSnippet[]
}

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

async function getTranscriptionFromFirebase(trrackId: string): Promise<string> {
    const storage = getStorage();

    const url = await getDownloadURL(ref(storage, `${trrackId}.wav_transcription.txt`));
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
            const blob = xhr.response;
    
            blob.text().then((text: string) => {
                const json = text;
    
                resolve(json);
            });
        };
        xhr.open('GET', url);
        xhr.send();
    });
}

async function getTrrackFromFirebase(studyName: string, trialName: string, trrackId: string): Promise<string> {
    const storage = getStorage();

    const url = await getDownloadURL(ref(storage, `${studyName}/${trialName}/${trrackId}`));
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
            const blob = xhr.response;

            blob.text().then((text: string) => {
                const json = text;
    
                resolve(json);
            });

        };
        xhr.open('GET', url);
        xhr.send();
    });
}


export function Analysis() {
    const {trrackId, trialName, studyId} = useParams();

    const {width, ref} = useElementSize<HTMLDivElement>();

    const db = useFirebaseDb().firestore;

    const [endState, setEndState] = useState<StudyState | null>(null);
    const [provGraph, setProvGraph] = useState<ProvenanceGraph<any, any>['nodes'] | null>(null);
    const [transcription, setTranscription] = useState<TranscribedAudio | null>(null);

    const [currentShownTranscription, setCurrentShownTranscription] = useState<number | null>(null);

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


    }, [db, studyId, trialName, trrackId]);

    useEffect(() => {
        if(studyId && trialName && trrackId && endState) {
            getTrrackFromFirebase(studyId, trialName, (endState.trrackedSlice[trialName] as unknown as TrialResult).provenanceRoot).then((data) => {
                setProvGraph(JSON.parse(data));
            });
        }
    }, [endState, studyId, trialName, trrackId]);

    useEffect(() => {
        if(studyId && trialName && trrackId && endState) {
            getTranscriptionFromFirebase(trrackId).then((data) => {
                setTranscription(JSON.parse(data));
            });
        }
    }, [endState, studyId, trialName, trrackId]);

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
                    setCurrentShownTranscription(0);
                }
                
            });
          }
        },
        [trrackId]
      );

    const timeUpdateCallback = useEvent<(t: number) => void, any>((time: number) => {
        if(transcription && currentShownTranscription !== null) {
            const tempTime = transcription.results[currentShownTranscription].resultEndTime;

            const numTime = +tempTime.slice(0, tempTime.length - 2);

            if(time > numTime && currentShownTranscription !== transcription.results.length - 1) {
                setCurrentShownTranscription(currentShownTranscription + 1);
            }
            
        }
    });

    useEffect(() => {
        if(waveSurferRef.current) {
            waveSurferRef.current.on('interaction', () => {
                waveSurferRef.current.play();
                setCurrentShownTranscription(0);
            });

            waveSurferRef.current.on('timeupdate', timeUpdateCallback);
        }
    }, [timeUpdateCallback]);

    const events = useMemo(() => {
        if(endState && trialName && xScale && provGraph) {

            const nodes = Object.values(provGraph);

            return Object.values(nodes).filter((node) => node.label !== 'Root').map((node) => {
                return <circle key={node.id} r={5} cy={150} cx={xScale(node.createdOn as unknown as number)} fill ="cornflowerblue" ></circle>;
            });
        }

        return null;
    }, [endState, provGraph, trialName, xScale]);

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
        <Group>
            <Button onClick={() => {
                if(waveSurferRef.current) {
                    waveSurferRef.current.play();
                }
            }}>Play</Button>
            <Button onClick={() => {
                if(waveSurferRef.current) {
                    waveSurferRef.current.pause();
                }
            }}>Pause</Button>

        </Group>
        <Group style={{width: '100%', height: '100px'}} align="center" position='center'>
            <Center>
                <Text color='dimmed' size={20} style={{width: '100%'}}>
                    {transcription && currentShownTranscription !== null ? transcription.results[currentShownTranscription].alternatives[0].transcript : ''}
                </Text>
            </Center>
        </Group>
    </Stack>;
}
  