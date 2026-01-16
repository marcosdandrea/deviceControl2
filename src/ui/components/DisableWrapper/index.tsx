import React from "react";

const DisableWrapper = ({ children, disable }) => (
    <div style={{
        width: "100%",
        height: "100%",
        pointerEvents: disable ? 'none' : 'auto',
        filter: disable ? 'grayscale(100%) opacity(0.6)' : 'none'
    }}>
        {children}
    </div>
);

export default DisableWrapper;