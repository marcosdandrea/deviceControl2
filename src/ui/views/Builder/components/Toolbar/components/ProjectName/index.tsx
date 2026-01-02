import React, { useState } from 'react';
import styles from './style.module.css';
import useProject from '@hooks/useProject';
import { Input } from 'antd';
import { MdEdit, MdSave } from 'react-icons/md';
import Text from '@components/Text';
import useAppVersion from '@hooks/useAppVersion';

const ProjectName = () => {
    const { project, setProject } = useProject({ fetchProject: false });
    const [editMode, setEditMode] = useState(false);
    const {version} = useAppVersion();

    if (!project)
        return (
            <div>
                <Text
                    fontFamily='Open Sans Bold'
                    color='--var(text-secondary)'>
                    {`Device Control ${version}`}
                </Text>
            </div>);

    return (
        <div className={styles.projectName}>

            {editMode ? (
                <Input
                    type="text"
                    value={project.name}
                    status={project.name.trim() === '' ? 'error' : ''}
                    style={{ width: '200px' }}
                    autoFocus
                    onPressEnter={() => setEditMode(false)}
                    onBlur={() => setEditMode(false)}
                    onChange={(e) => setProject({ ...project, name: e.target.value })} />
            ) : (
                <span
                    onFocus={() => setEditMode(true)}
                    tabIndex={0}>
                    {project?.name || "Nuevo Proyecto"}
                </span>
            )}
            <button
                className={styles.editButton}
                onClick={() => setEditMode(!editMode)}>
                {editMode ? <MdSave /> : <MdEdit />}
            </button>
        </div>);
}

export default ProjectName;