import * as amqp from "amqplib";

type ConsumerHandler<M> = (msg: M) => Promise<void>;

export interface Pika<Exchanges extends string, Events extends string> {
  connect: (url: string) => void;
  on: <T>(
    exchange: Exchanges,
    event: Events,
    onMessage: ConsumerHandler<T>
  ) => void;
  publish: <T>(exchange: Exchanges, event: Events, msg: T) => void;
}

export class PikaImpl<Exchanges extends string, Events extends string>
  implements Pika<Exchanges, Events>
{
  private connection?: amqp.Connection = undefined;
  private pubChannel?: amqp.Channel = undefined;

  constructor(private url: string) {}

  async connect(url: string) {
    this.connection = await amqp.connect(url);
    this.pubChannel = await this.connection.createChannel();
  }

  private async registerConsumer<T>(
    exchange: Exchanges,
    routingKey: Events,
    onMessage: ConsumerHandler<T>
  ) {
    if (!this.connection) {
      await this.connect(this.url);
    }

    const ch = await this.connection!.createChannel();
    if (!ch) {
      throw new Error("can't create channel");
    }

    await ch.assertExchange(exchange, "topic", { durable: true });

    const queueName = routingKey.replaceAll(".", "-");
    const q = await ch.assertQueue(queueName, { durable: true });

    await ch.bindQueue(q.queue, exchange, routingKey);

    await ch.consume(q.queue, async (msg: any) => {
      if (!msg) {
        return;
      }

      try {
        const data = JSON.parse(msg.content.toString()) as T;
        await onMessage(data);

        ch.ack(msg);
      } catch (err) {
        ch.nack(msg);
      }
    });
  }

  on<M>(exchange: Exchanges, event: Events, onMessage: ConsumerHandler<M>) {
    this.registerConsumer(exchange, event, onMessage);
  }

  async publish<T>(exchange: Exchanges, event: Events, msg: T) {
    if (!this.connection) {
      await this.connect(this.url);
    }

    const body = Buffer.from(JSON.stringify(msg));

    this.pubChannel!.publish(exchange, event, body);
  }
}
