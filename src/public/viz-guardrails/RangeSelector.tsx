import { RangeSlider } from '@mantine/core';
import * as d3 from 'd3';
import { ChartParams } from './DataExplorer';

export function RangeSelector({
    parameters,
    setRange
} : {
    parameters: ChartParams;
    setRange: (value: [Date, Date]) => void
}) {

    function numToRange(v: number) {
        return d3.scaleTime([0, 100]).domain([new Date(parameters.start_date), new Date(parameters.end_date)]).invert(v);
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