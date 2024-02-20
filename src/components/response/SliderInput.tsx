import { Center, Group, Slider, SliderProps, Stack, Text } from '@mantine/core';
import { SliderResponse } from '../../parser/types';
import { generateErrorMessage } from './utils';

type inputProps = {
  response: SliderResponse;
  disabled: boolean;
  answer: object;
};

export default function SliderInput({
  response,
  disabled,
  answer,
}: inputProps) {
  const { prompt, options, leftLabel, rightLabel } = response;


  const errorMessage = generateErrorMessage(response, answer);
  console.log(answer);
  return (
    <Stack spacing={2}>
      <Text fz={'md'} fw={500}>
        {prompt}
      </Text>
      <Group noWrap style={{width: '100%'}}>
        {leftLabel ? <Center><Text>{leftLabel}</Text></Center> : null}
      <Slider
        disabled={disabled}
        // labelAlwaysOnx
        label={null}
        sx={{ marginTop: '15px', marginBottom: '15px', width: '400px' }}
        marks={options as SliderProps['marks']}
        {...answer}
        defaultValue={50}
        min={0}
        max={100}
        showLabelOnHover={false}
        styles={(theme) => ({
          markFilled: {
            borderColor: '#E9ECEF',
            backgroundColor: 'white'
          },
          bar: {
            backgroundColor: '#E9ECEF'
          },
          markLabel: {
            fontSize: theme.fontSizes.sm,
            marginBottom: 5,
            marginTop: 0,
          },
        })}
      />
        {rightLabel ? <Text>{rightLabel}</Text> : null}
      </Group>
      {errorMessage ? <Text size={12} c={'#fa5252'}>{errorMessage}</Text> : null}
    </Stack>
  );
}
