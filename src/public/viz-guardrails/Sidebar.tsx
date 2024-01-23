/* eslint-disable @typescript-eslint/no-explicit-any */
import { Checkbox } from '@mantine/core';

export function Sidebar({
    items,
    setSelection
} : {
    items: any[];
    setSelection: (value: Array<string>) => void
}) {

    return (
            <Checkbox.Group
                key='chip_group'
                orientation='vertical'
                onChange={(xs) => setSelection(xs)}
                spacing={0}
                offset='sm'
            >
                {items?.map((item) => {
                    return (
                        <Checkbox 
                            key={item.name} 
                            value={item.name} 
                            label={item.name}
                        >{item.name}</Checkbox>
                    );
                })}
            </Checkbox.Group>
    );

}

export default Sidebar;