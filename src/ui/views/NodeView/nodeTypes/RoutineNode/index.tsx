import React, { memo } from 'react';
import { Position } from '@xyflow/react';
import style from './style.module.css';
import CustomHandle from '@views/NodeView/component/CustomHandle';
import { Color } from '@common/theme/colors';
import NodeHeader from '@views/NodeView/component/NodeHeader';
import { FaTasks } from 'react-icons/fa';
import GroupHandle from '@views/NodeView/component/GroupHandle';
import TaskContainer from './components/TaskContainer';

export default memo(({ data, isConnectable }) => {
  return (
    <div className={style.routineNode}>
      <NodeHeader
        title={data.name || 'Routine Node'}
        icon={<FaTasks />} />

      <div className={style.defaultNodeContentainer}>

        <GroupHandle
          id="inputs"
          position={Position.Left}>
          <CustomHandle
            id='1'
            position={Position.Left}
            label="trigger"
            color={Color.green}
            isConnectable={isConnectable} />
        </GroupHandle>

        <GroupHandle
          id="outputs"
          position={Position.Right}>
          <CustomHandle
            color={Color.violet}
            id='2'
            position={Position.Right}
            label="on Start"
            isConnectable={isConnectable} />
          <CustomHandle
            color={Color.violet}
            id='3'
            position={Position.Right}
            label="on Complete"
            isConnectable={isConnectable} />

          <CustomHandle
            color={Color.violet}
            id='4'
            position={Position.Right}
            label="on Failure"
            isConnectable={isConnectable} />

          <CustomHandle
            color={Color.violet}
            id='5'
            position={Position.Right}
            label="on Abort"
            isConnectable={isConnectable} />
        </GroupHandle>
      </div>
      <TaskContainer/>
    </div>
  );
});
