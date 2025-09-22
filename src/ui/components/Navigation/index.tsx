import Builder from '@views/Builder';
import Control from '@views/Control';
import Executions from '@views/Executions';
import Terminal from '@views/Terminal';
import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Navigation = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/control" element={<Control />} />
                <Route path='/builder' element={<Builder />} />
                <Route path='/terminal' element={<Terminal />} />
                <Route path='/executions' element={<Executions />} />
                <Route path='/builder/:routineId' element={<Builder />} />
                <Route path='/builder/:routineId/task/:taskId' element={<Builder />} />
                <Route path='/builder/:routineId/trigger/:triggerId' element={<Builder />} />
                <Route path='*' element={<Builder />} />
            </Routes>
        </BrowserRouter>
    )
}

export default Navigation;