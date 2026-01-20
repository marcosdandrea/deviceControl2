import React, { useContext } from 'react';
import style from './style.module.css';
import { ProjectContext } from '@contexts/projectContextProvider';
import { MdLock } from 'react-icons/md';
import { Color } from '@common/theme/colors';
import useAppVersion from '@hooks/useAppVersion';

const ProjectNameDisplay = () => {

    const { project } = useContext(ProjectContext)
    const {version} = useAppVersion()

    return (
        <div className={style.projectNameDisplay}>
            {project?.password &&
                <MdLock color={Color.black} />
            }
            <span
                title='Project name place'
                style={{ 
                    color: "black",
                    fontFamily: 'Open Sans SemiBold',
                    fontSize: 15
                }}>
                {project?.name || `Device Control ${version}`}
            </span>
        </div>);
}

export default ProjectNameDisplay;