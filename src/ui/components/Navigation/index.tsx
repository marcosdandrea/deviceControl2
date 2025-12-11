import Builder from '@views/Builder';
import Control from '@views/Control';
import Executions from '@views/Executions';
import NotAllowed from '@views/NotAllowed';
import Terminal from '@views/Terminal';
import React from 'react';
import { HashRouter, Routes, Route } from "react-router-dom";

const Navigation = React.memo(() => {
    return (
        <HashRouter>
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
        </HashRouter>
    )
});

export default Navigation;