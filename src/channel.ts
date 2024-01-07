import * as amqp from "amqplib";
import { destr } from "destr";

export interface Channel {
  consume: (
    exchange: string,
    topic: string,
    onMessage: (msg: any) => Promise<void>,
  ) => Promise<void>;

  publish: (exchange: string, topic: string, msg: unknown) => Promise<void>;
}

export class AQMPChannel implements Channel {
  constructor(private ch: amqp.Channel) {}

  async consume<T>(
    exchange: string,
    topic: string,
    onMessage: (msg: T) => Promise<void>,
  ) {
    await this.ch.assertExchange(exchange, "topic", { durable: true });

    const queueName = topic.replaceAll(".", "-");
    const q = await this.ch.assertQueue(queueName, { durable: true });

    await this.ch.bindQueue(q.queue, exchange, topic);

    await this.ch.consume(q.queue, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const data = destr<T>(msg.content.toString());
        await onMessage(data);

        this.ch.ack(msg);
      } catch (err) {
        this.ch.nack(msg);
      }
    });
  }

  async publish(exchange: string, topic: string, msg: unknown) {
    const body = Buffer.from(JSON.stringify(msg));

    this.ch.publish(exchange, topic, body);
  }
}
