import { MultiSelect } from '@mantine/core';

export function Sidebar({
    items,
    //selection,
    setSelection
} : {
    items: string[];
    //selection: Array<any>;
    setSelection: (value: Array<string>) => void
}) {

    // const isSelected = ((item) => {
    //     if(!selection) {
    //         return false;
    //     }

    //     return selection.includes(item);
    // })

    // const toggleItem = ((event) => {
    //     const item = event.target.innerText;
    //     console.log(event.target);
    //     if (isSelected(item)) {
    //         setSelection(selection.filter((x) => x!=item));
    //     } else {
    //         setSelection([...selection, item]);
    //     }
    // });

    return (
        <div style={{ width:'150px', height:'500px'}}>
        <MultiSelect
            data={items}
            initiallyOpened={true}
            clearable
            placeholder='Pick items to plot'
            defaultValue={[]}
            onChange={(xs) => setSelection(xs)}
            maxDropdownHeight={400}
        />
        </div >
    );

}

export default Sidebar;