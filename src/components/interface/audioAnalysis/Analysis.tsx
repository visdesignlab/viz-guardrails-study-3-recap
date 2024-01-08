import { Affix, AppShell, Box, Button, Center, Group, MantineProvider, Stack, Text } from '@mantine/core';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useResizeObserver } from '@mantine/hooks';
import { useStorageEngine } from '../../../store/storageEngineHooks';
import { useAsync } from '../../../store/hooks/useAsync';
import { StorageEngine } from '../../../storage/engines/StorageEngine';
import { AllTasksTimeline } from './AllTasksTimeline';
import { SingleTaskTimeline } from './SingleTaskTimeline';

import {Registry, initializeTrrack} from '@trrack/core';
import { deepCopy } from '../../../utils/deepCopy';
import { useEvent } from '../../../store/hooks/useEvent';

// import WaveSurfer from 'wavesurfer.js'; 

import {WaveSurfer, WaveForm} from 'wavesurfer-react';
import { createPortal } from 'react-dom';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
export interface TranscribedAudioSnippet {
    alternatives: {confidence: number, transcript: string}[]
    languageCode: string;
    resultEndTime: string;
}
export interface TranscribedAudio {
    results: TranscribedAudioSnippet[]
}

function getParticipantData(trrackId: string | undefined, storageEngine: StorageEngine | undefined) {
    if(storageEngine) {
        return storageEngine.getParticipantData(trrackId);
    }
}


function copyStyles(sourceDoc, targetDoc) {
    Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {

      if (styleSheet.cssRules) { // for <style> elements
        const newStyleEl = sourceDoc.createElement('style');
  
        Array.from(styleSheet.cssRules).forEach((cssRule) => {
          // write the text of each rule into the body of the style element
          newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
        });

        targetDoc.head.appendChild(newStyleEl);
      } else if (styleSheet.href) { // for <link> elements loading CSS from a URL
        const newLinkEl = sourceDoc.createElement('link');
  
        newLinkEl.rel = 'stylesheet';
        newLinkEl.href = styleSheet.href;
        targetDoc.head.appendChild(newLinkEl);
      }
    });
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Analysis({setProvState} : {setProvState: (state: any) => void}) {
    const {trrackId, trialName, studyId} = useParams();

    const navigate = useNavigate();

    const location = useLocation();

    const { storageEngine } = useStorageEngine();

    const [ref, {width}] = useResizeObserver();

    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [currentNode, setCurrentNode] = useState<string | null>(null);

    const [transcription, setTranscription] = useState<TranscribedAudio | null>(null);
    const [currentShownTranscription, setCurrentShownTranscription] = useState<number | null>(null);
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

    const waveSurferRef = useRef<any>();

    useEffect(() => {
        if(studyId && trialName && trrackId) {
            storageEngine?.getTranscription(trrackId).then((data) => {
                setTranscription(JSON.parse(data));
            });
        }
    }, [storageEngine, studyId, trialName, trrackId]);

    const handleWSMount = useCallback(
        (waveSurfer: any) => {
            console.log('mounted handle');
          waveSurferRef.current = waveSurfer;
          console.log(transcription);
    
          if (waveSurferRef.current) {
            storageEngine?.getAudio(trrackId!).then((url) => {
                if(waveSurferRef.current) {
                    waveSurferRef.current.load(url);
                    setCurrentShownTranscription(0);
                }
                
            });
          }
        },
        [storageEngine, trrackId]
      );

    const timeUpdateCallback = useEvent<(t: number) => void, any>((time: number) => {
        if(transcription && currentShownTranscription !== null) {
            const tempTime = transcription.results[currentShownTranscription].resultEndTime;

            const numTime = +tempTime.slice(0, tempTime.length - 2);

            console.log(time, numTime);

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

    const containerEl = useMemo(() => document.createElement('div'), []);

    useEffect(() => {
        const externalWindow = window.open(
            'about:blank',
            'newWin',
            `width=20000,height=500,left=${window.screen.availWidth / 3 -
                200},top=${window.screen.availHeight / 3 - 150}`
            )!;
    
        externalWindow.document.body.appendChild(containerEl);
        copyStyles(document, externalWindow?.document);

        return () => {
          externalWindow.close();
        };
      }, []);

    // const events = useMemo(() => {
    //     if(endState && trialName && xScale && provGraph) {

    //         const nodes = Object.values(provGraph);

    //         return Object.values(nodes).filter((node) => node.label !== 'Root').map((node) => {
    //             return <circle key={node.id} r={5} cy={150} cx={xScale(node.createdOn as unknown as number)} fill ="cornflowerblue" ></circle>;
    //         });
    //     }

    //     return null;
    // }, [endState, provGraph, trialName, xScale]);

    const children = useMemo(() =>{
        return <Stack ref={ref} style={{width: '100%'}} spacing={0}>
        {status === 'success' && participant ? <AllTasksTimeline selectedTask={selectedTask} setSelectedTask={setSelectedTask} participantData={participant} width={width} height={50}/> : null}
        {status === 'success' && participant ? <SingleTaskTimeline currentNode={currentNode} setCurrentNode={setCurrentNode} selectedTask={selectedTask} participantData={participant} width={width} height={200}/> : null}
        <Box style={{width: '100%'}}>
            {/* <WaveSurfer onMount={handleWSMount}>
                <WaveForm id="waveform"/>
            </WaveSurfer> */}
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
    }, [containerEl, currentNode, currentShownTranscription, handleWSMount, participant, ref, selectedTask, status, transcription, width]);

    return <div>
        {/* <div id="waveform"></div> */}
            {/* {children} */}
        {createPortal(<div>{children}</div>, containerEl)}
    </div>;
}
  