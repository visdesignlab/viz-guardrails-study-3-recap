/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { Checkbox, Grid } from '@mantine/core';
import * as d3 from 'd3';
import { ChartParams } from './DataExplorer';
import { OwidDistinctLinesPalette } from './Color';

const margin = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
};

const height = 20;
const width = 60;

export function Sidebar({
    parameters,
    data,
    items,
    setSelection,
    trackSelection,
    range,
    guardrail
} : {
    parameters: ChartParams,
    data: any[],
    items: any[],
    setSelection: (value: Array<string>) => void,
    trackSelection: (value: Array<string>) => void,
    range: [Date, Date] | null,
    guardrail: string
}) {

    // ---------------------------- Setup ----------------------------

    const xScale = useMemo(() => {
        if (range) {
            return d3.scaleTime([margin.left, width + margin.left]).domain(range);
        }

        return d3.scaleTime([margin.left, width + margin.left]).domain([new Date(parameters.start_date), new Date(parameters.end_date)]);
    }, [parameters, range]);

    const yScale = useMemo(() => {
        const yData: number[] = data.filter((val) => items?.map((x) => x.name).includes(val[parameters.cat_var])).map((d) => +d[parameters.y_var]).filter((val) => val !== null) as number[];
        const [yMin, yMax] = d3.extent(yData) as [number, number];

        return d3.scaleLinear([height + margin.top, margin.top]).domain([yMin, yMax]).nice();
    }, [parameters, data, items]);

    const colorScale = useMemo(() => {
        const cats = Array.from(new Set(data.map((d) => d[parameters.cat_var])));
        return d3.scaleOrdinal(OwidDistinctLinesPalette).domain(cats);
    }, [parameters, data]);

    // ---------------------------- Draw ----------------------------

    const sparkLines = useMemo(() => {

        if (guardrail != 'juxt_data') {
            return null;
        }

        const lineGenerator = d3.line();
        lineGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d[parameters.x_var]) as Date));
        lineGenerator.y((d: any) => yScale(d[parameters.y_var]));
        lineGenerator.curve(d3.curveBasis);
        const paths = items?.map((x) => ({
            country: x.name as string,
            path: lineGenerator(data.filter((val) => (val[parameters.cat_var] == x.name))) as string
        }));

        return paths;

    }, [parameters, guardrail, data, items, xScale, yScale]);

    // ---------------------------- Render ----------------------------

    return (
            <Checkbox.Group
                key='chip_group'
                orientation='vertical'
                onChange={(xs) => {setSelection(xs); trackSelection(xs);}}
                spacing={0}
                offset='sm'
            >
                {items?.map((item) => {
                    return (
                        <Grid key={`${item.name}_grid`} grow gutter={8} columns={2}>
                        
                        <Grid.Col key={`${item.name}_grid1`} span={1}>
                        <Checkbox 
                            key={`${item.name}_checkbox`} 
                            value={item.name} 
                            label={item.name}
                            styles={(guardrail == 'juxt_data') ? { root: { display:'flex', alignItems: 'flex-end', padding:'2px 0' }} : {}}
                        >{item.name}</Checkbox>
                        </Grid.Col>

                        <Grid.Col key={`${item.name}_grid2`} span={guardrail == 'juxt_data' ? 'auto' : 3}>
                        <svg key={`${item.name}_sparksvg`} style={{ width: `${width}`, height: `${height}`}}>
                            <path 
                                id={`${item.name}_spark`}
                                key={`${item.name}_spark`}
                                fill='none'
                                stroke={colorScale(item.name)}
                                strokeWidth={0.75}
                                d={sparkLines?.filter((x) => x.country == item.name)[0].path} 
                            />
                        </svg>
                        </Grid.Col>

                        </Grid>
                    );
                })}
            </Checkbox.Group>
    );

}

export default Sidebar;