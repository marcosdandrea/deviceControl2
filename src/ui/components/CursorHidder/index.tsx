import React, { useEffect } from 'react';

const CursorHider = ({children, hideCursor}: {children: React.ReactNode, hideCursor: boolean}) => {

useEffect(() => {
    document.body.classList.toggle("kiosk", hideCursor);
    return () => document.body.classList.remove("kiosk");
  }, [hideCursor]);


    return ( <>{children}</> );
}
 
export default CursorHider;