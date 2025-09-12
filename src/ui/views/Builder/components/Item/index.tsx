import React from "react";
import { SortableItem } from "react-easy-sort";
import ItemHandler from "./components/ItemHandler";

const Item = ({ id, className, isDraggable, style, children }) => {
    return (
        <SortableItem
            key={id}>
            <div
                className={className}
                style={{
                    paddingLeft: isDraggable ? "0" : "0.5rem",
                    ...style
                }}>
                {
                    isDraggable && (<ItemHandler />)
                }
                {children}
            </div>
        </SortableItem>
    )
}

export default Item;