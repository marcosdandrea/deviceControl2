import net from 'net';
import express from 'express';
import { createServer } from "http";
import { Log } from '@src/utils/log';
import cors from 'cors';

const log = new Log('Server', true);

interface ServerProps {
  port?: number;               // Puerto fijo (opcional)
  ip?: string;                // IP a bindear (opcional, default '0.0.0.0')
  portRangeStart?: number;    // Rango para buscar puerto libre (default 3000)
  portRangeEnd?: number;      // Rango para buscar puerto libre (default 5000)
  useSocketIO?: boolean; // Si se usa Socket.IO (default false)
}

export class Server {
  private static instance: Server | null;

  private app: express.Express;
  private httpServer: import('http').Server;
  private router: express.Router;
  private serverListener?: import('http').Server;

  public port: number;
  public ip: string;
  public io: import('socket.io').Server | null;
  public useSocketIO: boolean = false;
  private routes: Set<string> = new Set();

  private constructor(props: ServerProps = {}) {
    if (props.port && (typeof props.port !== 'number' || props.port <= 0 || props.port > 65535)) {
      throw new Error('Invalid port number. It must be a number between 1 and 65535.');
    }

    const ipMask = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (props.ip && (typeof props.ip !== 'string' || !ipMask.test(props.ip))) {
      throw new Error('Invalid IP address format. It must be a valid IPv4 address.');
    }

    this.useSocketIO = props.useSocketIO || false;
    this.ip = props.ip || '0.0.0.0';
    this.app = express();
    this.httpServer = createServer(this.app);

    if (this.useSocketIO)
      this.io = require('socket.io')(this.httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      });

    this.router = express.Router();
    this.app.use(cors())
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(this.router); // Router dedicado para rutas dinámicas

    this.port = props.port || 0; // 0 indica que buscará puerto libre
  }

  static async getInstance(props?: ServerProps): Promise<Server> {
    if (!Server.instance) {
      const server = new Server(props);
      await server.initPort(props);
      await server.start();
      Server.instance = server;
    }
    return Server.instance;
  }

  private async initPort(props: ServerProps = {}) {
    if (this.port && this.port !== 0) {
      // Puerto definido explícitamente, no buscar
      return;
    }

    const start = props.portRangeStart ?? 3000;
    const end = props.portRangeEnd ?? 5000;

    for (let p = start; p <= end; p++) {
      const isFree = await this.checkPortFree(p);
      if (isFree) {
        this.port = p;
        log.info(`Found free port: ${p}`);
        return;
      }
    }

    throw new Error(`No free port found in range ${start}-${end}`);
  }

  private checkPortFree(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          tester.once('close', () => resolve(true));
          tester.close();
        })
        .listen(port, this.ip);
    });
  }

  private start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.serverListener = this.httpServer.listen(this.port, this.ip, () => {
          log.info(`Server started at http://${this.ip}:${this.port}`);
          resolve();
        });
        /*this.serverListener = this.app.listen(this.port, this.ip, () => {
          log.info(`Server started at http://${this.ip}:${this.port}`);
          resolve();
        });*/
      } catch (error) {
        log.error('Failed to start server:', error);
        reject(error);
      }
    });
  }

  getIO(): import('socket.io').Server | null {
    return this.io;
  }

  setStaticFiles(path: string) {
    log.info(`Serving static files from: ${path}`);

    this.app.use(express.static(path));

    this.app.get('/control', (_: express.Request, res: express.Response) => {
      res.sendFile('index.html', { root: path });
    });

    this.app.get('/builder', (_: express.Request, res: express.Response) => {
      res.sendFile('index.html', { root: path });
    });

  }

  bindRoute(route: string, callback: Function) {
    const routeRegex = /^\/[a-zA-Z0-9_\/\-\*]*$/;
    if (!routeRegex.test(route)) {
      throw new Error(
        'Invalid route format. It must start with a slash and contain only alphanumeric characters, underscores, slashes, dashes, or asterisks.'
      );
    }

    if (route.startsWith('/builder') || route.startsWith('/control')) {
      throw new Error('Routes starting with /builder or /control are reserved and cannot be bound.');
    }

    if (this.routes.has(route)) {
      throw new Error(`Route "${route}" is already bound.`);
    }

    const handleOnRoute = (_req: express.Request, res: express.Response) => {
      try {
        log.info(`Received request on route: ${route}`);
        callback(_req, res);
        if (!res.headersSent)
          res.status(200).send(`Handled route: ${route}`);

      } catch (error) {
        log.error(`Error handling route ${route}:`, error);
        res.status(500).send(`Internal server error handling route ${route}`);
      }
    };

    this.router.get(route, handleOnRoute);
    this.routes.add(route);
    log.info(`Route "${route}" bound successfully.`);
  }

  unbindRoute(route: string) {
    if (!this.routes.has(route)) {
      throw new Error(`Route ${route} is not bound.`);
    }

    this.router.stack = this.router.stack.filter(
      (layer: any) => !(layer.route && layer.route.path === route && layer.route.methods.get)
    );

    this.routes.delete(route);
    log.info(`Route ${route} unbound successfully.`);
  }

  unbindAllRoutes() {
    this.router.stack = [];
    this.routes.clear();
  }

  close() {
    if (this.serverListener) {
      this.serverListener.close(() => {
        log.info('Server stopped.');
      });
      this.serverListener = undefined;
    }
  }

  static resetInstance() {
    if (Server.instance) {
      Server.instance.close();
      Server.instance = null;
    }
  }
}
