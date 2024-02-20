import { SegmentedControl, Text } from '@mantine/core';

export function Selector({
  guardrail,
  setGuardrail,
}: {
    guardrail: string;
    setGuardrail: (value: string) => void
}) {
  return (
    <>
      <Text>Guardrail:</Text>
      <SegmentedControl
        value={guardrail}
        onChange={setGuardrail}
        data={[
          { value: 'none', label: 'none' },
          { value: 'super_data', label: 'super_data' },
          { value: 'super_summ', label: 'super_summ' },
          { value: 'juxt_data', label: 'juxt_data' },
          { value: 'juxt_summ', label: 'juxt_summ' },
        ]}
      />
    </>
  );
}

export default Selector;
