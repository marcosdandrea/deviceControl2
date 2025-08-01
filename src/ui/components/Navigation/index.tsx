import Builder from '@views/Builder';
import Control from '@views/Control';
import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Navigation = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Control />} />
                <Route path='/builder' element={<Builder />} />
            </Routes>
        </BrowserRouter>
    )
}

export default Navigation;