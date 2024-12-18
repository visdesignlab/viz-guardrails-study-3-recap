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
          { value: 'median', label: 'Statistical 1' },
          { value: 'cluster', label: 'Statistical 2' },
        ]}
      />
    </>
  );
}

export default Selector;
