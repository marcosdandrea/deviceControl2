import React from 'react';
import Navigation from '@components/Navigation';
import SocketIO from '@components/SocketIO';

function App() {

    return (
        <>
            <SocketIO />
            <Navigation />
        </>
    );
}

export default App;
