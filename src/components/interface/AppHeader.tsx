import {
  ActionIcon,
  Button,
  Flex,
  Grid,
  Header,
  Image,
  Menu,
  Progress,
  Space,
  Title,
  Text,
  Group,
  Box,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconMail,
  IconMicrophone,
  IconSchema,
} from '@tabler/icons-react';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useHref } from 'react-router-dom';
import { WaveForm, WaveSurfer } from 'wavesurfer-react';
import WaveSurferRef from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record';
import { useCurrentStep, useStudyId } from '../../routes';
import { useStoreDispatch, useStoreSelector, useStoreActions } from '../../store/store';
import { useStorageEngine } from '../../store/storageEngineHooks';
import { PREFIX } from '../Prefix';

export default function AppHeader() {
  const { config: studyConfig, sequence: order } = useStoreSelector((state) => state);
  const storeDispatch = useStoreDispatch();
  const { toggleShowHelpText, toggleShowAdmin } = useStoreActions();
  const { storageEngine } = useStorageEngine();

  const isRecording = useStoreSelector((store) => store.isRecording);

  const currentStep = useCurrentStep();

  const progressBarCurrent = studyConfig !== null
    ? order.indexOf(currentStep)
    : 0;
  const progressBarMax = order.length - 1;
  const progressPercent = (progressBarCurrent / progressBarMax) * 100;

  const [menuOpened, setMenuOpened] = useState(false);

  const logoPath = studyConfig?.uiConfig.logoPath;
  const withProgressBar = studyConfig?.uiConfig.withProgressBar;

  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const admin = searchParams.get('admin') || 'f';

  const studyId = useStudyId();
  const studyHref = useHref(`/${studyId}`);
  function getNewParticipant() {
    storageEngine?.nextParticipant(studyConfig)
      .then(() => {
        window.location.href = studyHref;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  const wavesurferRef = useRef<WaveSurferRef | null>(null);

  const handleWSMount = useCallback(
    (waveSurfer: WaveSurferRef | null) => {
      wavesurferRef.current = waveSurfer;

      if (wavesurferRef.current) {
        const record = wavesurferRef.current.registerPlugin(RecordPlugin.create({ scrollingWaveform: true, renderRecordedAudio: false }));
        record.startRecording();
        wavesurferRef.current.setOptions({ height: 50, waveColor: '#FA5252' });
      }
    },
    [],
  );

  return (
    <Header height="70" p="md">
      <Grid mt={-7} align="center">
        <Grid.Col span={4}>
          <Group align="center" noWrap>
            <Image maw={40} src={`${PREFIX}${logoPath}`} alt="Study Logo" />
            <Space w="md" />
            <Title order={4}>{studyConfig?.studyMetadata.title}</Title>
            {isRecording ? (
              <Group spacing={20} noWrap>
                <Text color="red">Recording audio</Text>
                <Box style={{ width: '70px', height: '50px' }}>
                  <WaveSurfer onMount={handleWSMount}>
                    <WaveForm id="waveform" />
                  </WaveSurfer>
                </Box>
              </Group>
            ) : null}
          </Group>
        </Grid.Col>

        <Grid.Col span={4}>
          {withProgressBar && (
            <Progress radius="md" size="lg" value={progressPercent} />
          )}
        </Grid.Col>

        <Grid.Col span={4}>
          <Flex align="center" justify="flex-end">
            {studyConfig?.uiConfig.helpTextPath !== undefined && (
              <Button
                variant="outline"
                onClick={() => storeDispatch(toggleShowHelpText())}
              >
                Help
              </Button>
            )}

            <Space w="md" />

            {(import.meta.env.DEV || admin === 't') && (
              <Menu
                shadow="md"
                width={200}
                zIndex={1}
                opened={menuOpened}
                onChange={setMenuOpened}
              >
                <Menu.Target>
                  <ActionIcon size="lg">
                    <IconDotsVertical />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    icon={<IconSchema size={14} />}
                    onClick={() => storeDispatch(toggleShowAdmin())}
                  >
                    Admin Mode
                  </Menu.Item>

                  <Menu.Item
                    component="a"
                    href={
                      studyConfig !== null
                        ? `mailto:${studyConfig.uiConfig.contactEmail}`
                        : undefined
                    }
                    icon={<IconMail size={14} />}
                  >
                    Contact
                  </Menu.Item>

                  <Menu.Item
                    icon={<IconSchema size={14} />}
                    onClick={() => getNewParticipant()}
                  >
                    Next Participant
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Flex>
        </Grid.Col>
      </Grid>
    </Header>
  );
}
