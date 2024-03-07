import { Suspense, useEffect, useState } from 'react';
import merge from 'lodash.merge';
import { useParams } from 'react-router-dom';
import ResponseBlock from '../components/response/ResponseBlock';
import IframeController from './IframeController';
import ImageController from './ImageController';
import ReactComponentController from './ReactComponentController';
import MarkdownController from './MarkdownController';
import { useStudyConfig } from '../store/hooks/useStudyConfig';
import { useStoredAnswer } from '../store/hooks/useStoredAnswer';
import ReactMarkdownWrapper from '../components/ReactMarkdownWrapper';
import { isInheritedComponent } from '../parser/parser';
import { IndividualComponent } from '../parser/types';
import { disableBrowserBack } from '../utils/disableBrowserBack';
import { useStorageEngine } from '../store/storageEngineHooks';
import { useStoreActions, useStoreDispatch, useStoreSelector } from '../store/store';

// current active stimuli presented to the user
export default function ComponentController({ provState } : {provState?: unknown}) {
  // Get the config for the current step
  const studyConfig = useStudyConfig();
  const storage = useStorageEngine();

  const { trialName: currentStep } = useParams();

  const stepConfig = studyConfig.components[currentStep!];

  // If we have a trial, use that config to render the right component else use the step
  const status = useStoredAnswer();

  const currentConfig = isInheritedComponent(stepConfig) && studyConfig.baseComponents ? merge({}, studyConfig.baseComponents?.[stepConfig.baseComponent], stepConfig) as IndividualComponent : stepConfig as IndividualComponent;

  const instruction = (currentConfig.instruction || '');
  const { instructionLocation } = currentConfig;
  const instructionInSideBar = studyConfig.uiConfig.sidebar && (instructionLocation === 'sidebar' || instructionLocation === undefined);

  const [audioStream, setAudioStream] = useState<MediaRecorder | null>(null);
  const dispatch = useStoreDispatch();
  const { setIsRecording } = useStoreActions();

  const { trialName } = useParams();
  const [prevTrialName, setPrevTrialName] = useState<string | null>(null);

  useEffect(() => {
    if (!trialName || !studyConfig || !studyConfig.recordStudyAudio || !storage.storageEngine) {
      return;
    }

    if (audioStream && prevTrialName) {
      storage.storageEngine.saveAudio(audioStream, prevTrialName);
    }

    if (studyConfig.tasksToNotRecordAudio && studyConfig.tasksToNotRecordAudio.includes(trialName)) {
      setPrevTrialName(null);
      setAudioStream(null);
      dispatch(setIsRecording(false));
    } else {
      const _stream = navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      _stream.then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();

        setAudioStream(mediaRecorder);
        dispatch(setIsRecording(true));
      });
      setPrevTrialName(trialName);
    }

    // return () => {
    //   if (_stream) {
    //     _stream.then((data) => {
    //       data.getTracks().forEach((track) => track.stop());
    //     });
    //   }
    // };
  }, [trialName]);

  // Disable browser back button from all stimuli
  disableBrowserBack();

  // Check if we have issues connecting to the database, if so show alert modal
  const { storageEngine } = useStorageEngine();
  const storeDispatch = useStoreDispatch();
  const { setAlertModal } = useStoreActions();
  useEffect(() => {
    if (storageEngine?.getEngine() !== import.meta.env.VITE_STORAGE_ENGINE) {
      storeDispatch(setAlertModal({
        show: true,
        message: `There was an issue connecting to the ${import.meta.env.VITE_STORAGE_ENGINE} database. This could be caused by a network issue or your adblocker. If you are using an adblocker, please disable it for this website and refresh.`,
      }));
    }
  }, [setAlertModal, storageEngine, storeDispatch]);

  return (
    <>
      {instructionLocation === 'aboveStimulus' && <ReactMarkdownWrapper text={instruction} />}
      <ResponseBlock
        key={`${currentStep}-above-response-block`}
        status={status}
        config={currentConfig}
        location="aboveStimulus"
      />

      <Suspense key={`${currentStep}-stimulus`} fallback={<div>Loading...</div>}>
        {currentConfig.type === 'markdown' && <MarkdownController currentConfig={currentConfig} />}
        {currentConfig.type === 'website' && <IframeController currentConfig={currentConfig} />}
        {currentConfig.type === 'image' && <ImageController currentConfig={currentConfig} />}
        {currentConfig.type === 'react-component' && <ReactComponentController currentConfig={currentConfig} provState={provState} />}
      </Suspense>

      {(instructionLocation === 'belowStimulus' || (instructionLocation === undefined && !instructionInSideBar)) && <ReactMarkdownWrapper text={instruction} />}
      <ResponseBlock
        key={`${currentStep}-below-response-block`}
        status={status}
        config={currentConfig}
        location="belowStimulus"
      />
    </>
  );
}
