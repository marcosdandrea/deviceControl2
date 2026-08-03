import React from "react";
import { Switch } from "antd";
import { InterfaceContext, interfaceContextType } from "../../../../context";

const EnableDhcp = () => {
    const {useDhcp, setUseDhcp} = React.useContext(InterfaceContext) as interfaceContextType 

    return ( 
        <Switch  
            checked={useDhcp}
            onChange={(checked) => setUseDhcp(checked)}
        />
     );
}
 
export default EnableDhcp;