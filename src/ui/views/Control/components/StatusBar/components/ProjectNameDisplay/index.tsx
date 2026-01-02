import React, { useContext } from 'react';
import style from './style.module.css';
import Text from '@components/Text';
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
            <Text
                text={project?.name || `Device Control ${version}`}
                fontFamily='Open Sans SemiBold'
                size={15} />
        </div>);
}

export default ProjectNameDisplay;