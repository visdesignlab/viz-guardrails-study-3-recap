/* eslint-disable @typescript-eslint/no-explicit-any */

import { useResizeObserver } from '@mantine/hooks';
import {
  useEffect, useMemo, useState,
} from 'react';
import ColumnTable from 'arquero/dist/types/table/column-table';
import * as d3 from 'd3';
import {
  ActionIcon,
  Button, Group, RangeSlider, SegmentedControl, Select, Slider, Stack, Text, Tooltip,
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { bin, table, from } from 'arquero';
import { XAxisBar } from './XAxisBar';
import { YAxis } from './YAxis';
import { Paintbrush } from './Paintbrush';
import { BrushNames, BrushParams, BrushState } from './types';
import { useEvent } from '../../store/hooks/useEvent';
import { YAxisBar } from './YAxisBar';

const margin = {
  top: 15,
  left: 100,
  right: 15,
  bottom: 130,
};

export function Histogram({
  setFilteredTable,
  brushState,
  setSelection,
  brushType,
  initialParams,
  data,
  brushedPoints,
  onClose,
  isPaintbrushSelect,
  dataTable,
}:
{
  brushedPoints: string[],
  data: any[],
  initialParams: BrushParams,
  setFilteredTable: (c: ColumnTable | null) => void,
  brushState: BrushState,
  setSelection: (sel: string[]) => void,
  brushType: BrushNames,
  onClose: (id: number) => void
  isPaintbrushSelect: boolean;
  dataTable: ColumnTable;
}) {
  const [ref, { height: originalHeight, width: originalWidth }] = useResizeObserver();

  const [params, setParams] = useState<BrushParams>(initialParams);

  const width = useMemo(() => originalWidth - margin.left - margin.right, [originalWidth]);

  const height = useMemo(() => originalHeight - margin.top - margin.bottom, [originalHeight]);

  const allDataTable = useMemo(() => {
    const binnedTable = dataTable.groupby(brushState.xCol, 'Survived').count();

    return binnedTable;
  }, [brushState.xCol, dataTable]);

  const barsTable = useMemo(() => {
    if (!data) {
      return null;
    }

    const tempTable = from(data);

    const binnedTable = tempTable.groupby(brushState.xCol, 'Survived').count();

    return binnedTable;
  }, [brushState.xCol, data]);

  const yScale = useMemo(() => {
    if (!allDataTable) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return d3.scaleLinear([margin.top, height + margin.top]).domain([0, d3.max(allDataTable.objects().map((obj: any) => obj.count)) as any].reverse()).nice();
  }, [allDataTable, height]);

  const xScale = useMemo(() => {
    if (!allDataTable) {
      return null;
    }

    return d3.scaleBand([margin.left, width + margin.left]).domain(allDataTable.array(brushState.xCol).sort()).paddingInner(0.1);
  }, [allDataTable, width, brushState.xCol]);

  const rects = useMemo(() => {
    if (!xScale || !yScale || !barsTable) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (barsTable.objects() as any[]).map((bar: any, i) => (
      <g key={`${i}fullRects`}>
        <rect onClick={() => setSelection(dataTable.objects().filter((d) => d[brushState.xCol] === bar[brushState.xCol] && d.Survived === bar.Survived).map((d) => d.Name))} x={bar.Survived === 'Yes' ? xScale(bar[brushState.xCol]) : xScale(bar[brushState.xCol])! + (xScale.bandwidth() / 2)} y={height - (height - yScale(bar.count))} fill={bar.Survived === 'Yes' ? '#f28e2c' : '#4e79a7'} width={xScale.bandwidth() / 2} height={margin.top + height - yScale(bar.count)} />
        <text x={xScale(bar[brushState.xCol])! + (bar.Survived === 'Yes' ? xScale.bandwidth() / 4 : xScale.bandwidth() * 0.75)} y={yScale(bar.count) - 10} style={{ textAnchor: 'middle', dominantBaseline: 'middle', fontSize: 14 }}>{bar.count}</text>
      </g>
    ));
  }, [barsTable, brushState.xCol, dataTable, height, setSelection, xScale, yScale]);

  const survivedRects = useMemo(() => {
    if (!xScale || !yScale || !allDataTable) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (allDataTable.objects() as any[]).map((bar: any, i) => (
      <g key={`${i}survRects`}>
        <rect onClick={() => setSelection(dataTable.objects().filter((d) => d[brushState.xCol] === bar[brushState.xCol] && d.Survived === bar.Survived).map((d) => d.Name))} opacity={0.7} x={bar.Survived === 'Yes' ? xScale(bar[brushState.xCol]) : xScale(bar[brushState.xCol])! + (xScale.bandwidth() / 2)} fill="lightgray" width={xScale.bandwidth() / 2} y={height - (height - yScale(bar.count))} height={margin.top + height - yScale(bar.count)} />
        {/* <text x={xScale(bar[brushState.xCol]) + xScale.bandwidth() / 2} y={yScale(bar.count)!} style={{ textAlign: 'center', dominantBaseline: 'middle', fontSize: 14 }}>{bar.count}</text> */}
      </g>
    ));
  }, [allDataTable, brushState.xCol, dataTable, height, setSelection, xScale, yScale]);

  return yScale && xScale && barsTable ? (
    <Stack spacing={0}>
      <Group mr={margin.right} style={{ justifyContent: 'space-between' }}>

        <ActionIcon variant="light" onClick={() => onClose(brushState.id)}><IconX /></ActionIcon>
      </Group>
      <svg id="scatterSvgBrushStudy" ref={ref} style={{ height: '500px', width: params.brushType === 'Axis Selection' ? '800px' : '530px', fontFamily: 'BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif' }}>
        <XAxisBar
          xScale={xScale}
          yRange={yScale.range() as [number, number]}
          vertPosition={height + margin.top}
          showLines={false}
          stringTicks
          label={brushState.xCol}
          ticks={[...new Set(barsTable.array(brushState.xCol) as string[])].map((country: string) => ({
            value: country,
            offset: xScale(country)! + xScale.bandwidth() / 2,
          }))}
        />

        {yScale ? (
          <YAxisBar
            label="Count"
            yScale={yScale}
            horizontalPosition={margin.left}
            xRange={xScale.range() as [number, number]}
            ticks={yScale.ticks(5).map((value) => ({
              value: value.toString(),
              offset: yScale(value),
            }))}
          />
        ) : null }
        { survivedRects }
        { rects }
      </svg>
    </Stack>
  ) : null;
}
