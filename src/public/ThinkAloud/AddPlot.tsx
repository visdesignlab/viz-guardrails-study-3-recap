import {
  ActionIcon,
  Button, Select, Stack, Text,
} from '@mantine/core';
import { useState } from 'react';

import { IconPlus } from '@tabler/icons-react';

export function AddPlot(
  {
    columns,
    catColumns,
    onAdd,
    onAddHistogram,
  } :
  {
    columns: string[];
    catColumns: string[];
    onAdd: (xCol: string, yCol: string) => void;
    onAddHistogram: (col: string) => void;
  },
) {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [xCol, setXCol] = useState<string | null>(null);
  const [yCol, setYCol] = useState<string | null>(null);
  const [histCol, setHistCol] = useState<string | null>(null);

  return isAdding ? (
    <Stack>
      <Select data={columns} onChange={(val) => setXCol(val)} placeholder="Select X Column" />
      <Select data={columns} onChange={(val) => setYCol(val)} placeholder="Select Y Column" />
      <Button disabled={!xCol || !yCol} onClick={() => { onAdd(xCol!, yCol!); setIsAdding(false); }}>Create plot</Button>
      <Select data={catColumns} onChange={(val) => setHistCol(val)} placeholder="Select X Column" />
      <Button disabled={!histCol} onClick={() => { onAddHistogram(histCol!); setIsAdding(false); }}>Add Histogram</Button>
    </Stack>
  ) : (
    <Stack>
      <ActionIcon variant="light" size={150} onClick={() => setIsAdding(true)}>
        <IconPlus size={50} />
      </ActionIcon>
    </Stack>
  );
}
