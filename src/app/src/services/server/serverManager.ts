import { Log } from "@src/utils/log";
import { Server, ServerProps } from ".";
const log = Log.createInstance('ServerManager', true);


export class ServerManager {
  private static instances: Map<string, Server> = new Map();

  private constructor() {}

  public static getInstance(name: string): Server {
    if (!ServerManager.instances.has(name)) {
      throw new Error(`ServerManager instance with name "${name}" does not exist.`);
    }

    return ServerManager.instances.get(name)!;
  }

  public static async createInstance(props: ServerProps): Promise<Server> {

    if (ServerManager.instances.has(props.name)) {
      throw new Error(`ServerManager instance with name "${props.name}" already exists.`);
    }

    if (props?.port) {
        //If port is specified checks if it is being used by another instance
        const existingInstance = Array.from(this.instances.values()).find(instance => instance.port === props.port);
        if (existingInstance) {
            throw new Error(`Port ${props.port} is already in use by ${existingInstance.name} Server.`);
        }
    }

    const instance = await Server.createInstance(props);
    ServerManager.instances.set(props.name, instance);
    return instance;
  }

}

