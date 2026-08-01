import React from "react";
import { App as AntApp } from "antd";
import Navigation from "@components/Navigation";
import SocketIOProvider from "@components/SocketIOProvider";
import DisconnectedView from "@views/Control/components/DisconnectedView";
import ProjectContextProvider from "@contexts/projectContextProvider";
import PreloadedImagesProvider from "@contexts/PreloadedImagesProvider";
import ProjectSyncListener from "@contexts/ProjectSyncListener";

function App() {
  return (
    <AntApp>
      <PreloadedImagesProvider>
        <ProjectContextProvider>
          <SocketIOProvider
            disconnectionViewComponent={<DisconnectedView />}
            mountComponentsOnlyWhenConnect={true}>
              <ProjectSyncListener />
              <Navigation />
          </SocketIOProvider>
        </ProjectContextProvider>
      </PreloadedImagesProvider>
    </AntApp>
  );
}

export default App;
