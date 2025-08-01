import SocketChannels from '@common/SocketChannels';
import { Log } from '@src/utils/log';

const log = new Log('IPC Services', true);

const init = (io: import('socket.io').Server) => {

    io.on('connection', (socket) => {
        log.info('New client connected:', socket.id);

        socket.on('disconnect', () => {
            log.info('Client disconnected:', socket.id);
        });

        socket.on(SocketChannels.getCurrentProject, async () => {
            log.info('Client requested current project');
            const { getCurrentProject } = await import('@src/domain/useCases/project/index.js');
            try {
                const project = getCurrentProject();
                socket.emit(SocketChannels.getCurrentProject, project);
                log.info('Current project sent to client:', project);
            } catch (error) {
                log.error('Error getting current project:', error.message);
                socket.emit(SocketChannels.getCurrentProject, { error: error.message });
            }
        });
    });

    log.info('IPC Services initialized with Socket.IO');
}

export default {
    init,
};