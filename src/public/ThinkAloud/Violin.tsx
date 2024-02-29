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
import {
  bin, table, from, op,
} from 'arquero';
import { XAxisBar } from './XAxisBar';
import { YAxis } from './YAxis';
import { Paintbrush } from './Paintbrush';
import { BrushNames, BrushParams, BrushState } from './types';
import { useEvent } from '../../store/hooks/useEvent';
import { YAxisBar } from './YAxisBar';
import {
  kdeCalc, kernelDensityEstimator, kernelEpanechnikov, silvermans,
} from './useKdeCalc';

const margin = {
  top: 15,
  left: 100,
  right: 15,
  bottom: 130,
};

function toSampleVariance(variance: number, len: number) {
  return (variance * len) / (len - 1);
}
/**
 *
 * The ["normal reference distribution"
 * rule-of-thumb](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/bandwidth.nrd.html),
 * a commonly used version of [Silverman's
 * rule-of-thumb](https://en.wikipedia.org/wiki/Kernel_density_estimation#A_rule-of-thumb_bandwidth_estimator).
 */
function nrd(iqr: number, variance: number, len: number) {
  let s = Math.sqrt(toSampleVariance(variance, len));
  if (typeof iqr === 'number') {
    s = Math.min(s, iqr / 1.34);
  }
  return 1.06 * s * len ** -0.2;
}

export function Violin({
  setFilteredTable,
  brushState,
  setBrushedSpace,
  brushType,
  initialParams,
  data,
  brushedPoints,
  onClose,
  isPaintbrushSelect,
}:
{
  brushedPoints: string[],
  data: any[],
  initialParams: BrushParams,
  setFilteredTable: (c: ColumnTable | null) => void,
  brushState: BrushState,
  setBrushedSpace: (brush: [[number | null, number | null], [number | null, number | null]], xScale: any, yScale: any, selType: 'drag' | 'handle' | 'clear' | null, id: number, ids?: string[]) => void,
  brushType: BrushNames,
  onClose: (id: number) => void
  isPaintbrushSelect: boolean;
}) {
  const [ref, { height: originalHeight, width: originalWidth }] = useResizeObserver();

  const [params, setParams] = useState<BrushParams>(initialParams);

  const width = useMemo(() => originalWidth - margin.left - margin.right, [originalWidth]);

  const height = useMemo(() => originalHeight - margin.top - margin.bottom, [originalHeight]);

  const yScale = useMemo(
    () => d3.scaleLinear([margin.top, height + margin.top]).domain([0, d3.max(data.map((obj: any) => +obj[brushState.yCol])) as any].reverse()).nice(),
    [brushState.yCol, data, height],
  );

  const xScale = useMemo(() => d3.scaleBand([margin.left, width + margin.left]).domain([...new Set(data.map((d) => d[brushState.xCol].toString()))].sort()).paddingInner(0.01), [width, brushState.xCol]);

  const paths = useMemo(() => {
    if (!xScale) {
      return null;
    }

    const survivedDensities = xScale.domain().map((cat) => {
      const catSurvived = data.filter((d) => d[brushState.xCol] === cat && d.Survived === 'Yes');
      const silvermansInfo: { variance: number; q1: number; q3: number } = table({ values: catSurvived.map((d) => d[brushState.yCol]) })
        .rollup({
          variance: op.variance('values'),
          q1: op.quantile('values', 0.25),
          q3: op.quantile('values', 0.75),
        })
        .objects()[0] as { variance: number; q1: number; q3: number };

      const kde = kernelDensityEstimator(
        kernelEpanechnikov(silvermans(silvermansInfo.q3 - silvermansInfo.q1, silvermansInfo.variance, catSurvived.length)),
        yScale.ticks(25),
      );

      const density: number[][] = kde(catSurvived.map((d) => d[brushState.yCol])) as number[][];

      const widthScale = d3.scaleLinear([0, xScale.bandwidth() / 2]).domain([0, d3.max(density.map((d) => Math.abs(d[1]))) || 1]);

      const line = d3.line((d) => widthScale(d[1]) + xScale.bandwidth() / 2, (d) => yScale(d[0])).curve(d3.curveBasis);

      return {
        density, cat, length: catSurvived.length, line,
      };
    });

    const deadDensities = xScale.domain().map((cat) => {
      const catDied = data.filter((d) => d[brushState.xCol] === cat && d.Survived === 'No');

      const silvermansInfo: { variance: number; q1: number; q3: number } = table({ values: catDied.map((d) => d[brushState.yCol]) })
        .rollup({
          variance: op.variance('values'),
          q1: op.quantile('values', 0.25),
          q3: op.quantile('values', 0.75),
        })
        .objects()[0] as { variance: number; q1: number; q3: number };

      const kde = kernelDensityEstimator(
        kernelEpanechnikov(silvermans(silvermansInfo.q3 - silvermansInfo.q1, silvermansInfo.variance, catDied.length)),
        yScale.ticks(25),
      );

      const density: number[][] = kde(catDied.map((d) => d[brushState.yCol])) as number [][];

      const widthScale = d3.scaleLinear([0, xScale.bandwidth() / 2]).domain([0, d3.max(density.map((d) => Math.abs(d[1]))) || 1]);

      const line = d3.line((d) => xScale.bandwidth() / 2 - widthScale(d[1]), (d) => yScale(d[0])).curve(d3.curveBasis);

      return {
        density, cat, length: catDied.length, line,
      };
    });

    const combinedDensities = [...survivedDensities, ...deadDensities];

    const maxLength = d3.max(combinedDensities.map((d) => d.length)) || 1;

    const survivedPaths = survivedDensities.map((density, i) => <path key={i} transform={`translate(${xScale(density.cat)}, 0)`} d={`${density.line(density.density.map((d) => [d[0], d[1] * (density.length / maxLength)]))}L${xScale.bandwidth() / 2},${yScale.range()[1]}L${xScale.bandwidth() / 2},${yScale.range()[0]}Z` || ''} stroke="none" fill="#f28e2c" />);
    const deadPaths = deadDensities.map((density, i) => <path key={i} transform={`translate(${xScale(density.cat)}, 0)`} d={`${density.line(density.density.map((d) => [d[0], d[1] * (density.length / maxLength)]))}L${xScale.bandwidth() / 2},${yScale.range()[1]}L${xScale.bandwidth() / 2},${yScale.range()[0]}Z` || ''} stroke="none" fill="#4e79a7" />);

    return [...survivedPaths, ...deadPaths];
  }, [brushState.xCol, brushState.yCol, data, xScale, yScale]);

  return (
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
          ticks={xScale.domain().map((country: string) => ({
            value: country,
            offset: xScale(country)! + xScale.bandwidth() / 2,
          }))}
        />

        {yScale ? (
          <YAxisBar
            label={brushState.yCol}
            yScale={yScale}
            horizontalPosition={margin.left}
            xRange={xScale.range() as [number, number]}
            ticks={yScale.ticks(5).map((value) => ({
              value: value.toString(),
              offset: yScale(value),
            }))}
          />
        ) : null }
        {paths}
        {/* { rects }
        { survivedRects } */}
      </svg>
    </Stack>
  );
}
