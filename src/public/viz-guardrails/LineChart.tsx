/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useResizeObserver } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Center, Text } from '@mantine/core';
import { XAxis } from './XAxis';
import { YAxis } from './YAxis';

const margin = {
    top: 15,
    left: 70,
    right: 100,
    bottom: 50
};

export function LineChart({ 
    data, 
    selection,
    range
} : {
    data: any[],
    selection: string[] | null,
    range: [Date, Date] | null
}) {

    // Handle hovering
    const [ hover, setHover ] = useState<string[] | null>(null);

    const shouldBeColor = ((country: string) => {
        if (!hover || hover.length == 0) {
            return true;
        } 
        return hover.includes(country);
    });

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

        const xData: number[] = data.filter((val) => selection?.includes(val['country'])).map((d) => +d['date']).filter((val) => val !== null) as number[];
        const [xMin, xMax] = d3.extent(xData) as [number, number];

        const yData: number[] = data.filter((val) => selection?.includes(val['country'])).map((d) => +d['value']).filter((val) => val !== null) as number[];
        const [yMin, yMax] = d3.extent(yData) as [number, number];


        return {
            xMin,
            xMax,
            yMin,
            yMax
        };

    }, [data, selection, range]);

    const xScale = useMemo(() => {
        //const range = xMax - xMin;
        // if (width <= 0) {
        //     return null;
        // }

        //if (params.dataType === 'date') {
        //    return d3.scaleTime([margin.left, width + margin.left]).domain([new Date('2014-12-20'), new Date('2016-01-10')]);
        //}

        if (range) {
            return d3.scaleTime([margin.left, width + margin.left]).domain(range);
        }
        
        return d3.scaleTime([margin.left, width + margin.left]).domain([new Date('2020-01-01'), new Date('2023-12-31')]);
        //return d3.scaleLinear([margin.left, width + margin.left]).domain([xMin, xMax]).nice();
    }, [width, xMax, xMin, range]);

    const yScale = useMemo(() => {
        //const range = yMax - yMin;

        // if (height <= 0) {
        //     return null;
        // }

        return d3.scaleLinear([height + margin.top, margin.top]).domain([yMin, yMax]).nice();
    }, [height, yMax, yMin]);

    const colorScale = useMemo(() => {
        const cats = Array.from(new Set(data.map((d) => d['country'])));
        return d3.scaleOrdinal(['#d34373',
            '#7cb643',
            '#c451ba',
            '#61bd84',
            '#7964cf',
            '#caa94a',
            '#6484c8',
            '#cf4734',
            '#48bcc6',
            '#cf7a36',
            '#d48cc9',
            '#457f44',
            '#9b4e80',
            '#837631',
            '#c56f63']).domain(cats);
    }, [data]);

    //////////// Draw
    const linePaths = useMemo(() => {

        if (!xScale || !yScale) {
            return;
        }

        const lineGenerator = d3.line();
        lineGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d['date']) as Date));
        lineGenerator.y((d: any) => yScale(d['value']));
        const paths = selection?.map((x) => ({ 
            country: x as string, 
            label_pos: data.filter((val) => val['country'] == x).slice(-1).map((val) => yScale(val['value']))[0] as number,
            path: lineGenerator(data.filter((val) => (val['country'] == x))) as string
        }));
        //console.log(range[0]);

        return paths;

    }, [data, xScale, yScale, selection, xMax]);

    return (
            selection?.length==0 ? (
                <Center ref={ref} style={{ width: '800px', height: '400px' }}>
                    <Text fs='italic' c='dimmed'>Select an item to view the chart.</Text>
                </Center>
            ) : (
            <svg id={'baseLineChart'} ref={ref} style={{ height: '400px', width: '800px', fontFamily: '"Helvetica Neue", "Helvetica", "Arial", sans-serif'}} >

                <svg style={{ width: `${width}` }}>
                {linePaths?.map((x) => {
                    return (
                        <g key={`${x.country}`}>
                        <path 
                            id={`${x.country}`} 
                            key={`${x.country}_key`} 
                            fill='none' 
                            stroke={shouldBeColor(x.country) ? colorScale(x.country) : 'gainsboro'} 
                            strokeWidth={hover?.includes(x.country) ? 1.5 : 1}
                            d={x.path} 
                        />
                        <foreignObject x={width+margin.left+5} y={x.label_pos} width={margin.left} height={20}>
                            <Text 
                                px={2} 
                                size={10} 
                                color={shouldBeColor(x.country) ? colorScale(x.country) : 'gainsboro'}
                                onMouseOver={(e) => {
                                    const t = e.target as HTMLElement;
                                    setHover([t.innerText]);
                                }}
                                onMouseOut={() => setHover([])}
                            >
                                {x.country}
                            </Text>
                        </foreignObject>
                        </g>
                    );
                })}
                </svg>

                <g id={'axes'}>
                    <XAxis
                        isDate={true}
                        xScale={xScale}
                        yRange={yScale.range() as [number, number]}
                        vertPosition={height + margin.top}
                        showLines={false}
                        ticks={xScale.ticks(5).map((value) => ({
                            value: value.toString(),
                            offset: xScale(value),
                        }))} />

                    <YAxis yScale={yScale} horizontalPosition={margin.left} xRange={xScale.range()} />
                </g>

            </svg>
            )
    );
}

export default LineChart;