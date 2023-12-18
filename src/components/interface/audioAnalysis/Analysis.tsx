import { Center, Group, Stack, Text } from '@mantine/core';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useResizeObserver } from '@mantine/hooks';
import { useStorageEngine } from '../../../store/storageEngineHooks';
import { useAsync } from '../../../store/hooks/useAsync';
import { StorageEngine } from '../../../storage/engines/StorageEngine';
import { AllTasksTimeline } from './AllTasksTimeline';
import { SingleTaskTimeline } from './SingleTaskTimeline';

import {Registry, initializeTrrack} from '@trrack/core';
import { deepCopy } from '../../../utils/deepCopy';
export interface TranscribedAudioSnippet {
    alternatives: {confidence: number, transcript: string}[]
    languageCode: string;
    resultEndTime: string;
}
export interface TranscribedAudio {
    results: TranscribedAudioSnippet[]
}

// async function getAudioFromFirebase(trrackId: string): Promise<string> {
//     const storage = getStorage();

//     const url = await getDownloadURL(ref(storage, trrackId));
    
//     return new Promise((resolve) => {
//         const xhr = new XMLHttpRequest();
//         xhr.responseType = 'blob';
//         xhr.onload = (event) => {
//             const blob = xhr.response;
    
//             const url = URL.createObjectURL( blob );
    
//             resolve(url);
//         };
//         xhr.open('GET', url);
//         xhr.send();
//     });
// }

// async function getTranscriptionFromFirebase(trrackId: string): Promise<string> {
//     const storage = getStorage();

//     const url = await getDownloadURL(ref(storage, `${trrackId}.wav_transcription.txt`));
    
//     return new Promise((resolve) => {
//         const xhr = new XMLHttpRequest();
//         xhr.responseType = 'blob';
//         xhr.onload = (event) => {
//             const blob = xhr.response;
    
//             blob.text().then((text: string) => {
//                 const json = text;
    
//                 resolve(json);
//             });
//         };
//         xhr.open('GET', url);
//         xhr.send();
//     });
// }

function getParticipantData(trrackId: string | undefined, storageEngine: StorageEngine | undefined) {
    if(storageEngine) {
        return storageEngine.getParticipantData(trrackId);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Analysis({setProvState} : {setProvState: (state: any) => void}) {
    const {trrackId} = useParams();

    const navigate = useNavigate();

    const location = useLocation();

    const { storageEngine } = useStorageEngine();

    const [ref, {width}] = useResizeObserver();

    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [currentNode, setCurrentNode] = useState<string | null>(null);

    // const [currentShownTranscription, setCurrentShownTranscription] = useState<number | null>(null);
    const {value: participant, status } = useAsync(getParticipantData, [trrackId, storageEngine]);

    useEffect(() => {
        if(selectedTask) {
            const splitArr = location.pathname.split('/');

            setCurrentNode(null);
            splitArr[splitArr.length - 1] = selectedTask;
            navigate(splitArr.join('/'));
        }
    }, [selectedTask]);

    useEffect(() => {
        if(currentNode && selectedTask && participant) {

            const reg = Registry.create();
    
            const trrack = initializeTrrack({registry: reg, initialState: {} });

            if(participant.answers[selectedTask].provenanceGraph) {
                trrack.importObject(deepCopy(participant.answers[selectedTask].provenanceGraph!));

                const state = trrack.getState(trrack.graph.backend.nodes[currentNode]);
    
                setProvState(state);
            }
        }

        else {
            setProvState(null);
        }
    }, [currentNode, participant, selectedTask, setProvState]);

    // const xScale = useMemo(() => {
    //     if(endState && trialName) {
    //         const trial = endState.trrackedSlice[trialName] as unknown as TrialResult;
    //         return d3.scaleLinear([0, width]).domain([trial.startTime, trial.endTime]);
    //     }

    //     return null;
    // }, [endState, trialName, width]);

    // const waveSurferRef = useRef<any>();

    // const handleWSMount = useCallback(
    //     (waveSurfer: any) => {
    //       waveSurferRef.current = waveSurfer;
    
    //       if (waveSurferRef.current) {
    //         getAudioFromFirebase(trrackId!).then((url) => {
    //             if(waveSurferRef.current) {
    //                 waveSurferRef.current.load(url);
    //                 setCurrentShownTranscription(0);
    //             }
                
    //         });
    //       }
    //     },
    //     [trrackId]
    //   );

    // const timeUpdateCallback = useEvent<(t: number) => void, any>((time: number) => {
    //     if(transcription && currentShownTranscription !== null) {
    //         const tempTime = transcription.results[currentShownTranscription].resultEndTime;

    //         const numTime = +tempTime.slice(0, tempTime.length - 2);

    //         if(time > numTime && currentShownTranscription !== transcription.results.length - 1) {
    //             setCurrentShownTranscription(currentShownTranscription + 1);
    //         }
            
    //     }
    // });

    // useEffect(() => {
    //     if(waveSurferRef.current) {
    //         waveSurferRef.current.on('interaction', () => {
    //             waveSurferRef.current.play();
    //             setCurrentShownTranscription(0);
    //         });

    //         waveSurferRef.current.on('timeupdate', timeUpdateCallback);
    //     }
    // }, [timeUpdateCallback]);

    // const events = useMemo(() => {
    //     if(endState && trialName && xScale && provGraph) {

    //         const nodes = Object.values(provGraph);

    //         return Object.values(nodes).filter((node) => node.label !== 'Root').map((node) => {
    //             return <circle key={node.id} r={5} cy={150} cx={xScale(node.createdOn as unknown as number)} fill ="cornflowerblue" ></circle>;
    //         });
    //     }

    //     return null;
    // }, [endState, provGraph, trialName, xScale]);

    return <Stack ref={ref} style={{width: '100%'}} spacing={0}>
        {status === 'success' && participant ? <AllTasksTimeline selectedTask={selectedTask} setSelectedTask={setSelectedTask} participantData={participant} width={width} height={50}/> : null}
        {status === 'success' && participant ? <SingleTaskTimeline currentNode={currentNode} setCurrentNode={setCurrentNode} selectedTask={selectedTask} participantData={participant} width={width} height={200}/> : null}
        {/* <Box style={{width: '100%'}}>
            <WaveSurfer onMount={handleWSMount}>
                <WaveForm id="waveform"/>
            </WaveSurfer>
        </Box> */}
        {/* <Group>
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

        </Group> */}
        <Group style={{width: '100%', height: '100px'}} align="center" position='center'>
            <Center>
                <Text color='dimmed' size={20} style={{width: '100%'}}>
                    {/* {transcription && currentShownTranscription !== null ? transcription.results[currentShownTranscription].alternatives[0].transcript : ''} */}
                </Text>
            </Center>
        </Group>
    </Stack>;
}
  