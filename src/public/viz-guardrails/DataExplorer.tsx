/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Loader } from '@mantine/core';
import { StimulusParams } from '../../store/types';
import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Group } from '@mantine/core';
import LineChart from './LineChart';
import Sidebar from './Sidebar';

export interface ChartParams { dataset: string, x: string, y: string, guardrail: string }

export function DataExplorer({ parameters }: StimulusParams<ChartParams>) {

    ///////////// Loading data
    const [ data, setData ] = useState<any[] | null>(null);
    const [ selection, setSelection ] = useState<string[] | null>(null);
    const [ items, setItems ] = useState<any[] | null>(null);

    useEffect(() => {
        d3.csv(`../data/${parameters.dataset}.csv`)
        .then((data) => {
            setData(data);
            setItems(Array.from(new Set(data.map((row) => row['country']))));
            setSelection([]);
        });
    }, [parameters]);

    return data&&items ? (
        <Group>
            <Sidebar items={items} setSelection={setSelection} />
            <LineChart data={data} selection={selection} />
        </Group>
    ) : <Loader/>;
}

export default DataExplorer;