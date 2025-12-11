import React, { Suspense, useMemo } from 'react';
import { HashRouter, Routes, Route } from "react-router-dom";

// Lazy loading de componentes
const Builder = React.lazy(() => import('@views/Builder'));
const Control = React.lazy(() => import('@views/Control'));
const Executions = React.lazy(() => import('@views/Executions'));
const NotAllowed = React.lazy(() => import('@views/NotAllowed'));
const Terminal = React.lazy(() => import('@views/Terminal'));

const Navigation = React.memo(() => {
    const fallbackStyle = useMemo(() => ({ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#fff'
    }), []);

    return (
        <HashRouter>
            <Suspense fallback={<div style={fallbackStyle}>Cargando...</div>}>
                <Routes>
                    <Route path="/control" element={<Control isPreview={false} />} />
                    <Route path="/controlPreview" element={<Control isPreview={true} />} />
                    <Route path='/builder' element={<Builder />} />
                    <Route path='/terminal' element={<Terminal />} />
                    <Route path='/executions' element={<Executions />} />
                    <Route path='/notAllowed' element={<NotAllowed />} />
                    <Route path='/builder/:groupId' element={<Builder />} />
                    <Route path='/builder/:groupId/:routineId' element={<Builder />} />
                    <Route path='/builder/:groupId/:routineId/task/:taskId' element={<Builder />} />
                    <Route path='/builder/:groupId/:routineId/trigger/:triggerId' element={<Builder />} />
                    <Route path='*' element={<Builder />} />
                </Routes>
            </Suspense>
        </HashRouter>
    )
});

export default Navigation;