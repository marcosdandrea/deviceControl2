import React from "react";
import Navigation from "@components/Navigation";
import SocketIOProvider from "@components/SocketIOProvider";
import DisconnectedView from "@views/Control/components/DisconnectedView";
import ProjectContextProvider from "@contexts/projectContextProvider";
import SystemNotifications from "@components/SystemNotifications";

function App() {
  return (
    <>
      <ProjectContextProvider>
        <SocketIOProvider
          disconnectionViewComponent={<DisconnectedView />}
          mountComponentsOnlyWhenConnect={true}
        >
          <SystemNotifications />
          <Navigation />
        </SocketIOProvider>
      </ProjectContextProvider>
    </>
  );
}

export default App;
