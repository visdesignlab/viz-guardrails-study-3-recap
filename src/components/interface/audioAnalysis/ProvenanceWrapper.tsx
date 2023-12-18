import { Stack } from '@mantine/core';


import { Analysis } from './Analysis';
import ComponentController from '../../../controllers/ComponentController';
import { useState } from 'react';

export function ProvenanceWrapper() {
    const [provState, setProvState] = useState<any>();

    console.log(provState);

    return <Stack><Analysis setProvState={setProvState}/><ComponentController provState={provState} /></Stack>;
}
