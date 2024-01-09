import { AMQPConnection, Connection } from "./connection";
import { Channel } from "./channel";

export type ConsumerHandler<M> = (msg: M) => Promise<void>;

/** @returns Promise<boolean> indicates if it should reject the message and requeue or not
 * */
export type ErrorHandler = (e: Error) => Promise<boolean>;

export interface Pika<Exchanges extends string, Events extends string> {
  on: <T>(
    exchange: Exchanges,
    event: Events,
    onMessage: ConsumerHandler<T>,
    oneError?: ErrorHandler,
  ) => void;
  publish: <T>(exchange: Exchanges, event: Events, msg: T) => void;
}

export class AMQPPika<Exchanges extends string, Events extends string>
  implements Pika<Exchanges, Events>
{
  private constructor(
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

    return new AMQPPika<Exchanges, Events>(conn, pubChannel);
  }

  private async consume<M>(
    exchange: Exchanges,
    event: Events,
    onMessage: ConsumerHandler<M>,
    onError?: ErrorHandler,
  ) {
    const ch = await this.connection.createChannel();
    if (!ch) {
      throw new Error("can't create channel");
    }

    await ch.consume(exchange, event, onMessage, onError);
  }

  on<M>(
    exchange: Exchanges,
    event: Events,
    onMessage: ConsumerHandler<M>,
    onError?: ErrorHandler,
  ) {
    this.consume(exchange, event, onMessage, onError);
  }

  async publish<T>(exchange: Exchanges, event: Events, msg: T) {
    this.pubChannel.publish(exchange, event, msg);
  }
}
