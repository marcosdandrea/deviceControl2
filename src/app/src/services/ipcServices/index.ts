import SocketChannels from '@common/SocketChannels';
import projectServices from './projects.services';
import { Log } from '@src/utils/log';
import { receivedFromClients } from '../eventBridge/receivedFromClients';
import systemEvents from '@common/events/system.events';
import { getSystemTime } from './system.services';

const log = new Log('IPC Services', true);

const init = (io: import('socket.io').Server) => {

    io.on('connection', (socket) => {
        log.info('New client connected:', socket.id);

        socket.onAny(receivedFromClients)

        socket.on('disconnect', () => log.info('Client disconnected:', socket.id));
        socket.on(SocketChannels.getCurrentProject, () => projectServices.getCurrentProject(socket, io));
        socket.on(SocketChannels.loadProject, (payload) => projectServices.loadProject(payload, socket, io));
        socket.on(systemEvents.getSystemTime, getSystemTime)
    });

    log.info('IPC Services initialized with Socket.IO');
}

export default {
    init,
};