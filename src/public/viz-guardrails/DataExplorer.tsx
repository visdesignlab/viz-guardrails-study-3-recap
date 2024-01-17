/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Loader } from '@mantine/core';
import { StimulusParams } from '../../store/types';
import { useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Group, Stack } from '@mantine/core';
import LineChart from './LineChart';
import Sidebar from './Sidebar';
import RangeSelector from './RangeSelector';

export interface ChartParams { dataset: string, x: string, y: string, guardrail: string }

export function DataExplorer({ parameters }: StimulusParams<ChartParams>) {

    ///////////// Loading data
    const [ data, setData ] = useState<any[] | null>(null);
    const [ selection, setSelection ] = useState<string[] | null>(null);
    const [ items, setItems ] = useState<any[] | null>(null);
    const [range, setRange] = useState<[Date, Date]>([new Date('2020-01-01'), new Date('2023-12-31')]);

    useEffect(() => {
        d3.csv(`../data/${parameters.dataset}.csv`)
        .then((data) => {
            setData(data);
            setItems(Array.from(new Set(data.map((row) => row['country']))));
            setSelection([]);
        });
    }, [parameters]);

    const filteredData = useMemo(() => {

        if (data && range) {
            return data
                .filter((val) => (new Date(val['date'])).getTime() >= range[0].getTime())
                .filter((val) => (new Date(val['date'])).getTime() <= range[1].getTime());
        }
        return data;
        
    }, [data, selection, range]);

    return filteredData&&items ? (
        <Group>
            <Sidebar items={items} setSelection={setSelection} />
            <Stack align='center'>
                <LineChart data={filteredData} selection={selection} range={range} />
                <div style={{ width: '600px'}}>
                    <RangeSelector setRange={setRange} />
                </div>
            </Stack>
        </Group>
    ) : <Loader/>;
}

export default DataExplorer;