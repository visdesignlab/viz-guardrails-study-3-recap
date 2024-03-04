/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Box, Button, Center, ColorSwatch, Group, Loader, SegmentedControl, Stack, Text,
} from '@mantine/core';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { from, escape } from 'arquero';
import ColumnTable from 'arquero/dist/types/table/column-table';
import { Registry, initializeTrrack } from '@trrack/core';
import * as d3 from 'd3';
import debounce from 'lodash.debounce';
import { Scatter } from './Scatter';
import { Bar } from './Bar';
import { StimulusParams } from '../../store/types';
import { BrushParams, BrushState, SelectionType } from './types';
import { AddPlot } from './AddPlot';
import { Histogram } from './Histogram';
import { Violin } from './Violin';

export function BrushPlot({ parameters, setAnswer }: StimulusParams<BrushParams>) {
  const [filteredTable, setFilteredTable] = useState<ColumnTable | null>(null);
  const [brushState, setBrushState] = useState<{ [n: number] : BrushState, selection: string[] }>(parameters.brushState ? { ...parameters.brushState, selection: [] } : {
    0: {
      hasBrush: false, x1: 0, y1: 0, x2: 0, y2: 0, xCol: parameters.x, yCol: parameters.y, id: 0, type: 'scatter',
    },
    selection: [],
  });

  const [isPaintbrushSelect, setIsPaintbrushSelect] = useState<boolean>(true);

  const [data, setData] = useState<any[] | null>(null);

  // load data
  useEffect(() => {
    d3.csv(`./data/${parameters.dataset}.csv`).then((_data) => {
      setData(_data);
    });
  }, [parameters]);

  const fullTable = useMemo(() => {
    if (data) {
      return from(data);
    }

    return null;
  }, [data]);

  // creating provenance tracking
  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();

    const brush = reg.register('brush', (state, currBrush: BrushState) => {
      state.all = { brush: currBrush };
      return state;
    });

    const brushMove = reg.register('brushMove', (state, currBrush: BrushState) => {
      state.all = { brush: currBrush };
      return state;
    });

    const brushResize = reg.register('brushResize', (state, currBrush: BrushState) => {
      state.all = { brush: currBrush };
      return state;
    });

    const clearBrush = reg.register('brushClear', (state, currBrush: BrushState) => {
      state.all = { brush: currBrush };
      return state;
    });

    const trrackInst = initializeTrrack({
      registry: reg,
      initialState: {
        all: {
          hasBrush: false, x1: null, x2: null, y1: null, y2: null, ids: [],
        },
      },
    });

    return {
      actions: {
        brush,
        brushMove,
        brushResize,
        clearBrush,
      },
      trrack: trrackInst,
    };
  }, []);

  const moveBrushCallback = useCallback((selType: SelectionType, state: BrushState) => {
    if (selType === 'drag') {
      trrack.apply('Move Brush', actions.brushMove(state));
    } else if (selType === 'handle') {
      trrack.apply('Brush', actions.brush(state));
    }

    setAnswer({
      status: true,
      provenanceGraph: trrack.graph.backend,
      answers: {},
    });
  }, [actions, setAnswer, trrack]);

  // debouncing the trrack callback
  const debouncedCallback = useMemo(() => debounce(moveBrushCallback, 100, { maxWait: 100 }), [moveBrushCallback]);

  // brush callback, updating state, finding the selected points, and pushing to trrack
  const brushedSpaceCallback = useCallback((sel: [[number | null, number | null], [number | null, number | null]], xScale: any, yScale: any, selType: SelectionType, id: number, ids?: string[]) => {
    if (!xScale || !yScale) {
      return;
    }

    const currBrush = brushState[id];

    const xMin = xScale.invert(sel[0][0] || currBrush.x1);
    const xMax = xScale.invert(sel[1][0] || currBrush.x2);

    const yMin = yScale.invert(sel[1][1] || currBrush.y2);
    const yMax = yScale.invert(sel[0][1] || currBrush.y1);

    let _filteredTable = null;
    if (selType === 'clear') {
      _filteredTable = fullTable;
    } else if (ids) {
      const idSet = new Set(ids);
      _filteredTable = fullTable!.filter(escape((d: any) => idSet.has(d[parameters.ids])));
    } else if (parameters.brushType === 'Axis Selection') {
      _filteredTable = fullTable!.filter(escape((d: any) => new Date(d[parameters.x]) >= new Date(xMin) && new Date(d[parameters.x]) <= new Date(xMax) && d[parameters.y] >= yMin && d[parameters.y] <= yMax));
    } else {
      _filteredTable = fullTable!.filter(escape((d: any) => d[parameters.x] >= xMin && d[parameters.x] <= xMax && d[parameters.y] >= yMin && d[parameters.y] <= yMax));
    }

    const newState = {
      xCol: currBrush.xCol, yCol: currBrush.yCol, x1: sel[0][0] || currBrush?.x1 || 0, x2: sel[1][0] || currBrush?.x2 || 0, y1: sel[0][1] || currBrush?.y1 || 0, y2: sel[1][1] || currBrush?.y2 || 0, hasBrush: selType !== 'clear', id,
    };

    const newSelection = selType !== 'clear' ? _filteredTable?.array(parameters.ids) : [];

    setBrushState({ ...brushState, [id]: newState, selection: newSelection });

    if (selType === 'drag' || selType === 'handle') {
      debouncedCallback(selType, newState);
    } else if (selType === 'clear') {
      trrack.apply('Clear Brush', actions.clearBrush(newState));
    }

    setFilteredTable(_filteredTable);
  }, [brushState, fullTable, parameters, trrack, debouncedCallback, actions]);

  // Which table the bar chart uses, either the base or the filtered table if any selections
  const barsTable = useMemo(() => {
    if (filteredTable) {
      return filteredTable?.groupby(parameters.category).count();
    }
    if (fullTable) {
      return fullTable?.groupby(parameters.category).count();
    }
    return null;
  }, [filteredTable, fullTable, parameters.category]);

  const filteredCallback = useCallback((c: ColumnTable | null) => {
    setFilteredTable(c);
  }, []);

  const setSelection = useCallback((selection: string[]) => {
    setBrushState({ ...brushState, selection });
    const idSet = new Set(selection);
    const _filteredTable = fullTable!.filter(escape((d: any) => idSet.has(d[parameters.ids])));
    setFilteredTable(_filteredTable);
  }, [brushState, fullTable, parameters.ids]);

  const dataForScatter = useMemo(() => fullTable?.objects() || [], [fullTable]);

  const dataForBars = useMemo(() => filteredTable?.objects() || [], [filteredTable]);

  return data ? (
    <Stack spacing="xs">
      <Group>
        <Button
          ml={60}
          compact
          style={{ width: '130px' }}
          disabled={brushState.selection.length === 0}
          onClick={() => {
            setFilteredTable(null);
            setBrushState({ ...brushState, selection: [] });
          }}
        >
          Clear Selection
        </Button>
        { parameters.brushType === 'Paintbrush Selection'
          ? (
            <SegmentedControl
              defaultChecked
              value={isPaintbrushSelect ? 'Select' : 'De-Select'}
              onChange={(val) => setIsPaintbrushSelect(val === 'Select')}
              data={[
                { label: 'Select', value: 'Select' },
                { label: 'De-Select', value: 'De-Select', disabled: brushState.selection.length === 0 },
              ]}
            />
          ) : null}
        { parameters.columns ? (
          <>
            <ColorSwatch color="#f28e2c" />
            <Text>Survived</Text>

            <ColorSwatch color="#4e79a7" />
            <Text>Died</Text>
          </>
        ) : null}
      </Group>
      <Group>
        {Object.entries(brushState).map((entry) => {
          const [index, state] = entry;

          if (index === 'selection') {
            return null;
          }

          return (state as BrushState).type === 'histogram' ? (
            <Histogram
              onClose={(id: number) => {
                const { [id]: _, ...newState } = brushState;
                setBrushState(newState);
              }}
              dataTable={fullTable!}
              key={index}
              setSelection={setSelection}
              brushedPoints={brushState.selection}
              data={dataForBars.length > 0 ? dataForBars : dataForScatter}
              initialParams={{ ...parameters, x: (state as BrushState).xCol, y: (state as BrushState).yCol }}
              brushType={parameters.brushType}
              brushState={(state as BrushState)}
              isPaintbrushSelect={isPaintbrushSelect}
              setFilteredTable={filteredCallback}
            />
          ) : (state as BrushState).type === 'violin'
            ? (
              <Violin
                onClose={(id: number) => {
                  const { [id]: _, ...newState } = brushState;
                  setBrushState(newState);
                }}
                allData={dataForScatter}
                key={index}
                setSelection={setSelection}
                brushedPoints={brushState.selection}
                data={dataForBars.length > 0 ? dataForBars : dataForScatter}
                initialParams={{ ...parameters, x: (state as BrushState).xCol, y: (state as BrushState).yCol }}
                brushType={parameters.brushType}
                setBrushedSpace={brushedSpaceCallback}
                brushState={(state as BrushState)}
                isPaintbrushSelect={isPaintbrushSelect}
                setFilteredTable={filteredCallback}
              />
            ) : (
              <Scatter
                onClose={(id: number) => {
                  const { [id]: _, ...newState } = brushState;
                  setBrushState(newState);
                }}
                key={index}
                brushedPoints={brushState.selection}
                data={dataForScatter}
                initialParams={{ ...parameters, x: (state as BrushState).xCol, y: (state as BrushState).yCol }}
                brushType={parameters.brushType}
                setBrushedSpace={brushedSpaceCallback}
                brushState={(state as BrushState)}
                isPaintbrushSelect={isPaintbrushSelect}
                setFilteredTable={filteredCallback}
              />
            );
        })}
        {/* <Scatter setParams={setParameters} brushedPoints={brushState?.ids} data={fullTable?.objects() || []} params={parameters} brushType={parameters.brushType} setBrushedSpace={brushedSpaceCallback} brushState={brushState} setFilteredTable={filteredCallback} /> */}

        {/* {parameters.columns ? (
          <Box style={{ width: '400px' }}>
            <Center>
              <AddPlot
                columns={parameters.columns ? parameters.columns : Object.keys(data[0])}
                catColumns={parameters.catColumns || []}
                onAddHistogram={(xCol) => {
                  setBrushState({
                    ...brushState,
                    [Object.keys(brushState).length]: {
                      hasBrush: false, x1: 0, y1: 0, x2: 0, y2: 0, xCol, yCol: xCol, id: Object.keys(brushState).length, type: 'histogram',
                    },
                  });
                }}
                onAdd={(xCol, yCol) => {
                  setBrushState({
                    ...brushState,
                    [Object.keys(brushState).length]: {
                      hasBrush: false, x1: 0, y1: 0, x2: 0, y2: 0, xCol, yCol, id: Object.keys(brushState).length, type: parameters.catColumns && (parameters.catColumns.includes(xCol) || parameters.catColumns.includes(yCol)) ? 'violin' : 'scatter',
                    },
                  });
                }}
              />
            </Center>
          </Box>
        ) : null} */}
        <Bar data={dataForScatter as any} parameters={parameters} barsTable={barsTable} />

      </Group>

    </Stack>
  ) : <Loader />;
}

export default BrushPlot;
