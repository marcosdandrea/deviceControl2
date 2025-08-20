import React from 'react';
import Navigation from '@components/Navigation';
import SocketIOProvider from '@components/SocketIOProvider';
import DisconnectedView from '@views/Control/components/DisconnectedView';

function App() {

    return (
        <>
            <SocketIOProvider 
                disconnectionViewComponent={<DisconnectedView />}
                mountComponentsOnlyWhenConnect={true}>
                <Navigation />
            </SocketIOProvider>
        </>
    );
}

export default App;
