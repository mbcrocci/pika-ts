import * as amqp from "amqplib";
import { destr } from "destr";
import { ConsumerHandler, ErrorHandler } from "./pika";

export interface Channel {
  consume: (
    exchange: string,
    topic: string,
    onMessage: ConsumerHandler<any>,
    onError?: ErrorHandler,
  ) => Promise<void>;

  publish: (exchange: string, topic: string, msg: unknown) => Promise<void>;
}

export class AQMPChannel implements Channel {
  constructor(private ch: amqp.Channel) {}

  async consume<T>(
    exchange: string,
    topic: string,
    onMessage: ConsumerHandler<T>,
    onError?: ErrorHandler,
  ) {
    await this.ch.assertExchange(exchange, "topic", { durable: true });

    const queueName = topic.replaceAll(".", "-");
    const q = await this.ch.assertQueue(queueName, { durable: true });

    await this.ch.bindQueue(q.queue, exchange, topic);

    await this.ch.consume(q.queue, async (msg) => {
      if (!msg) {
        console.error("no message");
        return;
      }

      let reject = false;

      try {
        const data = destr<T>(msg.content.toString());
        await onMessage(data);
      } catch (err) {
        reject = true;

        if (onError) {
          reject = await onError(wrapError(err));
        }
      } finally {
        if (reject) {
          this.ch.nack(msg);
        } else {
          this.ch.ack(msg);
        }
      }
    });
  }

  async publish(exchange: string, topic: string, msg: unknown) {
    const body = Buffer.from(JSON.stringify(msg));

    this.ch.publish(exchange, topic, body);
  }
}

function wrapError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }

  return new Error(String(err));
}
