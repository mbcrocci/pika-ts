import type { Connection } from './connection'
import { AMQPConnection } from './connection'
import type { Channel } from './channel'

export type ConsumerHandler<M> = (msg: M) => Promise<void>

/**
 * @returns Promise<boolean> indicates if it should reject the message and requeue or not
 */
export type ErrorHandler = (e: Error) => Promise<boolean>

export interface Pika<Exchanges extends string, Events extends string> {
  on: <T>(
    exchange: Exchanges,
    event: Events,
    onMessage: ConsumerHandler<T>,
    oneError?: ErrorHandler,
  ) => void
  publish: <T>(exchange: Exchanges, event: Events, msg: T) => void
}

export class AMQPPika<Exchanges extends string, Events extends string>
implements Pika<Exchanges, Events> {
  public constructor(private url: string) {}

  status: 'closed' | 'connecting' | 'connected' = 'closed'
  connection?: Connection
  pubChannel?: Channel

  private async waitConnection() {
    if (this.status === 'closed')
      return

    while (this.status === 'connecting')
      await new Promise(resolve => setTimeout(resolve, 50))
  }

  private async connect() {
    if (this.status === 'connected')
      return
    if (this.status === 'connecting') {
      await this.waitConnection()
      return
    }

    this.status = 'connecting'
    this.connection = new AMQPConnection()
    await this.connection.connect(this.url)

    const pubChannel = await this.connection.createChannel()
    if (!pubChannel)
      throw new Error('can\'t inititalize publishing channel')

    this.pubChannel = pubChannel
    this.status = 'connected'
  }

  private async consume<M>(
    exchange: Exchanges,
    event: Events,
    onMessage: ConsumerHandler<M>,
    onError?: ErrorHandler,
  ) {
    if (this.status !== 'connected')
      await this.connect()

    const ch = await this.connection!.createChannel()
    if (!ch)
      throw new Error('can\'t create channel')

    await ch.consume(exchange, event, onMessage, onError)
  }

  on<M>(
    exchange: Exchanges,
    event: Events,
    onMessage: ConsumerHandler<M>,
    onError?: ErrorHandler,
  ) {
    this.consume(exchange, event, onMessage, onError)
  }

  async publish<T>(exchange: Exchanges, event: Events, msg: T) {
    if (this.status !== 'connected')
      await this.connect()

    this.pubChannel!.publish(exchange, event, msg)
  }
}
