import { AQMPChannel, Channel } from "./channel";
import * as amqp from "amqplib";

export interface Connection {
  connect: (url: string) => Promise<void>;
  createChannel: () => Promise<Channel | undefined>;
}

export class AMQPConnection implements Connection {
  private connection?: amqp.Connection = undefined;

  constructor() {}

  async connect(url: string) {
    this.connection = await amqp.connect(url);
  }

  async createChannel() {
    const amqpChannel = await this.connection?.createChannel();
    if (!amqpChannel) {
      return;
    }

    return new AQMPChannel(amqpChannel);
  }
}
