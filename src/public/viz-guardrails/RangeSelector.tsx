import { RangeSlider } from '@mantine/core';
import * as d3 from 'd3';

export function RangeSelector({
    setRange
} : {
    setRange: (value: [Date, Date]) => void
}) {

    function numToRange(v: number) {
        return d3.scaleTime([0, 100]).domain([new Date('2020-01-01'), new Date('2023-12-31')]).invert(v);
    }

    function numToRangeLabel(v: number) {
        const d = numToRange(v);
        return d3.utcFormat('%b %e, %Y')(d);
    }

    return(
        <RangeSlider 
            defaultValue={[0, 100]} 
            label={numToRangeLabel}
            labelAlwaysOn
            onChange={([min, max]) => setRange([numToRange(min), numToRange(max) ])}
        />
    );

}

export default RangeSelector;