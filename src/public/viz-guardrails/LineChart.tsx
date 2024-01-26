/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useResizeObserver } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Center, Text } from '@mantine/core';
import { XAxis } from './XAxis';
import { YAxis } from './YAxis';
import { ChartParams } from './DataExplorer';

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
        
        return d3.scaleTime([margin.left, width + margin.left]).domain([new Date(parameters.start_date), new Date(parameters.end_date)]);
        //return d3.scaleLinear([margin.left, width + margin.left]).domain([xMin, xMax]).nice();
    }, [width, xMax, xMin, range]);

    const yScale = useMemo(() => {
        //const range = yMax - yMin;

        // if (height <= 0) {
        //     return null;
        // }

        return d3.scaleLinear([height + margin.top, margin.top]).domain([yMin, yMax]).nice();
    }, [height, yMax, yMin]);

    // Color scheme borrowed from OWID:
    // https://github.com/owid/owid-grapher/blob/master/packages/%40ourworldindata/grapher/src/color/CustomSchemes.ts
    const OwidDistinctColors: Record<string, string> = {
        Purple: '#6D3E91',
        DarkOrange: '#C05917',
        LightTeal: '#58AC8C',
        Blue: '#286BBB',
        Maroon: '#883039',
        Camel: '#BC8E5A',
        MidnightBlue: '#00295B',
        DustyCoral: '#C15065',
        DarkOliveGreen: '#18470F',
        DarkCopper: '#9A5129',
        Peach: '#E56E5A',
        Mauve: '#A2559C',
        Turquoise: '#38AABA',
        OliveGreen: '#578145',
        Cherry: '#970046',
        Teal: '#00847E',
        RustyOrange: '#B13507',
        Denim: '#4C6A9C',
        Fuchsia: '#CF0A66',
        TealishGreen: '#00875E',
        Copper: '#B16214',
        DarkMauve: '#8C4569',
        Lime: '#3B8E1D',
        Coral: '#D73C50',
    };

    const DarkerOwidDistinctColors: Record<string, string> = {
        DarkOrangeDarker: '#BE5915',
        PeachDarker: '#C4523E',
        LightTealDarker: '#2C8465',
        TurquoiseDarker: '#008291',
        CamelDarker: '#996D39',
        LimeDarker: '#338711',
    };

    const OwidDistinctLinesPalette = [
        OwidDistinctColors.DustyCoral,
        DarkerOwidDistinctColors.LightTealDarker,
        DarkerOwidDistinctColors.DarkOrangeDarker,
        OwidDistinctColors.Purple,
        OwidDistinctColors.Fuchsia,
        OwidDistinctColors.DarkOliveGreen,
        OwidDistinctColors.Blue,
        OwidDistinctColors.Maroon,
        DarkerOwidDistinctColors.CamelDarker,
        OwidDistinctColors.MidnightBlue,
        OwidDistinctColors.DarkCopper,
        DarkerOwidDistinctColors.PeachDarker,
        OwidDistinctColors.Mauve,
        DarkerOwidDistinctColors.TurquoiseDarker,
        OwidDistinctColors.OliveGreen,
        OwidDistinctColors.Cherry,
        OwidDistinctColors.Teal,
        OwidDistinctColors.RustyOrange,
        OwidDistinctColors.Denim,
        OwidDistinctColors.TealishGreen,
        OwidDistinctColors.Copper,
        OwidDistinctColors.DarkMauve,
        DarkerOwidDistinctColors.LimeDarker,
        OwidDistinctColors.Coral,
    ];

    const colorScale = useMemo(() => {
        const cats = Array.from(new Set(data.map((d) => d[parameters.cat_var])));
        return d3.scaleOrdinal(OwidDistinctLinesPalette).domain(cats);
    }, [data]);

    //////////// Draw
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