import useProject from '@views/Builder/hooks/useProject';
import React from 'react';

const Builder = () => {

    const {project} = useProject();

    return (
        <div>
            <h1>Builder UI</h1>
            <p>Esta es la página de Builder</p>
        </div>
    );
}
 
export default Builder;