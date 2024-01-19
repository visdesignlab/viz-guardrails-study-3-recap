import { Checkbox } from '@mantine/core';

export function Sidebar({
    items,
    setSelection
} : {
    items: string[];
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
                {items.map((item) => {
                    return (
                        <Checkbox 
                            key={item} 
                            value={item} 
                            label={item}
                        >{item}</Checkbox>
                    );
                })}
            </Checkbox.Group>
    );

}

export default Sidebar;