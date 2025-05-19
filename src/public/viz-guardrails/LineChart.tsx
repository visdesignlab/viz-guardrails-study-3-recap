/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-shadow */
/* eslint-disable consistent-return */
/* eslint-disable no-continue */
/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Center, Text } from '@mantine/core';
import { XAxis } from './XAxis';
import { YAxis } from './YAxis';
import { ChartParams } from './DataExplorer';
import { OwidDistinctLinesPalette } from './Color';

const margin = {
  top: 30,
  left: 40,
  right: 80,
  bottom: 50,
};

export function LineChart({
  parameters,
  data,
  dataname,
  items,
  selection,
  range,
  guardrail,
  metadataFiltered,
}: {
  parameters: ChartParams,
  data: any[],
  dataname: string
  items: any[],
  selection: any[] | null,
  range: [Date, Date] | null,
  guardrail: string,
  metadataFiltered: boolean,
}) {
  // Handle hovering
  const [hover, setHover] = useState<string[] | null>(null);

  const shouldBeColor = ((country: string) => {
    if (!selection?.includes(country)) {
      return false;
    }
    if (!hover || hover.length === 0) {
      return true;
    }
    return hover.includes(country);
  });

  // ---------------------------- Compute controls ----------------------------

  const controlsSelection = useMemo(() => {
    const selected_groups = items.filter((val) => selection?.includes(val.name)).map((val) => val.group);
    const controls_selection = items.filter((val) => selected_groups?.includes(val.group)).filter((val) => !selection?.includes(val.name)).map((val) => val.name);
    return controls_selection;
  }, [selection, items, dataname]);

  const avgData = useMemo(() => {
    const selected_groups = items.map((val) => val.group);// .filter((val) => selection?.includes(val.name)).map((val) => val.group);
    const controls_data = data.filter((val) => selected_groups?.includes(val[parameters.group_var]));
    // Current control data: all study data from all regions
    const avg_data = d3.rollup(
      controls_data,
      (v) => ({
        mean: d3.mean(v, (d) => d[parameters.y_var]) as number,
        // mean: d3.quantile(v, 0.5, (d) => d[parameters.y_var]) as number,
        upperq: d3.quantile(v, 0.75, (d) => d[parameters.y_var]) as number,
        lowerq: d3.quantile(v, 0.25, (d) => d[parameters.y_var]) as number,
      }),
      (d) => d[parameters.x_var],
    );
    const avg_data2: any[] = [...avg_data].flatMap(([k, v]) => ({
      date: k as string, mean: v.mean, upperq: v.upperq, lowerq: v.lowerq,
    }));
    return avg_data2;
  }, [data, items, parameters, dataname]);

  // ---------------------------- Setup ----------------------------

  /// ////////// Setting sizing
  const width = (dataname === 'clean_data' ? 800 - margin.left - margin.right - 60 : 800 - margin.left - margin.right);

  const height = 400 - margin.top - margin.bottom;

  /// ////////// Setting scales
  const allCountries = useMemo(() => Array.from(new Set(data.map((val) => val[parameters.cat_var]))), [data, parameters.cat_var]);

  const [randomCountries, setRandomCountries] = useState<string[]>([]);
  const [randomSelectedFlag, setRandomSelectedFlag] = useState(false);

  useEffect(() => {
    if (guardrail === 'super_data' && !randomSelectedFlag) {
      const unselectedCountries = allCountries.filter(
        (country) => !(selection || []).includes(country),
      );

      setRandomCountries(d3.shuffle(unselectedCountries).slice(0, 2));
      setRandomSelectedFlag(true);
    }

    if (guardrail !== 'super_data') {
      setRandomCountries([]);
      setRandomSelectedFlag(false);
    }
  }, [guardrail, selection, allCountries]);

  // ---------------------------- Median +- 1.5 IQR ---------------------------- //
  const medianIQRData = useMemo(() => {
    if (guardrail !== 'medianIQR') {
      return null;
    }

    const groupedData = d3.group(data, (d) => d[parameters.x_var]);

    const medianIQR = Array.from(groupedData, ([date, values]) => {
      const metricValues = values.map((d) => d[parameters.y_var]).filter((v): v is number => v !== null && v !== undefined);

      if (metricValues.length === 0) return null;

      const medianValue = d3.median(metricValues) ?? 0;
      const q1 = d3.quantile(metricValues, 0.25) ?? medianValue;
      const q3 = d3.quantile(metricValues, 0.75) ?? medianValue;

      const iqr = q3 - q1;
      const upperBound = medianValue + 1.5 * iqr;
      const lowerBound = medianValue - 1.5 * iqr;

      return {
        [parameters.x_var]: date,
        median: medianValue,
        upper: upperBound,
        lower: lowerBound,
      };
    }).filter((d) => d !== null);

    return medianIQR;
  }, [data, parameters, guardrail]);

  // ---------------------------- 75th and 25th percentiles ---------------------------- //
  const percentileData = useMemo(() => {
    if (guardrail !== 'percentiles') {
      return null;
    }

    const groupedData = d3.group(data, (d) => d[parameters.x_var]);

    const medianIQR = Array.from(groupedData, ([date, values]) => {
      const metricValues = values.map((d) => d[parameters.y_var]).filter((v): v is number => v !== null && v !== undefined);

      if (metricValues.length === 0) return null;

      const medianValue = d3.median(metricValues) ?? 0;
      const q1 = d3.quantile(metricValues, 0.25) ?? medianValue;
      const q3 = d3.quantile(metricValues, 0.75) ?? medianValue;

      return {
        [parameters.x_var]: date,
        median: medianValue,
        upper: q3,
        lower: q1,
      };
    }).filter((d) => d !== null);

    return medianIQR;
  }, [data, parameters, guardrail]);

  const {
    yMin, yMax,
  } = useMemo(() => {
    const selectedYValues = (() => {
      if (guardrail === 'all') {
        return data.map((d) => +d[parameters.y_var]).filter((val) => val !== null) as number[];
      }

      if (guardrail === 'super_data') {
        const names = new Set([...(selection || []), ...randomCountries]);
        return data
          .filter((d) => names.has(d[parameters.cat_var]))
          .map((d) => +d[parameters.y_var])
          .filter((val) => val !== null) as number[];
      }

      return data
        .filter((val) => selection?.includes(val[parameters.cat_var]))
        .map((d) => +d[parameters.y_var])
        .filter((val) => val !== null) as number[];
    })();

    let iqrValues: number[] = [];
    if (guardrail === 'medianIQR' && medianIQRData) {
      iqrValues = medianIQRData.flatMap((d) => [d.median, d.upper, d.lower]);
    }

    if (guardrail === 'percentiles' && percentileData) {
      iqrValues = percentileData.flatMap((d) => [d.median, d.upper, d.lower]);
    }

    const allYValues = [...selectedYValues, ...iqrValues];

    const [computedYMin, computedYMax] = d3.extent(allYValues) as [number, number];

    const buffer = (computedYMax - computedYMin) * 0.1;

    return {
      yMin: computedYMin - buffer,
      yMax: computedYMax + buffer,
    };
  }, [data, selection, medianIQRData, parameters, guardrail]);
  const xScale = useMemo(() => {
    if (range) {
      return d3.scaleTime([margin.left, width + margin.left]).domain(range);
    }

    return d3.scaleTime([margin.left, width + margin.left]).domain([new Date(parameters.start_date), new Date(parameters.end_date)]);
  }, [width, range, parameters, dataname]);

  const yScale = useMemo(() => {
    const scale = d3.scaleLinear([height + margin.top, margin.top]);
    if (guardrail === 'medianIQRClosest') {
      scale.domain([-100, 100]); // fixed
    } else {
      scale.domain([yMin, yMax]).nice(); // dynamic
    }
    return scale;
  }, [height, yMax, yMin, dataname, guardrail]);

  const colorScale = useMemo(() => {
    const cats = Array.from(new Set(data.map((d) => d[parameters.cat_var])));
    return d3.scaleOrdinal(OwidDistinctLinesPalette).domain(cats);
  }, [data, parameters, dataname]);

  // ---------------------------- Median at each point ---------------------------- //
  const medianCountryData = useMemo(() => {
    if (guardrail !== 'median') {
      return null;
    }

    const groupedData = d3.group(data, (d) => d[parameters.x_var]);

    const medianCountry = Array.from(groupedData, ([date, values]) => {
      const metricValues = values.map((d) => d[parameters.y_var]).filter((v) => v !== null);
      const medianValue = d3.median(metricValues);

      return {
        [parameters.x_var]: date,
        [parameters.y_var]: medianValue,
      };
    });

    return medianCountry;
  }, [data, parameters, guardrail]);

  const medianLinePath = useMemo(() => {
    if (!medianCountryData || guardrail !== 'median') {
      return null;
    }

    const lineGenerator = d3.line()
      .x((d: [number, number]) => xScale(d[0]))
      .y((d: [number, number]) => yScale(d[1]))
      .curve(d3.curveBasis);

    const processedData = medianCountryData
      .map((d) => {
        const parsedDate = d3.timeParse('%Y-%m-%d')(d[parameters.x_var]);
        if (!parsedDate || d[parameters.y_var] === undefined) return null;
        return [parsedDate.getTime(), d[parameters.y_var]] as [number, number];
      })
      .filter((d): d is [number, number] => d !== null);

    return {
      path: lineGenerator(processedData) as string,
      labelPosition: medianCountryData[medianCountryData.length - 1],
    };
  }, [medianCountryData, xScale, yScale, parameters, guardrail]);

  // ---------------------------- Closest Median Line  ----------------------------
  const medianLineClosest = useMemo(() => {
    if (guardrail !== 'medianClosest') return null;

    const groupedByDate = d3.group(data, (d) => d[parameters.x_var]);
    const medianMap = new Map<string, number>();

    groupedByDate.forEach((entries, date) => {
      const values = entries.map((d) => d[parameters.y_var]).filter((v): v is number => v !== null && v !== undefined);
      const median = d3.median(values);
      if (median !== undefined) {
        medianMap.set(date, median);
      }
    });

    const groupedByCountry = d3.group(data, (d) => d[parameters.cat_var]);

    let minDistance = Infinity;
    let closestData: any[] = [];

    groupedByCountry.forEach((entries, country) => {
      let totalDistance = 0;
      let count = 0;

      for (const entry of entries) {
        const date = entry[parameters.x_var];
        const val = entry[parameters.y_var];
        const medianVal = medianMap.get(date);

        if (val == null || medianVal == null) continue;

        const diff = val - medianVal;
        totalDistance += diff * diff;
        count += 1;
      }

      const avgDistance = totalDistance / (count || 1);

      if (avgDistance < minDistance) {
        minDistance = avgDistance;
        closestData = entries;
      }
    });

    if (!closestData || closestData.length === 0) return null;

    const lineGenerator = d3.line()
      .x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d[parameters.x_var]) as Date))
      .y((d: any) => yScale(d[parameters.y_var]))
      .curve(d3.curveBasis);

    return {
      path: lineGenerator(closestData) as string,
      labelPosition: closestData[closestData.length - 1],
    };
  }, [data, parameters, guardrail, xScale, yScale]);

  // ---------------------------- Median IQR closest ----------------------------
  const medianIQRClosestPaths = useMemo(() => {
    if (guardrail !== 'medianIQRClosest') return null;

    const groupedByDate = d3.group(data, (d) => d[parameters.x_var]);
    const groupedByCountry = d3.group(data, (d) => d[parameters.cat_var]);

    const boundsMap = new Map<string, { median: number, upper: number, lower: number }>();

    groupedByDate.forEach((entries, date) => {
      const values = entries.map((d) => d[parameters.y_var]).filter((v): v is number => v != null);
      const median = d3.median(values) ?? 0;
      const q1 = d3.quantile(values, 0.25) ?? median;
      const q3 = d3.quantile(values, 0.75) ?? median;
      const iqr = q3 - q1;

      boundsMap.set(date, {
        median,
        upper: median + 1.5 * iqr,
        lower: median - 1.5 * iqr,
      });
    });

    const findClosest = (
      target: 'median' | 'upper' | 'lower',
    ): { name: string; data: any[] } | null => {
      let closest: { name: string; data: any[] } | null = null;
      let minDist = Infinity;

      groupedByCountry.forEach((entries, name) => {
        let totalDist = 0;
        let count = 0;

        for (const d of entries) {
          const date = d[parameters.x_var];
          const y = d[parameters.y_var];
          const ref = boundsMap.get(date)?.[target];
          if (ref == null || y == null) continue;
          const diff = y - ref;
          totalDist += diff * diff;
          count += 1;
        }

        const avgDist = totalDist / (count || 1);
        if (avgDist < minDist) {
          minDist = avgDist;
          closest = { name: name as string, data: entries };
        }
      });

      return closest;
    };

    const median = findClosest('median');
    const upper = findClosest('upper');
    const lower = findClosest('lower');

    if (!median || !upper || !lower) return null;

    const fixedYScale = d3.scaleLinear().domain([-100, 100]).range([height + margin.top, margin.top]);

    const lineGenerator = d3.line()
      .x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d[parameters.x_var]) as Date))
      .y((d: any) => fixedYScale(d[parameters.y_var]))
      .curve(d3.curveBasis);

    return {
      medianPath: lineGenerator(median.data),
      upperPath: lineGenerator(upper.data),
      lowerPath: lineGenerator(lower.data),
      labelPositions: {
        median: median.data[median.data.length - 1],
        upper: upper.data[upper.data.length - 1],
        lower: lower.data[lower.data.length - 1],
      },
    };
  }, [data, parameters, guardrail, xScale, yScale]);

  // ---------------------------- Percentile Closest Lines ---------------------------- //
  const percentileClosestPaths = useMemo(() => {
    if (guardrail !== 'percentileClosest') return null;

    const groupedByDate = d3.group(data, (d) => d[parameters.x_var]);
    const groupedByCountry = d3.group(data, (d) => d[parameters.cat_var]);

    const targetMap = new Map<string, { upper: number, lower: number }>();

    groupedByDate.forEach((entries, date) => {
      const values = entries.map((d) => d[parameters.y_var]).filter((v): v is number => v !== null && v !== undefined);
      const q1 = d3.quantile(values, 0.25) ?? 0;
      const q3 = d3.quantile(values, 0.75) ?? 0;
      targetMap.set(date, { lower: q1, upper: q3 });
    });

    const findClosest = (target: 'upper' | 'lower'): { name: string; data: any[] } | null => {
      let closest: { name: string, data: any[] } | null = null;
      let minDist = Infinity;

      groupedByCountry.forEach((entries, name) => {
        let total = 0;
        let count = 0;

        for (const d of entries) {
          const date = d[parameters.x_var];
          const y = d[parameters.y_var];
          const ref = targetMap.get(date)?.[target];
          if (ref == null || y == null) continue;
          const diff = y - ref;
          total += diff * diff;
          count += 1;
        }

        const avg = total / (count || 1);
        if (avg < minDist) {
          minDist = avg;
          closest = { name, data: entries };
        }
      });

      return closest;
    };

    const upper = findClosest('upper');
    const lower = findClosest('lower');

    if (!upper || !lower) return null;

    const lineGenerator = d3.line()
      .x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d[parameters.x_var]) as Date))
      .y((d: any) => yScale(d[parameters.y_var]))
      .curve(d3.curveBasis);

    return {
      upperPath: lineGenerator(upper.data),
      lowerPath: lineGenerator(lower.data),
      labelPositions: {
        upper: upper.data[upper.data.length - 1],
        lower: lower.data[lower.data.length - 1],
      },
    };
  }, [data, parameters, guardrail, xScale, yScale]);

  // ---------------------------- Cluster Representatives ----------------------------
  const [clusterReps, setClusterReps] = useState<any[]>([]);
  const clusterRepsDataPath = metadataFiltered ? '/sandbox-sector-metadata/data/cluster_representatives.csv' : '/sandbox/data/cluster_representatives.csv';
  useEffect(() => {
    if (guardrail !== 'cluster') return;

    d3.csv(clusterRepsDataPath, d3.autoType).then((data) => {
      setClusterReps(data);
    });
  }, [guardrail]);

  const clusterLines = useMemo(() => {
    if (guardrail !== 'cluster' || clusterReps.length === 0) return null;
    const grouped = d3.group(clusterReps, (d) => d.name);

    return Array.from(grouped, ([name, values]) => {
      const lineGenerator = d3.line<[number, number]>()
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1]))
        .curve(d3.curveBasis);

      const parsedData: [number, number][] = values
        .map((d: any) => {
          const dateObj = new Date(d.date);
          const val = parseFloat(d.value);
          if (Number.isNaN(val)) return null;
          return [dateObj.getTime(), val];
        })
        .filter((d): d is [number, number] => d !== null);

      if (parsedData.length === 0) return null;

      return {
        name,
        path: lineGenerator(parsedData) ?? '',
        lastPoint: parsedData[parsedData.length - 1],
      };
    }).filter((d): d is { name: string; path: string; lastPoint: [number, number] } => d !== null);
  }, [clusterReps, guardrail, xScale, yScale]);

  // ---------------------------- Metadata based representatives ----------------------------
  const metadataLines = useMemo(() => {
    if (guardrail !== 'metadata') return null;

    const representatives = ['RMD', 'FDX', 'EFX', 'TPR']; // hardcoded feature-based clustering representatives here

    return representatives.map((symbol) => {
      const stockData = data.filter((d) => d.name === symbol);
      if (stockData.length === 0) return null;

      const parsedData: [number, number][] = stockData
        .map((d) => {
          const date = d3.timeParse('%Y-%m-%d')(d.date);
          const val = +d.value;
          if (!date || Number.isNaN(val)) return null;
          return [date.getTime(), val];
        })
        .filter((d): d is [number, number] => d !== null);

      const lineGenerator = d3.line<[number, number]>()
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1]))
        .curve(d3.curveBasis);

      return {
        name: symbol,
        path: lineGenerator(parsedData),
        labelPos: stockData[stockData.length - 1],
      };
    }).filter((d): d is { name: string; path: string; labelPos: any } => d !== null);
  }, [data, guardrail, xScale, yScale]);

  // ---------------------------- All ----------------------------
  const allBackgroundLines = useMemo(() => {
    if (guardrail !== 'all') return null;

    const selectedSet = new Set(selection);
    const allLines = d3.group(data, (d) => d[parameters.cat_var]);

    return Array.from(allLines.entries())
      .filter(([name]) => !selectedSet.has(name)) // only unselected
      .map(([name, values]) => {
        const parsedData: [number, number][] = values
          .map((d) => {
            const date = d3.timeParse('%Y-%m-%d')(d[parameters.x_var]);
            const val = +d[parameters.y_var];
            if (!date || Number.isNaN(val)) return null;
            return [date.getTime(), val];
          })
          .filter((d): d is [number, number] => d !== null);

        const lineGenerator = d3.line<[number, number]>()
          .x((d) => xScale(d[0]))
          .y((d) => yScale(d[1]))
          .curve(d3.curveBasis);

        return {
          name,
          path: lineGenerator(parsedData),
        };
      });
  }, [data, selection, guardrail, parameters, xScale, yScale]);

  // ---------------------------- Draw ----------------------------
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
      path: lineGenerator(data.filter((val) => (val[parameters.cat_var] === x))) as string,
    }));

    return paths;
  }, [data, xScale, yScale, selection, parameters, dataname]);

  const superimposeDatapoints = useMemo(() => {
    if (guardrail !== 'super_data') {
      return null;
    }

    const lineGenerator = d3.line()
      .x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d[parameters.x_var]) as Date))
      .y((d: any) => yScale(d[parameters.y_var]))
      .curve(d3.curveBasis);

    const paths = randomCountries.map((country) => ({
      country,
      path: lineGenerator(data.filter((val) => val[parameters.cat_var] === country)) as string,
    }));

    return paths;
  }, [data, xScale, yScale, randomCountries, parameters]);

  const superimposeSummary = useMemo(() => {
    if (guardrail !== 'super_summ') {
      return null;
    }

    // Mean line
    const lineGenerator = d3.line();
    lineGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d.date) as Date));
    lineGenerator.y((d: any) => yScale(d.mean));
    lineGenerator.curve(d3.curveBasis);
    const meanLine = lineGenerator(avgData) as string;

    // Confidence bands
    const areaGenerator = d3.area();
    areaGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d.date) as Date));
    areaGenerator.y0((d: any) => yScale(d.lowerq));
    areaGenerator.y1((d: any) => yScale(d.upperq));
    areaGenerator.curve(d3.curveBasis);
    const confidenceBands = areaGenerator(avgData) as string;

    return {
      meanLine: meanLine as string,
      confidenceBands: confidenceBands as string,
      data: avgData as any[],
    };
  }, [xScale, yScale, guardrail, avgData, dataname]);

  const averageLabel = useMemo(() => (dataname === 'clean_stocks' ? 'Industry Average' : 'Average'), [dataname]);

  // median IQR paths
  const medianIQRPaths = useMemo(() => {
    if (!medianIQRData || guardrail !== 'medianIQR') {
      return null;
    }

    const lineGenerator = d3.line()
      .x((d: [number, number]) => xScale(d[0]))
      .y((d: [number, number]) => yScale(d[1]))
      .curve(d3.curveBasis);
    // shaded area between upper and lower bounds
    const areaGenerator = d3.area<[number, number, number]>()
      .x((d) => xScale(d[0]))
      .y0((d) => yScale(d[1] ?? yMin))
      .y1((d) => yScale(d[2] ?? yMax))
      .curve(d3.curveBasis);

    const processedData: [number, number, number][] = medianIQRData
      .map((d) => {
        const parsedDate = d3.timeParse('%Y-%m-%d')(d[parameters.x_var]);
        return parsedDate
          ? [parsedDate.getTime(), d.lower, d.upper] as [number, number, number]
          : null;
      })
      .filter((d): d is [number, number, number] => d !== null);

    return {
      iqrAreaPath: areaGenerator(processedData) as string,
      medianPath: lineGenerator(processedData.map(([date, lower, upper]) => [date, (upper + lower) / 2])) as string, // Median path
      upperPath: lineGenerator(processedData.map(([date, lower, upper]) => [date, upper])) as string, // Upper bound
      lowerPath: lineGenerator(processedData.map(([date, lower, upper]) => [date, lower])) as string, // Lower bound
    };
  }, [medianIQRData, xScale, yScale, parameters, guardrail]);

  // percentile paths
  const percentilePaths = useMemo(() => {
    if (!percentileData || guardrail !== 'percentiles') {
      return null;
    }

    const lineGenerator = d3.line()
      .x((d: [number, number]) => xScale(d[0]))
      .y((d: [number, number]) => yScale(d[1]))
      .curve(d3.curveBasis);
    // shaded area between upper and lower bounds
    const areaGenerator = d3.area<[number, number, number]>()
      .x((d) => xScale(d[0]))
      .y0((d) => yScale(d[1] ?? yMin))
      .y1((d) => yScale(d[2] ?? yMax))
      .curve(d3.curveBasis);

    const processedData: [number, number, number][] = percentileData
      .map((d) => {
        const parsedDate = d3.timeParse('%Y-%m-%d')(d[parameters.x_var]);
        return parsedDate
          ? [parsedDate.getTime(), d.lower, d.upper] as [number, number, number]
          : null;
      })
      .filter((d): d is [number, number, number] => d !== null);

    return {
      percentileAreaPath: areaGenerator(processedData) as string,
      upperPath: lineGenerator(processedData.map(([date, lower, upper]) => [date, upper])) as string, // Upper bound
      lowerPath: lineGenerator(processedData.map(([date, lower, upper]) => [date, lower])) as string, // Lower bound
    };
  }, [medianIQRData, xScale, yScale, parameters, guardrail]);

  const getPolicyLabel = (country: string) => {
    if (country === 'Eldoril North') {
      return 'Policy A';
    }

    if (country.split(' ')[0] === 'Silvoria') {
      return 'Policy C';
    }

    if (country.split(' ')[0] === 'Mystara') {
      return 'Policy C';
    }

    if (country === 'Average') {
      return 'all policies';
    }

    return 'Policy B';
  };

  // Function to place labels s.t. they don't overlap
  const labelPos = useMemo(() => {
    const min_dist = 10;
    let labels = null;
    switch (guardrail) {
      case 'super_data':
        labels = selection?.concat(superimposeDatapoints?.map((val) => val.country));
        break;
      case 'super_summ':
        labels = selection?.concat([averageLabel]);
        break;
      default:
        labels = selection;
        break;
    }

    const pos = labels?.map((x) => ({
      country: x as string,
      country_policy: (dataname === 'clean_data' ? (`${x} (${getPolicyLabel(x)})`) : x) as string,
      label_pos: (x === averageLabel
        ? (superimposeSummary?.data.slice(-1).map((val) => yScale(val.mean))[0]) as number
        : (data.filter((val) => val[parameters.cat_var] === x).slice(-1).map((val) => yScale(val[parameters.y_var]))[0]) as number),
    })).sort((a, b) => (a.label_pos < b.label_pos ? 1 : -1));

    if (!pos) {
      return pos;
    }

    for (let i = 0; i < pos?.length; i += 1) {
      if (!pos[i - 1]) {
        continue;
      }
      const diff = pos[i - 1].label_pos - pos[i].label_pos;
      if (diff >= min_dist) {
        continue;
      }
      pos[i].label_pos = pos[i].label_pos - min_dist + diff;
    }
    return pos;
  }, [data, selection, yScale, guardrail, averageLabel, parameters, superimposeDatapoints, superimposeSummary, dataname]);

  // ---------------------------- Render ----------------------------
  return selection?.length === 0 ? (
    <Center style={{ width: '800px', height: '400px' }}>
      <Text fs="italic" c="dimmed">Select an item to view the chart.</Text>
    </Center>
  ) : (
    <svg id="baseLineChart" style={{ height: '400px', width: '800px', fontFamily: '"Helvetica Neue", "Helvetica", "Arial", sans-serif' }}>
      <g id="axes">
        <XAxis
          isDate
          xScale={xScale}
          yRange={yScale.range() as [number, number]}
          vertPosition={height + margin.top}
          showLines={false}
          ticks={xScale.ticks(6).map((value) => ({
            value: value.toString(),
            offset: xScale(value),
          }))}
        />
        <YAxis
          dataset={dataname}
          yScale={yScale}
          horizontalPosition={margin.left}
          xRange={xScale.range()}
        />
      </g>

      <svg key="control_lines" style={{ width: `${width}` }}>
        {superimposeDatapoints?.map((x) => (
          <g key={`${x.country}_g`}>
            <path
              id={`${x.country}`}
              key={`${x.country}_key`}
              fill="none"
              stroke={shouldBeColor(x.country) ? colorScale(x.country) : 'gray'}
              strokeDasharray="4,1"
              strokeWidth={0.5}
              d={x.path}
            />
          </g>
        ))}
      </svg>

      <svg key="control_bands" style={{ width: `${width}` }}>
        {superimposeSummary ? (
          <g key="summary_g">
            <path
              id="meanLine"
              key="meanLine_key"
              fill="none"
              stroke="gray"
              strokeDasharray="4,1"
              strokeWidth={0.5}
              d={superimposeSummary.meanLine}
            />
          </g>
        ) : null}
      </svg>

      <svg key="lines" style={{ width: `${width}` }}>
        {linePaths?.map((x) => (
          <g key={`${x.country}_g`}>
            <path
              id={`${x.country}`}
              key={`${x.country}_key`}
              fill="none"
              stroke={shouldBeColor(x.country) ? colorScale(x.country) : 'silver'}
              strokeWidth={hover?.includes(x.country) ? 2 : 1.5}
              d={x.path}
            />
          </g>
        ))}
        {labelPos?.map((x) => (
          <foreignObject key={`${x.country}_label`} x={width + margin.left - 3} y={x.label_pos - 7} width={margin.right + 60} height={20}>
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
              {x.country_policy}
            </Text>
          </foreignObject>
        ))}
      </svg>
      {medianLinePath && (
      <>
        <path
          d={medianLinePath.path}
          fill="none"
          stroke="silver"
          strokeDasharray="4,1"
          strokeWidth={1.5}
        />
        <foreignObject
          x={width + margin.left - 3}
          y={medianLinePath ? yScale(medianLinePath.labelPosition[parameters.y_var]) - 7 : 0}
          width={margin.right + 60}
          height={20}
        >
          <Text
            px={2}
            size={10}
            color="silver"
            onMouseOver={() => setHover(['Median Country'])}
            onMouseOut={() => setHover([])}
          >
            Median
          </Text>
        </foreignObject>
      </>
      )}
      {medianLineClosest && (
      <>
        <path
          d={medianLineClosest.path}
          fill="none"
          stroke="silver"
          strokeDasharray="4,1"
          strokeWidth={1.5}
        />
        <foreignObject
          x={width + margin.left - 3}
          y={medianLineClosest ? yScale(medianLineClosest.labelPosition[parameters.y_var]) - 7 : 0}
          width={margin.right + 60}
          height={20}
        >
          <Text
            px={2}
            size={10}
            color="silver"
            onMouseOver={() => setHover(['Median Country'])}
            onMouseOut={() => setHover([])}
          >
            Median
          </Text>
        </foreignObject>
      </>
      )}
      {medianIQRPaths && medianIQRData && (
        <>
          {/* <path
            d={medianIQRPaths.iqrAreaPath}
            fill="silver"
            opacity={0.2}
            stroke="none"
          /> */}

          <path
            d={medianIQRPaths.medianPath}
            fill="none"
            stroke="silver"
            strokeDasharray="4,1"
            strokeWidth={1.5}
          />

          <path
            d={medianIQRPaths.upperPath}
            fill="none"
            stroke="silver"
            strokeDasharray="2,2"
            strokeWidth={1.5}
          />
          <path
            d={medianIQRPaths.lowerPath}
            fill="none"
            stroke="silver"
            strokeDasharray="2,2"
            strokeWidth={1.5}
          />

          <foreignObject
            x={width + margin.left - 3}
            y={yScale(medianIQRData[medianIQRData.length - 1].median) - 7}
            width={margin.right + 60}
            height={20}
          >
            <Text px={2} size={10} color="silver">
              Median
            </Text>
          </foreignObject>

          <foreignObject
            x={width + margin.left - 3}
            y={yScale(medianIQRData[medianIQRData.length - 1].upper) - 7}
            width={margin.right + 60}
            height={20}
          >
            <Text px={2} size={10} color="silver">
              Median + 1.5 IQR
            </Text>
          </foreignObject>

          <foreignObject
            x={width + margin.left - 3}
            y={yScale(medianIQRData[medianIQRData.length - 1].lower) - 7}
            width={margin.right + 60}
            height={20}
          >
            <Text px={2} size={10} color="silver">
              Median - 1.5 IQR
            </Text>
          </foreignObject>
        </>
      )}
      {medianIQRClosestPaths && (
      <>
        <path
          d={medianIQRClosestPaths.medianPath ?? undefined}
          fill="none"
          stroke="silver"
          strokeDasharray="4,1"
          strokeWidth={1.5}
        />
        <path
          d={medianIQRClosestPaths.upperPath ?? undefined}
          fill="none"
          stroke="silver"
          strokeDasharray="2,2"
          strokeWidth={1.5}
        />
        <path
          d={medianIQRClosestPaths.lowerPath ?? undefined}
          fill="none"
          stroke="silver"
          strokeDasharray="2,2"
          strokeWidth={1.5}
        />

        <foreignObject
          x={width + margin.left - 3}
          y={yScale(medianIQRClosestPaths.labelPositions.median[parameters.y_var]) - 7}
          width={margin.right + 60}
          height={20}
        >
          <Text px={2} size={10} color="silver">Median</Text>
        </foreignObject>

        <foreignObject
          x={width + margin.left - 3}
          y={yScale(medianIQRClosestPaths.labelPositions.upper[parameters.y_var]) - 7}
          width={margin.right + 60}
          height={20}
        >
          <Text px={2} size={10} color="silver">Median + 1.5 IQR</Text>
        </foreignObject>

        <foreignObject
          x={width + margin.left - 3}
          y={yScale(medianIQRClosestPaths.labelPositions.lower[parameters.y_var]) - 7}
          width={margin.right + 60}
          height={20}
        >
          <Text px={2} size={10} color="silver">Median - 1.5 IQR</Text>
        </foreignObject>
      </>
      )}

      {percentilePaths && percentileData && (
        <>
          {/* <path
            d={percentilePaths.percentileAreaPath}
            fill="silver"
            opacity={0.2}
            stroke="none"
          /> */}
          <path
            d={percentilePaths.upperPath}
            fill="none"
            stroke="silver"
            strokeDasharray="2,2"
            strokeWidth={1.5}
            // opacity={0.7}
          />
          <path
            d={percentilePaths.lowerPath}
            fill="none"
            stroke="silver"
            strokeDasharray="2,2"
            strokeWidth={1.5}
            // opacity={0.7}
          />
          <foreignObject
            x={width + margin.left - 3}
            y={yScale(percentileData[percentileData.length - 1].upper) - 7}
            width={margin.right + 60}
            height={20}
          >
            <Text px={2} size={10} color="silver">
              75th Percentile
            </Text>
          </foreignObject>
          <foreignObject
            x={width + margin.left - 3}
            y={yScale(percentileData[percentileData.length - 1].lower) - 7}
            width={margin.right + 60}
            height={20}
          >
            <Text px={2} size={10} color="silver">
              25th Percentile
            </Text>
          </foreignObject>
        </>
      )}
      {percentileClosestPaths && (
      <>
        <path
          d={percentileClosestPaths.upperPath ?? undefined}
          fill="none"
          stroke="silver"
          strokeDasharray="2,2"
          strokeWidth={1.5}
        />
        <path
          d={percentileClosestPaths.lowerPath ?? undefined}
          fill="none"
          stroke="silver"
          strokeDasharray="2,2"
          strokeWidth={1.5}
        />
        <foreignObject
          x={width + margin.left - 3}
          y={yScale(percentileClosestPaths.labelPositions.upper[parameters.y_var]) - 7}
          width={margin.right + 60}
          height={20}
        >
          <Text px={2} size={10} color="silver">75th Percentile</Text>
        </foreignObject>
        <foreignObject
          x={width + margin.left - 3}
          y={yScale(percentileClosestPaths.labelPositions.lower[parameters.y_var]) - 7}
          width={margin.right + 60}
          height={20}
        >
          <Text px={2} size={10} color="silver">25th Percentile</Text>
        </foreignObject>
      </>
      )}
      {clusterLines?.map((line) => (
        <g key={line.name}>
          <path
            d={line.path}
            fill="none"
            stroke="silver"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <foreignObject
            x={width + margin.left - 3}
            y={yScale(line.lastPoint[1]) - 7}
            width={margin.right + 60}
            height={20}
          >
            <Text px={2} size={10} color="silver">
              {line.name}
            </Text>
          </foreignObject>
        </g>
      ))}
      {metadataLines && (
      <>
        {metadataLines.map((x) => (
          <g key={`${x.name}_group`}>
            <path
              d={x.path}
              fill="none"
              stroke="silver"
              strokeDasharray="4,1"
              strokeWidth={1.5}
            />
            <foreignObject
              x={width + margin.left - 3}
              y={yScale(x.labelPos.value) - 7}
              width={margin.right + 60}
              height={20}
            >
              <Text px={2} size={10} color="silver">
                {x.name}
              </Text>
            </foreignObject>
          </g>
        ))}
      </>
      )}
      {allBackgroundLines && (
      <>
        {allBackgroundLines.map((x) => (x.path ? (
          <path
            key={`bg_${x.name}`}
            d={x.path}
            fill="none"
            stroke="lightgray"
            strokeWidth={1}
            opacity={0.6}
          />
        ) : null))}
      </>
      )}
    </svg>
  );
}

export default LineChart;
