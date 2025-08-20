import React, { useContext } from 'react';
import style from './style.module.css';
import Text from '@components/Text';
import { ProjectContext } from '@contexts/projectContextProvider';
import { MdLock } from 'react-icons/md';
import { Color } from '@common/theme/colors';

const ProjectNameDisplay = () => {

    const { project } = useContext(ProjectContext)

    return (
        <div className={style.projectNameDisplay}>
            {project?.password &&
                <MdLock color={Color.black} />
            }
            <Text
                text={project?.name || ""}
                size={15} />
        </div>);
}

export default ProjectNameDisplay;