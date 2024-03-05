/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useResizeObserver } from '@mantine/hooks';
import { useMemo } from 'react';
import ColumnTable from 'arquero/dist/types/table/column-table';

import * as d3 from 'd3';
import { Loader } from '@mantine/core';
import { XAxisBar } from './XAxisBar';
import { YAxisBar } from './YAxisBar';
import { BrushParams } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any

const margin = {
  top: 15,
  left: 160,
  right: 50,
  bottom: 130,
};

export function Bar({
  barsTable, fullTable, parameters, data, setSelection,
} : {barsTable: ColumnTable | null, fullTable: ColumnTable | null, parameters: BrushParams, data: Record<string, string>[], setSelection: (selection: string[], e: React.MouseEvent) => void}) {
  const [ref, { height: originalHeight, width: originalWidth }] = useResizeObserver();

  const width = useMemo(() => originalWidth - margin.left - margin.right, [originalWidth]);

  const height = useMemo(() => originalHeight - margin.top - margin.bottom, [originalHeight]);

  const fullGroupedTable = useMemo(() => fullTable?.groupby(parameters.category).count(), []);

  const colorScale = useMemo(() => {
    const categories = Array.from(new Set(data.map((car) => car[parameters.category])));
    return d3.scaleOrdinal(d3.schemeTableau10).domain(categories);
  }, [data, parameters.category]);

  const xScale = useMemo(() => {
    if (!fullGroupedTable) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return d3.scaleLinear([margin.left, width + margin.left]).domain([0, d3.max(fullGroupedTable.objects().map((obj: any) => obj.count)) as any]).nice();
  }, [fullGroupedTable, width]);

  const yScale = useMemo(() => {
    if (!fullGroupedTable) {
      return null;
    }

    return d3.scaleBand([margin.top, height + margin.top]).domain(fullGroupedTable.array(parameters.category).sort()).paddingInner(0.1);
  }, [fullGroupedTable, height, parameters.category]);

  const rects = useMemo(() => {
    if (!xScale || !yScale || !colorScale || !barsTable) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (barsTable.objects() as any[]).map((car: any, i) => {
      if (car[parameters.category] === null || car.count === null) {
        return null;
      }

      return (
        <g key={i}>
          <rect onClick={(e) => setSelection(data.filter((d) => d[parameters.category] === car[parameters.category]).map((d) => d[parameters.ids]), e)} key={i} x={margin.left} y={yScale(car[parameters.category])} fill={colorScale(car[parameters.category])} height={yScale.bandwidth()} width={xScale(car.count) - margin.left} />
          <text x={xScale(car.count) + 5} y={yScale(car[parameters.category])! + (yScale.bandwidth() / 2)} style={{ textAlign: 'center', dominantBaseline: 'middle', fontSize: 14 }}>{car.count}</text>
        </g>
      );
    });
  }, [barsTable, colorScale, data, parameters.category, parameters.ids, setSelection, xScale, yScale]);

  const fullRects = useMemo(() => {
    if (!xScale || !yScale || !colorScale || !fullGroupedTable) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (fullGroupedTable.objects() as any[]).map((car: any, i) => {
      if (car[parameters.category] === null || car.count === null) {
        return null;
      }

      return (
        <g key={i}>
          <rect opacity={0.7} onClick={(e) => setSelection(data.filter((d) => d[parameters.category] === car[parameters.category]).map((d) => d[parameters.ids]), e)} key={i} x={margin.left} y={yScale(car[parameters.category])} fill="lightgray" height={yScale.bandwidth()} width={xScale(car.count) - margin.left} />
        </g>
      );
    });
  }, [colorScale, data, fullGroupedTable, parameters.category, parameters.ids, setSelection, xScale, yScale]);

  return yScale && xScale ? (
    <svg ref={ref} style={{ height: '500px', width: '530px', fontFamily: 'BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif' }}>
      <XAxisBar
        xScale={xScale}
        yRange={yScale.range() as [number, number]}
        vertPosition={height + margin.top}
        showLines={false}
        label="Count"
        ticks={xScale.ticks(5).map((value) => ({
          value: value.toString(),
          offset: xScale(value),
        }))}
      />

      {yScale ? (
        <YAxisBar
          yScale={yScale}
          horizontalPosition={margin.left}
          xRange={xScale.range() as [number, number]}
          label={parameters.category}
          ticks={colorScale.domain().map((country) => ({
            value: country,
            offset: yScale(country)! + yScale.bandwidth() / 2,
          }))}
        />
      ) : null }
      { fullRects }
      { rects }
    </svg>
  ) : <Loader />;
}

export default Bar;
