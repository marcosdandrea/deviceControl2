import React, { useMemo } from "react";
import { SortableItem } from "react-easy-sort";
import ItemHandler from "./components/ItemHandler";

const Item = React.memo(({ id, className, isDraggable, style, children }) => {
    const itemStyle = useMemo(() => ({
        paddingLeft: isDraggable ? "0" : "0.5rem",
        ...style
    }), [isDraggable, style]);

    return (
        <SortableItem
            key={id}>
            <div
                className={className}
                style={itemStyle}>
                {
                    isDraggable && (<ItemHandler />)
                }
                {children}
            </div>
        </SortableItem>
    );
});

export default Item;