/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as d3 from 'd3';
import { op, table } from 'arquero';
import { useMemo } from 'react';

export function kernelDensityEstimator(kernel: { (v: number): number; (v: number): number; (v: number): number; (arg0: number): number | null | undefined; }, X: unknown[]) {
  return function (V: Iterable<unknown>) {
    return X.map((x) => [
      x,
      d3.mean(V, (v) =>
      // @ts-ignore
        kernel(x - v)),
    ]);
  };
}
export function kernelEpanechnikov(k: number) {
  return function (v: number) {
    // eslint-disable-next-line no-return-assign, no-cond-assign
    return Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
  };
}

export function toSampleVariance(variance: number, len: number) {
  return (variance * len) / (len - 1);
}

export function silvermans(iqr: number, variance: number, len: number) {
  let s = Math.sqrt(toSampleVariance(variance, len));
  if (typeof iqr === 'number') {
    s = Math.min(s, iqr / 1.34);
  }
  return 1.06 * s * len ** -0.2;
}

/**
 * @param range
 * @param column
 * @returns xScale
 */
export function kdeCalc({ values, xScale, ticks }: { values: number[]; xScale: d3.ScaleLinear<number, number>; ticks: number }) {
  const silvermansInfo: { variance: number; q1: number; q3: number } = table({ values })
    .rollup({
      variance: op.variance('values'),
      q1: op.quantile('values', 0.25),
      q3: op.quantile('values', 0.75),
    })
    .objects()[0] as { variance: number; q1: number; q3: number };

  const kde = kernelDensityEstimator(
    kernelEpanechnikov(silvermans(silvermansInfo.q3 - silvermansInfo.q1, silvermansInfo.variance, values.length)),
    xScale.ticks(ticks),
  );

  return kde(values);
}
