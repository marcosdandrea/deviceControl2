import style from './style.module.css';
import { Handle, Position } from '@xyflow/react';
import React from 'react';

type customHandleProps = {
    id: string;
    position: Position;
    label?: string;
    isConnectable?: boolean;
    color?: string;
}


const CustomHandle = ({ position, label, isConnectable, id, color }: customHandleProps) => {
    return (
        <div 
            className={`${style.handle} ${position === Position.Left ? style.leftHandle : style.rightHandle}`}>
            <Handle
                color={color}
                id={id}     
                type="target" 
                position={position} 
                style={{
                    backgroundColor: color || '#555',
                }}
                isConnectable={isConnectable}
                className={`${style.node}`}/>
            <p className={style.label}>{label}</p>
        </div>

    );
}

export default CustomHandle;