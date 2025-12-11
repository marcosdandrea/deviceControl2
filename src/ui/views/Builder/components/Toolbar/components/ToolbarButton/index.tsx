import React, { useMemo } from 'react';
import style from './style.module.css';

const ToolbarButton = React.memo(React.forwardRef<HTMLDivElement, {icon: React.ReactNode, onClick?: () => void, disabled?: boolean}>(
    ({icon, onClick, disabled}, ref) => {
        const buttonStyle = useMemo(() => ({
            opacity: disabled ? 0.5 : 1, 
            pointerEvents: disabled ? 'none' : 'auto'
        }), [disabled]);

        return ( 
            <div
                ref={ref}
                onClick={onClick}
                style={buttonStyle}
                className={style.toolbarButton}>
                {icon}
            </div> 
        );
    }
));

ToolbarButton.displayName = 'ToolbarButton';
 
export default ToolbarButton;