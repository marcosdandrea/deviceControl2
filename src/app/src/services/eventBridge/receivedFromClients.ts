import { Log } from "@src/utils/log";

import eventManager from "../eventManager";
const log = new Log("ReceivedFromClients", true)

export const receivedFromClients = (event, ...args) => {
    const channel = `user.${event}`;
    eventManager.emit(channel, ...args);
}