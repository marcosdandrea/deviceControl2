import React, { forwardRef } from 'react';
import style from "./style.module.css";
import { MdDragHandle } from 'react-icons/md';

const ItemHandler = forwardRef<HTMLDivElement>((_args, ref) => {
    return ( 
    <div 
        ref={ref}
        className={style.itemHandler}>
        <MdDragHandle size={18}/>
    </div> );
})
 
export default ItemHandler;