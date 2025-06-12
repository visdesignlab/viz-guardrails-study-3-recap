/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import {
  Checkbox, Grid, Divider, TextInput,
  Button,
} from '@mantine/core';
import * as d3 from 'd3';
import { IconX } from '@tabler/icons-react';
import { ChartParams } from './DataExplorer';
import { OwidDistinctLinesPalette } from './Color';

const margin = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const height = 20;
const width = 60;

export function Sidebar({
  parameters,
  data,
  dataname,
  items,
  selection,
  setSelection,
  trackSelection,
  range,
  guardrail,
} : {
  parameters: ChartParams,
  data: any[],
  dataname: string,
  items: any[],
  selection: any[] | null,
  setSelection: (value: Array<string>) => void,
  trackSelection: (value: Array<string>) => void,
  range: [Date, Date] | null,
  guardrail: string
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // ---------------------------- Setup ----------------------------

  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      const selectedItems = items.filter((item) => selection?.includes(item.name));
      const unselectedItems = items.filter((item) => !selection?.includes(item.name));
      return [...selectedItems, ...unselectedItems];
      return items;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return items.filter(
      (item) => item.name.toLowerCase().includes(lowerCaseSearchTerm)
        || (item.longName && item.longName.toLowerCase().includes(lowerCaseSearchTerm)),
    );
  }, [searchTerm, items, selection]);

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
    if (guardrail !== 'juxt_data') {
      return null;
    }

    // Area
    const areaGenerator = d3.area();
    areaGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d[parameters.x_var]) as Date));
    areaGenerator.y0(() => yScale(0));
    areaGenerator.y1((d: any) => yScale(d[parameters.y_var]));
    areaGenerator.curve(d3.curveBasis);

    // Line
    const lineGenerator = d3.line();
    lineGenerator.x((d: any) => xScale(d3.timeParse('%Y-%m-%d')(d[parameters.x_var]) as Date));
    lineGenerator.y((d: any) => yScale(d[parameters.y_var]));
    lineGenerator.curve(d3.curveBasis);

    const paths = items?.map((x) => ({
      country: x.name as string,
      path: lineGenerator(data.filter((val) => val[parameters.cat_var] === x.name)) as string,
      area: areaGenerator(data.filter((val) => val[parameters.cat_var] === x.name)) as string,
    }));

    return paths;
  }, [parameters, guardrail, data, items, xScale, yScale]);

  const displayVar = useMemo(() => {
    if (parameters.allow_selection === false) {
      return 'none';
    }

    return 'block';
  }, [parameters]);

  // ---------------------------- Render ----------------------------

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TextInput
        style={{ width: '300px', marginBottom: '10px' }}
        placeholder="Search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.currentTarget.value)}
        rightSection={searchTerm && (
        <IconX
          size={14}
          style={{ cursor: 'pointer' }}
          onClick={() => setSearchTerm('')}
        />
        )}
      />
      {
            !searchTerm
          && (
          <Button
            variant="filled"
            style={{ marginBottom: '10px', alignSelf: 'flex-start' }}
            onClick={() => {
              setSelection([]);
              trackSelection([]);
            }}
          >
            Clear Selection
          </Button>
          )
          }
      <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
        <Checkbox.Group
          key={`${dataname}_checkboxgroup`}
          value={selection as string[]}
          orientation="vertical"
          onChange={(xs) => {
            setSelection(xs);
            trackSelection(xs);
          }}
          spacing={0}
          offset="sm"
          styles={parameters.allow_selection === false
            ? { root: { pointerEvents: 'none' } }
            : { root: { pointerEvents: 'auto' } }}
        >
          {filteredItems?.map((item) => (
            <>
              {item.name === 'Eldoril North' ? <Divider size="xs" label="Policy A" labelPosition="left" color="black" /> : null}
              {item.name === 'Eldoril West' ? <Divider size="xs" label="Policy B" labelPosition="left" color="black" /> : null}
              {item.name === 'Silvoria North' ? <Divider size="xs" label="Policy C" labelPosition="left" color="black" /> : null}

              <Grid key={`${item.name}_grid`} grow gutter={8} columns={2}>
                <Grid.Col key={`${item.name}_grid1`} span={1}>
                  <Checkbox
                    key={`${item.name}_checkbox`}
                    value={item.name}
                    label={
                      dataname === 'sp500_stocks'
                        ? `${item.longName} (${item.name}, ${item.sector})`
                        : `${item.name} ${item.subregion ? `(${item.subregion})` : ''}`
                    }
                    color={parameters.allow_selection ? 'blue' : 'gray'}
                    styles={{
                      root: { display: 'flex', alignItems: 'flex-end', padding: '2px 0' },
                      inner: { display: 'block' },
                    }}
                  />
                </Grid.Col>
                <Grid.Col key={`${item.name}_grid2`} span={guardrail === 'juxt_data' ? 'auto' : 3}>
                  <svg key={`${item.name}_sparksvg`} style={{ width: `${width}`, height: `${height}` }}>
                    <path
                      id={`${item.name}_sparkarea`}
                      key={`${item.name}_sparkarea`}
                      fill={selection?.includes(item.name) ? colorScale(item.name) : 'gray'}
                      stroke="none"
                      opacity={0.25}
                      d={sparkLines?.filter((x) => x.country === item.name)[0]?.area}
                    />
                    <path
                      id={`${item.name}_spark`}
                      key={`${item.name}_spark`}
                      fill="none"
                      stroke={selection?.includes(item.name) ? colorScale(item.name) : 'gray'}
                      strokeWidth={0.75}
                      d={sparkLines?.filter((x) => x.country === item.name)[0]?.path}
                    />
                  </svg>
                </Grid.Col>
              </Grid>
            </>
          ))}
        </Checkbox.Group>
      </div>
    </div>
  );
}

export default Sidebar;
