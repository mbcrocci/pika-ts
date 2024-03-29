# Pika

A opinionated amqplib wrapper to make it easier to create evented systems.

## Example

```typescript
import { Pika } from "pika";

const pika = await Pika.connect("YOUR_RABBITMQ_URL");

// Consume example
pika.on("exchange", "routingKey", async (msg) => {
  // Do something with msg
});

// Publish Example
await pika.publish("exchange", "routingKey", { hello: "world" });
```

## Typed Example

You can also restrict exchanges and routingKeys to your own types.

```typescript
import { Pika } from "pika";

type Exchanges = "hello" | "world";
type Events = "hello.world" | "world.hello";

const pika = new Pika.connect<Exchanges, Events>("YOUR_RABBITMQ_URL");

// this won't compile now
pika.on("exchange", "routingKey", async (msg) => {});

// You must obey your Exchanges and Event types
// the  msg can also be typed
pika.on("hello", "hello.world", async (msg: MyType) => {});

// Publish Example
pika.publish("world", "world.hello", { hello: "world" });
```

## In Memory

If we want to use Pika in memory, maybe in tests, we can do it like this:

```typescript
import { InMemoryPika } from "pika";


const pika = new InMemoryPika();

pika.on("hello", "hello.world", async (msg: MyType) => {});
pika.publish("world", "world.hello", { hello: "world" });
`
```
