import { Chip } from '@mantine/core';

export function Sidebar({
    items,
    setSelection
} : {
    items: string[];
    setSelection: (value: Array<string>) => void
}) {

    return (
        <div style={{ width:'150px', height:'500px'}}>
        <Chip.Group
            key='chip_group'
            onChange={(xs) => setSelection(xs)}
            spacing={0}
            multiple
            align='stretch'
        >
            {items.map((item) => {
                return (
                    <Chip 
                        key={item} 
                        value={item} 
                        variant='filled' 
                        radius='xs'
                        styles={{label: {'width':'150px'}}}
                    >{item}</Chip>
                );
            })}
        </Chip.Group>
        </div >
    );

}

export default Sidebar;