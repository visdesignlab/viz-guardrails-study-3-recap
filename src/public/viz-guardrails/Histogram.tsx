import { from, op, bin, escape } from 'arquero';
import { useMemo } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '@mantine/hooks';

const margin = {
    top: 60,
    left: 150,
    right: 80,
    bottom: 50
};

export function Histogram({
    data,
    selection
} : {
    data: unknown[];
    selection: string[]
}
) { 
    const [ref, {width, height}] = useResizeObserver();

    const allData = useMemo(() => {
        const tempData = data.map((d) => ({...d, value: +d.value}));
        return from(tempData);
    }, [data]);

    const selectedDataRange = useMemo(() => {
        return d3.extent(allData.filter(escape((d) => selection.includes(d.country_name))).array('value')) as [unknown, unknown] as [number, number];
    }, [allData, selection]);

    const histValues = useMemo(() => {
        return allData.orderby('value').groupby('value', { binStart: bin('value', { maxbins: 20, nice: true }), binEnd: bin('value', { maxbins: 20, nice: true, offset: 1 }) }).rollup({ count: op.count() }).groupby('binStart', 'binEnd').count(); 
    }, [allData]);

    const yScale = useMemo(() => {
        return d3.scaleLinear([margin.top, height - margin.bottom]).domain(d3.extent(allData.array('value') as number[]).reverse() as unknown as [number, number]).nice();
    }, [allData, height]);

    const xScale = useMemo(() => {
        return d3.scaleLinear([margin.left, width - margin.right]).domain(d3.extent(histValues.array('count')) as unknown as [number, number]);
    }, [histValues, width]);

    return(
        <svg ref={ref} style={{height: '400px', width: '280px', overflow: 'visible'}}> 
            {histValues.objects().map((hist: {binStart: number, binEnd: number, count: number}) => {
                return <rect y={yScale(hist.binEnd)} fill="lightgray" height={yScale(hist.binStart) - yScale(hist.binEnd)} width={xScale(hist.count)} x={width - margin.right - xScale(hist.count)}></rect>;
            })}
            {/* <YAxis yScale={yScale} horizontalPosition={275} xRange={[0, 0]}/> */}
            <line x1={260} x2={260} y1={margin.top} y2={height - margin.bottom} strokeWidth={1} stroke="black"></line>
            <rect y={yScale(selectedDataRange[1])} height={yScale(selectedDataRange[0]) - yScale(selectedDataRange[1])} x={252} width={16} opacity={0.2} fill="black"></rect>
            <text style={{fontSize: 10, dominantBaseline: 'middle', textAlign: 'center'}} x={255} y={margin.top - 5}>{yScale.domain()[0]}</text>
            <text style={{fontSize: 10, dominantBaseline: 'middle', textAlign: 'center'}} x={255} y={height - margin.bottom + 5}>{yScale.domain()[1]}</text>
            <g transform="translate(200, 0)">
                {data.map((d) => <rect opacity={.2} fill={'black'} x={0} width={50} y={yScale(d.value)} height={1}></rect>)}
            </g>
        </svg>
    );

}
