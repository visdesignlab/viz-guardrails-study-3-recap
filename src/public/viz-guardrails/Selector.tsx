/* eslint-disable @typescript-eslint/no-explicit-any */
import { SegmentedControl, Text } from '@mantine/core';

export function Selector({
  guardrail,
  setGuardrail,
  dataname,
  setDataname,
  setSelection,
}: {
    guardrail: string;
    setGuardrail: (value: string) => void;
    dataname: string;
    setDataname: (value: string) => void;
    setSelection: (value: Array<string>) => void;
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
      <Text>Guardrail:</Text>
      <SegmentedControl
        value={guardrail}
        onChange={(x) => { setGuardrail(x); }}
        data={[
          { value: 'none', label: 'None' },
          // { value: 'super_data', label: 'Sup. Data' },
          // { value: 'super_summ', label: 'Sup. Summ.' },
          // { value: 'juxt_data', label: 'Juxt. Data' },
          // { value: 'juxt_summ', label: 'Juxt. Summ.' },
          { value: 'super_data', label: 'Random' },
          { value: 'medianEnding', label: 'Median Ending' },
          { value: 'super_summ', label: 'Average' },
          { value: 'median', label: 'Median At Each Timestamp' },
          { value: 'medianClosest', label: 'Line Closest to Median' },
          { value: 'medianIQR', label: 'Median +-1.5IQR At Each Timestamp' },
          { value: 'medianIQRClosest', label: 'Median +-1.5IQR Closest' },
          { value: 'percentiles', label: 'Percentiles At Each Timestamp' },
          { value: 'cluster1', label: 'Statistical 4' },
          { value: 'cluster2', label: 'Statistical 5' },
        ]}
      />
    </>
  );
}

export default Selector;
