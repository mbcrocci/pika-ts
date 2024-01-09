import { ConsumerHandler, ErrorHandler, Pika } from "./pika";

type ExchangeMap<Ex extends string, E extends string> = {
  [key in Ex]: EventMap<E>;
};

type EventMap<E extends string> = {
  [key in E]: { onMessage: ConsumerHandler<any>; onError: ErrorHandler }[];
};

export class InMemoryPika<Ex extends string, E extends string>
  implements Pika<Ex, E>
{
  private exchanges: {
    [key in Ex]: {
      [key in E]: any[];
    };
  } = {} as ExchangeMap<Ex, E>;

  async on<T>(
    exchange: Ex,
    event: E,
    onMessage: ConsumerHandler<T>,
    onError?: ErrorHandler,
  ) {
    if (!this.exchanges[exchange]) {
      this.exchanges[exchange] = {} as EventMap<E>;
    }

    if (!this.exchanges[exchange][event]) {
      this.exchanges[exchange][event] = [];
    }

    this.exchanges[exchange][event].push({ onMessage, onError });
  }

  async publish<T>(exchange: Ex, event: E, msg: T) {
    if (!this.exchanges[exchange]) {
      this.exchanges[exchange] = {} as EventMap<E>;
    }

    if (!this.exchanges[exchange][event]) {
      this.exchanges[exchange][event] = [];
    }

    for (const { onMessage, onError } of this.exchanges[exchange][event]) {
      try {
        await onMessage(msg);
      } catch (err) {
        await onError(err);
      }
    }
  }
}
