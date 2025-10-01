import React from 'react';
import style from './style.module.css';

const ToolbarButton = React.forwardRef<HTMLDivElement, {icon: React.ReactNode, onClick?: () => void, disabled?: boolean}>(
    ({icon, onClick, disabled}, ref) => {
        return ( 
            <div
                ref={ref}
                onClick={onClick}
                style={{opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto'}}
                className={style.toolbarButton}>
                {icon}
            </div> 
        );
    }
);

ToolbarButton.displayName = 'ToolbarButton';
 
export default ToolbarButton;