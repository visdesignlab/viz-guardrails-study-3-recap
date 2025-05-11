/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Select, SegmentedControl, Switch, Text,
} from '@mantine/core';

export function Selector({
  guardrail,
  setGuardrail,
  dataname,
  setDataname,
  setSelection,
  setMetadataFiltered,
}: {
    guardrail: string;
    setGuardrail: (value: string) => void;
    dataname: string;
    setDataname: (value: string) => void;
    setSelection: (value: Array<string>) => void;
    setMetadataFiltered: (value: boolean) => void;
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
          { value: 'medianEnding', label: 'Median At the Ending time' },
          { value: 'super_summ', label: 'Average of All lines' },
          { value: 'median', label: 'Median of All Lines At Each Timestamp' },
          { value: 'medianClosest', label: 'Actual Stock Closest to Median' },
          { value: 'medianIQR', label: 'Median of All Lines +-1.5IQR At Each Timestamp' },
          { value: 'medianIQRClosest', label: 'Actual Median +-1.5IQR Closest' },
          { value: 'percentiles', label: 'Percentiles of All Lines At Each Timestamp' },
          { value: 'percentileClosest', label: 'Actual Percentiles Closest' },
          { value: 'cluster', label: 'Cluster Rep' },
          { value: 'all', label: 'All' },
          // { value: 'metadata', label: 'Metadata Based Rep' },
        ]}
      />
      <Switch
        label="Metadata-based filtering"
        onChange={(event) => setMetadataFiltered(event.currentTarget.checked)}
        style={{ marginTop: '10px' }}
      />
    </>
  );
}

export default Selector;
