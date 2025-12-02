import React, { useContext, useEffect, useState, useRef } from 'react';
import style from './style.module.css';
import { Popconfirm, Tabs, Input, ConfigProvider, theme } from 'antd';
import { ProjectContext, ProjectContextType } from '@contexts/projectContextProvider';
import RoutineContainer from '../RoutineContainer';
import { useNavigate, useParams } from 'react-router-dom';
import { MdEdit } from 'react-icons/md';
import { GroupType } from '@common/types/commons.type';
import { nanoid } from 'nanoid';

const RoutineTabsContainer = () => {

    const { project, setProject } = useContext(ProjectContext) as ProjectContextType
    const [tabs, setTabs] = React.useState([])
    const [selectedTabGroup, setSelectedTabGroup] = useState<GroupType | null>(null)
    const [editingGroupName, setEditingGroupName] = useState('')

    const [isCreatingGroup, setIsCreatingGroup] = useState(false)
    const [popconfirmOpen, setPopconfirmOpen] = useState(false)
    const [dragOverTabId, setDragOverTabId] = useState<string | null>(null)
    const centerDivRef = useRef(null)
    const { groupId } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        if (!project) return;

        const projectTabs = project.groups

        const handleDragOver = (e: React.DragEvent, tabGroupId: string) => {
            const shiftKey = e.dataTransfer.types.includes('routineid');
            if (!shiftKey) return;
            
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverTabId(tabGroupId);
            
            // Agregar clase al tab
            const tabElement = (e.currentTarget as HTMLElement).closest('.ant-tabs-tab');
            if (tabElement) {
                tabElement.classList.add('drag-over');
            }
        };

        const handleDragLeave = (e: React.DragEvent) => {
            setDragOverTabId(null);
            
            // Remover clase del tab
            const tabElement = (e.currentTarget as HTMLElement).closest('.ant-tabs-tab');
            if (tabElement) {
                tabElement.classList.remove('drag-over');
            }
        };

        const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
            e.preventDefault();
            setDragOverTabId(null);
            
            // Remover clase del tab
            const tabElement = (e.currentTarget as HTMLElement).closest('.ant-tabs-tab');
            if (tabElement) {
                tabElement.classList.remove('drag-over');
            }
            
            const routineId = e.dataTransfer.getData('routineId');
            const currentGroupId = e.dataTransfer.getData('currentGroupId');
            const shiftKey = e.dataTransfer.getData('shiftKey');

            if (!shiftKey || !routineId || currentGroupId === targetGroupId) return;

            // Actualizar el groupId de la rutina en el array de rutinas
            const updatedRoutines = project.routines?.map(routine => 
                routine.id === routineId 
                    ? { ...routine, groupId: targetGroupId }
                    : routine
            ) || [];

            setProject({ ...project, routines: updatedRoutines });
        };

        setTabs(projectTabs.map((group) => ({
            label: (
                <div
                    onDragOver={(e) => handleDragOver(e, group.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, group.id)}
                    style={{ width: '100%', height: '100%' }}>
                    {group.name}
                </div>
            ),
            key: group.id,
            children: <RoutineContainer />,
        })));

    }, [project, dragOverTabId])

    const handleConfirmEditGroupName = () => {
        if (editingGroupName.trim()) {

            // If editing existing group
            if (!isCreatingGroup) {
                const updatedGroups = project.groups.map(g => g.id === selectedTabGroup?.id ? { ...g, name: editingGroupName } : g);
                setProject({ ...project, groups: updatedGroups });
            } else {
                // Creating new group
                const newGroup = {
                    id: nanoid(9),
                    name: editingGroupName,
                } as GroupType;

                setProject({ ...project, groups: [...project.groups, newGroup] });
                navigate(`/builder/${newGroup.id}`);
            }
        }
        setPopconfirmOpen(false);
    }

    const handleCancelAddGroup = () => {
        setPopconfirmOpen(false);
    }

    const handleOnEditTab = (groupId: string, action: string) => {

        if (action === 'add') {
            console.log('Adding new group')
            setIsCreatingGroup(true)
            setEditingGroupName('')
            setPopconfirmOpen(true)
        } else {

            const group = project.groups.find(g => g.id === groupId);
            if (!group) return;

            setSelectedTabGroup(group);
            setEditingGroupName(group.name)
            setIsCreatingGroup(false)
            setPopconfirmOpen(true)
        }
    };

    const handleOnChangeTab = (groupId: string) => {
        const group = project.groups.find(g => g.id === groupId);
        if (!group) return;

        setSelectedTabGroup(group);
        navigate(`/builder/${group.id}`);
    }

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
            }}>
            <div
                ref={centerDivRef}
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                }} >
                <Popconfirm
                    title="Agregar nuevo grupo de rutinas"
                    arrow={false}
                    description={
                        <Input
                            placeholder="Ingrese el nombre del grupo"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onPressEnter={handleConfirmEditGroupName} />
                    }
                    open={popconfirmOpen}
                    onConfirm={handleConfirmEditGroupName}
                    onCancel={handleCancelAddGroup}
                    okText="Agregar"
                    cancelText="Cancel"
                    getPopupContainer={() => centerDivRef.current}>
                    <div />
                </Popconfirm>
            </div>
            <Tabs
                className={style.routineTabsContainer}
                items={tabs}
                removeIcon={<MdEdit size={16} />}
                tabPosition='bottom'
                activeKey={groupId}
                onChange={handleOnChangeTab}
                onEdit={handleOnEditTab}
                style={{ width: '100%', height: '100%' }}
                type="editable-card" />
        </ConfigProvider>
    );
}

export default RoutineTabsContainer;