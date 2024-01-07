import { describe, test, expect } from "vitest";
import { AMQPPika } from "../src/pika";
import { InMemoryPika } from "../src/in-memory-pika";

describe("test pika ", () => {
  test("amqp connection", async () => {
    type SomeExchanges = "hello" | "world";
    type SomeEvents = "hello.world" | "world.hello";

    const receivedEvents = {
      hello: {
        world: 0,
      },
      world: {
        hello: 0,
      },
    };
    const url = process.env.AMQP_URL ?? "amqp://guest:guest@localhost:5672/";

    const h = await AMQPPika.connect<SomeExchanges, SomeEvents>(url);

    //const h = new InMemoryPika();

    h.on("hello", "hello.world", async () => {
      receivedEvents.hello.world += 1;
    });

    h.on("world", "world.hello", async () => {
      receivedEvents.world.hello += 1;
    });

    const msg = { hello: "world" };

    await h.publish("hello", "hello.world", msg);
    await h.publish("hello", "hello.world", msg);
    await h.publish("hello", "hello.world", msg);
    await h.publish("hello", "hello.world", msg);
    await h.publish("hello", "hello.world", msg);

    await h.publish("world", "world.hello", msg);
    await h.publish("world", "world.hello", msg);
    await h.publish("world", "world.hello", msg);
    await h.publish("world", "world.hello", msg);

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(receivedEvents.hello.world).toBe(5);
    expect(receivedEvents.world.hello).toBe(4);
  });

  test("in memory pika", async () => {
    type SomeExchanges = "hello" | "world";
    type SomeEvents = "hello.world" | "world.hello";

    const receivedEvents = {
      hello: {
        world: 0,
      },
      world: {
        hello: 0,
      },
    };

    const h = new InMemoryPika<SomeExchanges, SomeEvents>();

    h.on("hello", "hello.world", async () => {
      receivedEvents.hello.world += 1;
    });

    h.on("world", "world.hello", async () => {
      receivedEvents.world.hello += 1;
    });

    const msg = { hello: "world" };

    await h.publish("hello", "hello.world", msg);
    await h.publish("hello", "hello.world", msg);
    await h.publish("hello", "hello.world", msg);
    await h.publish("hello", "hello.world", msg);
    await h.publish("hello", "hello.world", msg);

    await h.publish("world", "world.hello", msg);
    await h.publish("world", "world.hello", msg);
    await h.publish("world", "world.hello", msg);
    await h.publish("world", "world.hello", msg);

    expect(receivedEvents.hello.world).toBe(5);
    expect(receivedEvents.world.hello).toBe(4);
  });
});
