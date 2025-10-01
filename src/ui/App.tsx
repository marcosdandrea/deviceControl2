import React from "react";
import Navigation from "@components/Navigation";
import SocketIOProvider from "@components/SocketIOProvider";
import DisconnectedView from "@views/Control/components/DisconnectedView";
import ProjectContextProvider from "@contexts/projectContextProvider";

function App() {
  return (
      <ProjectContextProvider>
        <SocketIOProvider
          disconnectionViewComponent={<DisconnectedView />}
          mountComponentsOnlyWhenConnect={true}>
        <Navigation />
        </SocketIOProvider>
      </ProjectContextProvider>
  );
}

export default App;
