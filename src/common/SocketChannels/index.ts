
const SocketChannels = {
    getCurrentProject: 'getCurrentProject',
    updateProject: 'updateProject',
    loadProject: 'loadProject',
};

export default SocketChannels;
export type SocketChannelsType = keyof typeof SocketChannels;