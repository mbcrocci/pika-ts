import { Pika } from "./pika";

type ExchangeMap<Ex extends string, E extends string> = {
  [key in Ex]: EventMap<E>;
};

type EventMap<E extends string> = {
  [key in E]: any[];
};

export class InMemoryPika<Ex extends string, E extends string>
  implements Pika<Ex, E>
{
  private exchanges: {
    [key in Ex]: {
      [key in E]: any[];
    };
  } = {} as ExchangeMap<Ex, E>;

  async on<T>(exchange: Ex, event: E, onMessage: (msg: T) => Promise<void>) {
    if (!this.exchanges[exchange]) {
      this.exchanges[exchange] = {} as EventMap<E>;
    }

    if (!this.exchanges[exchange][event]) {
      this.exchanges[exchange][event] = [];
    }

    this.exchanges[exchange][event].push(onMessage);
  }

  async publish<T>(exchange: Ex, event: E, msg: T) {
    if (!this.exchanges[exchange]) {
      this.exchanges[exchange] = {} as EventMap<E>;
    }

    if (!this.exchanges[exchange][event]) {
      this.exchanges[exchange][event] = [];
    }

    for (const handler of this.exchanges[exchange][event]) {
      handler(msg);
    }
  }
}
