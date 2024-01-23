/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Loader } from '@mantine/core';
import { StimulusParams } from '../../store/types';
import { useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Group, Stack, Paper } from '@mantine/core';
import LineChart from './LineChart';
import Sidebar from './Sidebar';
import RangeSelector from './RangeSelector';

export interface ChartParams { 
    dataset: string, 
    start_date: string,
    end_date: string,
    x_var: string, 
    y_var: string, 
    cat_var: string,
    guardrail: string }

export function DataExplorer({ parameters }: StimulusParams<ChartParams>) {

    ///////////// Loading data
    const [ data, setData ] = useState<any[] | null>(null);
    const [ selection, setSelection ] = useState<string[] | null>(null);
    const [ items, setItems ] = useState<any[] | null>(null);
    const [range, setRange] = useState<[Date, Date] | null>([new Date(parameters.start_date), new Date(parameters.end_date)]);

    useEffect(() => {
        d3.csv(`./data/${parameters.dataset}.csv`)
        .then((data) => {
            setData(data);
            setItems(Array.from(new Set(data.map((row) => row[parameters.cat_var]))));
            setSelection([]);
            console.log(range);
        });
    }, [parameters]);

    const filteredData = useMemo(() => {

        if (data && range) {
            return data
                .filter((val) => (new Date(val[parameters.x_var])).getTime() >= range[0].getTime())
                .filter((val) => (new Date(val[parameters.x_var])).getTime() <= range[1].getTime());
        }

        return null;
        
    }, [data, range]);

    return filteredData&&items&&range&&selection ? (
        <Group>
            <Paper shadow='sm' radius='md' p='md'>
                <Sidebar items={items} setSelection={setSelection} />
            </Paper>
            <Paper shadow='sm' radius='md' p='md'>
                <Stack align='center'>
                    <LineChart parameters={parameters} data={filteredData} selection={selection} range={range} />
                    <div style={{ width: '500px' }}><RangeSelector parameters={parameters} setRange={setRange} /></div>
                </Stack>
            </Paper>
        </Group>
    ) : <Loader/>;
}

export default DataExplorer;