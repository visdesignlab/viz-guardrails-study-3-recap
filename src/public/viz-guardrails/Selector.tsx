/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  NumberInput, Select, SegmentedControl, Switch, Text,
} from '@mantine/core';

export function Selector({
  guardrail,
  setGuardrail,
  dataname,
  setDataname,
  setSelection,
  setMetadataFiltered,
  numRandomSamples,
  setNumRandomSamples,
}: {
    guardrail: string;
    setGuardrail: (value: string) => void;
    dataname: string;
    setDataname: (value: string) => void;
    setSelection: (value: Array<string>) => void;
    setMetadataFiltered: (value: boolean) => void;
    numRandomSamples: number;
    setNumRandomSamples: (value: number) => void;
}) {
  return (
    <>
      <Text>Data:</Text>
      <SegmentedControl
        value={dataname}
        onChange={(x) => { setDataname(x); setSelection([]); }}
        data={[
          { value: 'clean_data', label: 'Viral' },
          { value: 'sp500_stocks', label: 'Stock' },
        ]}
      />
      <Text style={{ marginTop: '10px' }}>
        Guardrail:
      </Text>
      <Select
        value={guardrail}
        onChange={(x) => x && setGuardrail(x)}
        data={[
          { value: 'none', label: 'None' },
          { value: 'super_data', label: 'Random' },
          { value: 'super_summ', label: 'Average of All lines' },
          { value: 'median', label: 'Median of All Lines At Each Timestamp' },
          { value: 'medianClosest', label: 'Actual Stock Closest to Median' },
          { value: 'medianIQR', label: 'Median of All Lines +-1.5IQR At Each Timestamp' },
          { value: 'medianIQRClosest', label: 'Actual Median +-1.5IQR Closest' },
          { value: 'percentiles', label: 'Percentiles of All Lines At Each Timestamp' },
          { value: 'percentileClosest', label: 'Actual Percentiles Closest' },
          { value: 'cluster', label: 'Cluster Rep' },
          { value: 'all', label: 'All' },
        ]}
      />
      <Switch
        label="Metadata-based filtering"
        onChange={(event) => setMetadataFiltered(event.currentTarget.checked)}
        style={{ marginTop: '10px' }}
      />
      {guardrail === 'super_data' && (
        <NumberInput
          label="Number of Random samples"
          value={numRandomSamples}
          onChange={(val) => typeof val === 'number' && setNumRandomSamples(val)}
          min={1}
          max={5}
          step={1}
          style={{ marginTop: '10px' }}
        />
      )}

    </>
  );
}

export default Selector;
