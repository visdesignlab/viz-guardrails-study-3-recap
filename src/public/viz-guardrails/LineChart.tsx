/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useResizeObserver } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Center, Text } from '@mantine/core';
import { XAxis } from './XAxis';
import { YAxis } from './YAxis';
import { ChartParams } from './DataExplorer';
import { OwidDistinctLinesPalette } from './Color';

const margin = {
    top: 30,
    left: 30,
    right: 100,
    bottom: 50
};

export function LineChart({ 
    parameters,
    data, 
    items,
    selection,
    range,
    guardrail
} : {
    parameters: ChartParams,
    data: any[],
    items: any[],
    selection: any[] | null,
    range: [Date, Date] | null,
    guardrail: string
}) {

    // Handle hovering
    const [ hover, setHover ] = useState<string[] | null>(null);

    const shouldBeColor = ((country: string) => {
        if (!selection?.includes(country)) {
            return false;
        }
        if (!hover || hover.length == 0) {
            return true;
        } 
        return hover.includes(country);
    });

    // ---------------------------- Setup ----------------------------

    ///////////// Setting sizing
    const [ref, { height: originalHeight, width: originalWidth }] = useResizeObserver();

    const width = useMemo(() => {
        return originalWidth - margin.left - margin.right;
    }, [originalWidth]);

    const height = useMemo(() => {
        return originalHeight - margin.top - margin.bottom;
    }, [originalHeight]);

    ///////////// Setting scales
    const { xMin, yMin, xMax, yMax } = useMemo(() => {

        const xData: number[] = data.filter((val) => selection?.includes(val[parameters.cat_var])).map((d) => +d[parameters.x_var]).filter((val) => val !== null) as number[];
        const [xMin, xMax] = d3.extent(xData) as [number, number];

        const yData: number[] = data.filter((val) => selection?.includes(val[parameters.cat_var])).map((d) => +d[parameters.y_var]).filter((val) => val !== null) as number[];
        const [yMin, yMax] = d3.extent(yData) as [number, number];

        return {
            xMin,
            xMax,
            yMin,
            yMax
        };

    }, [data, selection, range]);

    const xScale = useMemo(() => {
        if (range) {
            return d3.scaleTime([margin.left, width + margin.left]).domain(range);
        }
        
        return d3.scaleTime([margin.left, width + margin.left]).domain([new Date(parameters.start_date), new Date(parameters.end_date)]);
    }, [width, xMax, xMin, range]);

    const yScale = useMemo(() => {
        return d3.scaleLinear([height + margin.top, margin.top]).domain([yMin, yMax]).nice();
    }, [height, yMax, yMin]);


    const colorScale = useMemo(() => {
        const cats = Array.from(new Set(data.map((d) => d[parameters.cat_var])));
        return d3.scaleOrdinal(OwidDistinctLinesPalette).domain(cats);
    }, [data]);

    // ---------------------------- Draw ----------------------------
    const linePaths = useMemo(() => {

        if (!xScale || !yScale) {
            return;
        }

        const lineGenerator = d3.line();
        lineGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d[parameters.x_var]) as Date));
        lineGenerator.y((d: any) => yScale(d[parameters.y_var]));
        lineGenerator.curve(d3.curveBasis);
        const paths = selection?.map((x) => ({ 
            country: x as string, 
            path: lineGenerator(data.filter((val) => (val[parameters.cat_var] == x))) as string
        }));

        return paths;

    }, [data, xScale, yScale, selection, xMax, guardrail]);

    const superimposeDatapoints = useMemo(() => {

        if(guardrail != 'super_data') {
            return null;
        }

        const selected_groups = items.filter((val) => selection?.includes(val.name)).map((val) => val.group);
        const controls_selection = items.filter((val) => selected_groups?.includes(val.group)).filter((val) => !selection?.includes(val.name)).map((val) => val.name);

        const lineGenerator = d3.line();
        lineGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d[parameters.x_var]) as Date));
        lineGenerator.y((d: any) => yScale(d[parameters.y_var]));
        lineGenerator.curve(d3.curveBasis);
        const paths = controls_selection?.map((x) => ({
            country: x as string,
            path: lineGenerator(data.filter((val) => (val[parameters.cat_var] == x))) as string
        }));

        return paths;

    }, [data, xScale, yScale, selection, xMax, guardrail]);

    const superimposeSummary = useMemo(() => {

        if (guardrail != 'super_summ') {
            return null;
        }

        const selected_groups = items.filter((val) => selection?.includes(val.name)).map((val) => val.group);
        const controls_data = data.filter((val) => selected_groups?.includes(val[parameters.group_var]));
        // controls_data group by date and group and average y_var:
        const avg_data = d3.rollup(
            controls_data, 
            (v) => ({
                mean: d3.mean(v, (d) => d[parameters.y_var]) as number,
                q95: d3.quantile(v, 0.95, (d) => d[parameters.y_var]) as number,
                q05: d3.quantile(v, 0.05, (d) => d[parameters.y_var]) as number
            }), 
            (d) => d[parameters.x_var]);
        const avg_data2 : any[] = [...avg_data].flatMap(([k, v]) => ({ date: k as string, mean: v.mean, q95: v.q95, q05: v.q05 }));
        console.log(avg_data2);

        // Mean line
        const lineGenerator = d3.line();
        lineGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d.date) as Date));
        lineGenerator.y((d: any) => yScale(d.mean));
        lineGenerator.curve(d3.curveBasis);
        const meanLine = lineGenerator(avg_data2) as string;
        
        // Confidence bands
        const areaGenerator = d3.area();
        areaGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d.date) as Date));
        areaGenerator.y0((d: any) => yScale(d.q05));
        areaGenerator.y1((d: any) => yScale(d.q95));
        //areaGenerator.curve(d3.curveBasis);
        const confidenceBands = areaGenerator(avg_data2) as string;

        return [meanLine, confidenceBands];

    }, [data, xScale, yScale, selection, xMax, guardrail]);

    const labelPos = useMemo(() => {

        const min_dist = 12;
        const labels = (guardrail == 'super_data') ? selection?.concat(superimposeDatapoints?.map((val) => val.country)) : selection;

        const pos = labels?.map((x) => ({
            country:   x as string,
            label_pos: data.filter((val) => val[parameters.cat_var] == x).slice(-1).map((val) => yScale(val[parameters.y_var]))[0] as number
        })).sort((a,b) => 
            a.label_pos < b.label_pos ? 1 : -1
        );

        if (!pos) {
            return pos;
        }

        for (let i=0; i < pos?.length; i++) {
            if (!pos[i-1]) {
                continue;
            }
            const diff = pos[i-1].label_pos - pos[i].label_pos;
            if (diff >= min_dist) {
                continue;
            }
            pos[i].label_pos = pos[i].label_pos - min_dist + diff ;
        }
    
        return pos;
            
    }, [data, selection, yScale, guardrail]);

    // ---------------------------- Render ----------------------------
    return (
            selection?.length==0 ? (
                <Center ref={ref} style={{ width: '800px', height: '400px' }}>
                    <Text fs='italic' c='dimmed'>Select an item to view the chart.</Text>
                </Center>
            ) : (
            <svg id={'baseLineChart'} ref={ref} style={{ height: '400px', width: '800px', fontFamily: '"Helvetica Neue", "Helvetica", "Arial", sans-serif'}} >

                <g id={'axes'}>
                    <XAxis
                        isDate={true}
                        xScale={xScale}
                        yRange={yScale.range() as [number, number]}
                        vertPosition={height + margin.top}
                        showLines={false}
                        ticks={xScale.ticks(6).map((value) => ({
                            value: value.toString(),
                            offset: xScale(value),
                        }))} />

                    <YAxis yScale={yScale} horizontalPosition={margin.left} xRange={xScale.range()} />
                </g>

                <svg key={'control_lines'} style={{ width: `${width}` }}>
                {superimposeDatapoints?.map((x) => {
                    return (
                        <g key={`${x.country}_g`}>
                            <path
                                id={`${x.country}`}
                                key={`${x.country}_key`}
                                fill='none'
                                stroke={shouldBeColor(x.country) ? colorScale(x.country) : 'gray'}
                                strokeDasharray={'4,1'}
                                strokeWidth={0.5}
                                d={x.path}
                            />
                        </g>
                    );
                })}
                </svg>

                <svg key={'control_bands'} style={{ width: `${width}` }}>
                    {superimposeSummary ? (
                        <g key={'summary_g'}>
                            <path
                                id={'confidenceBands'}
                                key={'confidenceBands_key'}
                                fill='lightgray'
                                opacity={0.25}
                                stroke='none'
                                d={superimposeSummary[1]}
                            />
                            <path
                                id={'meanLine'}
                                key={'meanLine_key'}
                                fill='none'
                                stroke='gray'
                                strokeDasharray={'4,1'}
                                strokeWidth={0.5}
                                d={superimposeSummary[0]}
                            />
                        </g>
                    ) : null}
                </svg>

                <svg key={'lines'} style={{ width: `${width}` }}>
                {linePaths?.map((x) => {
                    return (
                        <g key={`${x.country}_g`}>
                        <path 
                            id={`${x.country}`} 
                            key={`${x.country}_key`} 
                            fill='none' 
                            stroke={shouldBeColor(x.country) ? colorScale(x.country) : 'gainsboro'} 
                            strokeWidth={hover?.includes(x.country) ? 2 : 1.5}
                            d={x.path} 
                        />
                        </g>
                    );
                })}
                {labelPos?.map((x) => {
                    return (
                        <foreignObject key={`${x.country}_label`} x={width + margin.left + 5} y={x.label_pos-7} width={100} height={20}>
                            <Text
                                px={2}
                                size={10}
                                color={shouldBeColor(x.country) ? colorScale(x.country) : 'silver'}
                                onMouseOver={(e) => {
                                    const t = e.target as HTMLElement;
                                    if (!selection?.includes(t.innerText)) {
                                        return;
                                    }
                                    setHover([t.innerText]);
                                }}
                                onMouseOut={() => setHover([])}
                            >
                                {x.country}
                            </Text>
                        </foreignObject>
                    );
                })}
                </svg>

            </svg>
            )
    );
}

export default LineChart;