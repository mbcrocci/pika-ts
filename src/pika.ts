import * as amqp from "amqplib";
import { AMQPConnection, Connection } from "./connection";
import { Channel } from "./channel";

type ConsumerHandler<M> = (msg: M) => Promise<void>;

export interface Pika<Exchanges extends string, Events extends string> {
  on: <T>(
    exchange: Exchanges,
    event: Events,
    onMessage: ConsumerHandler<T>,
  ) => void;
  publish: <T>(exchange: Exchanges, event: Events, msg: T) => void;
}

export class AMQPPika<Exchanges extends string, Events extends string>
  implements Pika<Exchanges, Events>
{
  private constructor(
    private url: string,
    private connection: Connection,
    private pubChannel: Channel,
  ) {}

  static async connect<Exchanges extends string, Events extends string>(
    url: string,
  ) {
    const conn = new AMQPConnection();
    await conn.connect(url);

    const pubChannel = await conn.createChannel();
    if (!pubChannel) {
      throw new Error("can't inititalize publishing channel");
    }

    return new AMQPPika<Exchanges, Events>(url, conn, pubChannel);
  }

  private async consume<M>(
    exchange: Exchanges,
    event: Events,
    onMessage: ConsumerHandler<M>,
  ) {
    const ch = await this.connection.createChannel();
    if (!ch) {
      throw new Error("can't create channel");
    }

    await ch.consume(exchange, event, onMessage);
  }

  on<M>(exchange: Exchanges, event: Events, onMessage: ConsumerHandler<M>) {
    this.consume(exchange, event, onMessage);
  }

  async publish<T>(exchange: Exchanges, event: Events, msg: T) {
    this.pubChannel.publish(exchange, event, msg);
  }
}
