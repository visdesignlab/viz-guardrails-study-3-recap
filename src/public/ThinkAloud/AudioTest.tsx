/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Button, Center, Stack, Text,
} from '@mantine/core';
import {
  useState,
} from 'react';
import { StimulusParams } from '../../store/types';
import { BrushParams } from './types';

export function AudioTest({ parameters, setAnswer }: StimulusParams<BrushParams>) {
  const foundAudio = useState<boolean>(true);
  return (
    <Center style={{ height: '100%', width: '100%' }}>
      <Stack>
        <Text ta="center">
          Please allow us to access your microphone. There may be a popup in your browser window asking for access, click accept.
        </Text>
        <Text ta="center">
          Once we can confirm that your microphone is on and we pickup sound, the continue button will become available.
        </Text>
        <Text ta="center" weight={700}>
          If you are not comfortable or capable of speaking English during this study, please close it now.
        </Text>
        <Center><Button disabled={!foundAudio} style={{ width: '100px' }}>Continue</Button></Center>
      </Stack>
    </Center>
  );
}

export default AudioTest;
