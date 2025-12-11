import React from "react";
import Navigation from "@components/Navigation";
import SocketIOProvider from "@components/SocketIOProvider";
import DisconnectedView from "@views/Control/components/DisconnectedView";
import ProjectContextProvider from "@contexts/projectContextProvider";
import PreloadedImagesProvider from "@contexts/PreloadedImagesProvider";

function App() {
  return (
      <PreloadedImagesProvider>
        <ProjectContextProvider>
          <SocketIOProvider
            disconnectionViewComponent={<DisconnectedView />}
            mountComponentsOnlyWhenConnect={true}>
          <Navigation />
          </SocketIOProvider>
        </ProjectContextProvider>
      </PreloadedImagesProvider>
  );
}

export default App;
