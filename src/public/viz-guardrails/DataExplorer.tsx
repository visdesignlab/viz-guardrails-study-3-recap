/* eslint-disable import/no-named-as-default */
/* eslint-disable no-shadow */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Loader, Group, Stack, Paper, Text, Divider, Flex,
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

export interface ChartParams {
    dataset: string,
    start_date: string,
    end_date: string,
    allow_time_slider: boolean,
    allow_guardrail_selector: boolean,
    x_var: string,
    y_var: string,
    cat_var: string,
    group_var: string,
    guardrail: string
}

export function DataExplorer({ parameters, setAnswer }: StimulusParams<ChartParams>) {
  // ---------------------------- Setup & data ----------------------------
  const [data, setData] = useState<any[] | null>(null);
  const [selection, setSelection] = useState<string[] | null>([]);
  const [items, setItems] = useState<any[] | null>(null);
  const [range, setRange] = useState<[Date, Date] | null>([new Date(parameters.start_date), new Date(parameters.end_date)]);
  const [guardrail, setGuardrail] = useState<string>(parameters.guardrail);

  useEffect(() => {
    d3.csv(`./data/${parameters.dataset}.csv`)
      .then((data) => {
        setData(data);
        setItems(Array.from(new Set(data.map((row) => (JSON.stringify({
          name: row[parameters.cat_var],
          group: row[parameters.group_var],
        }))))).map((row) => JSON.parse(row)));
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
  }, []);

  const trackRange = useCallback((newRange: [Date, Date]) => {
    trrack.apply('Change daterange', actions.range([newRange[0].toISOString().slice(0, 10), newRange[1].toISOString().slice(0, 10)]));
  }, [trrack, actions, setRange]);

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
          <Selector guardrail={guardrail} setGuardrail={setGuardrail} />
        </Paper>
      ) : null}
      <Flex>
        <Paper shadow="md" radius="md" p="md" withBorder>
          <Group>
            <Sidebar
              parameters={parameters}
              data={filteredData}
              items={items}
              selection={selection}
              setSelection={setSelection}
              trackSelection={trackSelection}
              range={range}
              guardrail={guardrail}
            />
            <Divider orientation="vertical" size="xs" />
            <g>
              <Text fw={500}>
                {parameters.dataset === 'clean_stocks' ? 'Percent change in stock price' : 'Infections per million people'}
              </Text>
              {guardrail === 'super_summ' ? (
                <Text fz="xs" c="dimmed">Shaded area represents the middle 50% of all values.</Text>
              ) : null}
              {guardrail === 'juxt_summ' ? (
                <Text fz="xs" c="dimmed">Bar on the left highlights the range of selection among all data.</Text>
              ) : null}
              <Stack>
                <Group>
                  {guardrail === 'juxt_summ' ? <StripPlot parameters={parameters} data={filteredData} selection={selection} /> : null}
                  <LineChart
                    parameters={parameters}
                    data={filteredData}
                    items={items}
                    selection={selection}
                    range={range}
                    guardrail={guardrail}
                  />
                </Group>
                {parameters.allow_time_slider
                  ? (
                    <div style={{ width: '500px' }}>
                      <RangeSelector
                        parameters={parameters}
                        setRange={setRange}
                        trackRange={debouncedTrackRange}
                      />
                    </div>
                  ) : null }
              </Stack>
            </g>
          </Group>
        </Paper>
      </Flex>
    </Stack>
  ) : <Loader />;
}

export default DataExplorer;
