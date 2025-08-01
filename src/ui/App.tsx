import React from 'react';
import Navigation from '@components/Navigation';
import SocketIOProvider from '@components/SocketIOProvider';

function App() {

    return (
        <>
            <SocketIOProvider 
                mountComponentsOnlyWhenConnect={true}>
                <Navigation />
            </SocketIOProvider>
        </>
    );
}

export default App;
