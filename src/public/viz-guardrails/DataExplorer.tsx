/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable import/no-named-as-default */
/* eslint-disable no-shadow */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Loader, Group, Stack, Paper, Text, Divider, Flex, Blockquote,
} from '@mantine/core';
import {
  useEffect, useState, useMemo, useCallback,
} from 'react';
import * as d3 from 'd3';
import { Registry, initializeTrrack } from '@trrack/core';
import debounce from 'lodash.debounce';
import { StimulusParams } from '../../store/types';
import LineChart from './LineChart';
import Sidebar from './Sidebar';
import RangeSelector from './RangeSelector';
import Selector from './Selector';
import { StripPlot } from './StripPlot';
import { Help } from './Help';

export interface ChartParams {
  dataset: string,
  start_date: string,
  end_date: string,
  initial_selection: string[],
  allow_time_slider: boolean,
  allow_guardrail_selector: boolean,
  allow_selection: boolean,
  allow_help: boolean,
  caption: string,
  x_var: string,
  y_var: string,
  cat_var: string,
  group_var: string,
  guardrail: string,
  num_Quantiles?: number,
}

export function DataExplorer({ parameters, setAnswer }: StimulusParams<ChartParams>) {
  // ---------------------------- Setup & data ----------------------------
  const [data, setData] = useState<any[] | null>(null);
  const [dataname, setDataname] = useState<string>(parameters.dataset);
  const [selection, setSelection] = useState<string[] | null>(parameters.initial_selection);
  const [items, setItems] = useState<any[] | null>(null);
  const [range, setRange] = useState<[Date, Date] | null>([new Date(parameters.start_date), new Date(parameters.end_date)]);
  const [metadataFiltered, setMetadataFiltered] = useState<boolean>(false);
  const [guardrail, setGuardrail] = useState<string>(parameters.guardrail);
  const [numRandomSamples, setNumRandomSamples] = useState<number>(5);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [numQuantiles, setNumQuantiles] = useState<number>(parameters.num_Quantiles ?? 6); // number of regions for percentiles guardrail

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useEffect(() => {
    d3.csv(`./data/${dataname}.csv`)
      .then((data) => {
        setData(data);
        setItems(Array.from(new Set(data.map((row) => (JSON.stringify({
          name: row[parameters.cat_var],
          group: row[parameters.group_var],
          longName: row.long_name || null,
          sector: row.sector || null,
          subregion: row.subregion || null,
        }))))).map((row) => JSON.parse(row)));
      });
    // Reset range when dataset changes
    if (dataname === 'clean_data') {
      setRange([new Date('2020-01-01'), new Date('2024-01-01')]);
    } else {
      setRange([new Date(parameters.start_date), new Date(parameters.end_date)]);
    }
  }, [dataname, parameters]);

  useEffect(() => {
    setSelection(parameters.initial_selection ?? []);
    setMetadataFiltered(false);
    setGuardrail(parameters.guardrail);
  }, [dataname, parameters]);

  const filteredData = useMemo(() => {
    if (data && range) {
      return data
        .filter((val) => (new Date(val[parameters.x_var])).getTime() >= range[0].getTime())
        .filter((val) => (new Date(val[parameters.x_var])).getTime() <= range[1].getTime());
    }

    return null;
  }, [data, range, parameters.x_var, dataname]);

  const guardrailFilteredData = useMemo(() => {
    if (!filteredData) return null;

    if (!metadataFiltered || guardrail === 'cluster') {
      return filteredData;
    }

    if (dataname === 'clean_data') {
      const selectedUNRegions = new Set(
        filteredData.filter((d) => selection?.includes(d.name)).map((d) => d.subregion),
      );
      return filteredData.filter((d) => selectedUNRegions.has(d.subregion));
    }

    if (dataname === 'sp500_stocks') {
      const selectedSectors = new Set(
        filteredData.filter((d) => selection?.includes(d.name)).map((d) => d.sector),
      );
      return filteredData.filter((d) => selectedSectors.has(d.sector));
    }

    return filteredData;
  }, [filteredData, dataname, metadataFiltered, guardrail, selection]);

  const updateData = (data: string) => {
    setDataname(data);
    setSelection([]);
  };

  // ---------------------------- Trrack ----------------------------
  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();

    const selection = reg.register('selection', (state, currSelection: string[]) => {
      state.selection = currSelection;
      return state;
    });

    const range = reg.register('range', (state, currRange: [string, string]) => {
      state.range = currRange;
      return state;
    });

    const trrackInst = initializeTrrack({
      registry: reg,
      initialState: {
        selection: [],
        range: [parameters.start_date, parameters.end_date],
      },
    });

    return {
      actions: {
        selection,
        range,
      },
      trrack: trrackInst,
    };
  }, [parameters.end_date, parameters.start_date]);

  const trackRange = useCallback((newRange: [Date, Date]) => {
    trrack.apply('Change daterange', actions.range([newRange[0].toISOString().slice(0, 10), newRange[1].toISOString().slice(0, 10)]));
  }, [trrack, actions]);

  const debouncedTrackRange = useMemo(() => debounce(trackRange, 200), [trackRange]);

  const trackSelection = useCallback((newSelection: string[]) => {
    trrack.apply('Change selection', actions.selection(newSelection));

    setAnswer({
      status: true,
      provenanceGraph: trrack.graph.backend,
      answers: {},
    });
  }, [trrack, actions, setAnswer]);

  // ---------------------------- Render ----------------------------

  return filteredData && items && range && selection ? (
    <Stack>
      {parameters.allow_guardrail_selector ? (
        <Paper shadow="sm" radius="md" p="md" style={{ width: '500px' }}>
          <Selector guardrail={guardrail} setGuardrail={setGuardrail} dataname={dataname} setDataname={updateData} setSelection={setSelection} setMetadataFiltered={setMetadataFiltered} numRandomSamples={numRandomSamples} setNumRandomSamples={setNumRandomSamples} />
        </Paper>
      ) : null}
      <Flex>
        <Paper shadow="md" radius="md" p="md" withBorder>
          {parameters.caption === '' ? null : (
            <Flex style={{ width: '800px' }}>
              {parameters.caption ? (
                <Blockquote>
                  {parameters.caption}
                </Blockquote>
              ) : null}
            </Flex>
          )}
          <Group noWrap align="flex-start" style={{ alignItems: 'flex-start', height: '100%' }}>
            {(parameters.allow_selection === false && parameters.guardrail !== 'juxt_data') ? null : (
              <Group style={{
                flex: '1', display: 'flex', flexDirection: 'column', height: '100%', alignContent: 'flex-start', ...(dataname === 'sp500_stocks' ? { width: '380px' } : {}),
              }}
              >
                <Sidebar
                  parameters={parameters}
                  data={filteredData}
                  dataname={dataname}
                  items={items}
                  selection={selection}
                  setSelection={setSelection}
                  trackSelection={trackSelection}
                  range={range}
                  guardrail={guardrail}
                />
              </Group>
            )}
            {(parameters.allow_selection === false && parameters.guardrail !== 'juxt_data') ? null : (<Divider orientation="vertical" size="xs" />)}
            <Stack>
              <Group position="apart">
                <Stack spacing={0} justify="flex-start">
                  <Text fw={500}>
                    {(dataname === 'clean_stocks' || dataname === 'sp500_stocks') ? 'Percent change in stock price' : 'Infections per million people'}
                  </Text>
                  {guardrail === 'super_summDELETE' ? (
                    <Text fz="xs" c="dimmed">Shaded area contains the industry average and shows the middle 50% of all values in the industry.</Text>
                  ) : null}
                  {guardrail === 'juxt_summ' ? (
                    <Text fz="xs" c="dimmed">Bar on the left highlights the range of selection among all data.</Text>
                  ) : null}
                </Stack>
                {parameters.allow_help ? <Help parameters={parameters} /> : null}
              </Group>
              <Stack>
                <Group noWrap>
                  {guardrail === 'juxt_summ' ? <StripPlot parameters={parameters} data={filteredData} selection={selection} dataname={dataname} /> : null}
                  <LineChart
                    parameters={parameters}
                    data={guardrailFilteredData ?? []}
                    dataname={dataname}
                    items={items}
                    selection={selection}
                    range={range}
                    guardrail={guardrail}
                    metadataFiltered={metadataFiltered}
                    numRandomSamples={numRandomSamples}
                    numQuantiles={numQuantiles}
                  />
                </Group>
                {parameters.allow_time_slider && dataname === 'clean_data' ? (
                  <div style={{ width: '500px' }}>
                    <RangeSelector
                      parameters={parameters}
                      range={range}
                      setRange={setRange}
                      trackRange={debouncedTrackRange}
                    />
                  </div>
                ) : null}
              </Stack>
            </Stack>
          </Group>
        </Paper>
      </Flex>
    </Stack>
  ) : <Loader />;
}

export default DataExplorer;
