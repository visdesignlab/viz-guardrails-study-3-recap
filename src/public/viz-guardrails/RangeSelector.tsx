/* eslint-disable import/no-cycle */
import { RangeSlider } from '@mantine/core';
import * as d3 from 'd3';
import { ChartParams } from './DataExplorer';

export function RangeSelector({
  parameters,
  setRange,
  trackRange,
  range,
} : {
    parameters: ChartParams,
    setRange: (value: [Date, Date]) => void,
    trackRange: (value: [Date, Date]) => void,
    range: [Date, Date],
}) {
  function numToRange(v: number) {
    return d3.scaleTime([0, 100]).domain([new Date(range[0]), new Date(range[1])]).invert(v);
  }

  function numToRangeLabel(v: number) {
    const d = numToRange(v);
    return d3.utcFormat('%b %e, %Y')(d);
  }

  return (
    <RangeSlider
      defaultValue={[0, 100]}
      label={(x) => numToRangeLabel(x)}
      labelAlwaysOn
      disabled={!parameters.allow_time_slider}
      onChange={([min, max]) => { setRange([numToRange(min), numToRange(max)]); trackRange([numToRange(min), numToRange(max)]); }}
    />
  );
}

export default RangeSelector;
