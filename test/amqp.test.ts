import { describe, it, expect, beforeAll } from "vitest";
import { AMQPPika } from "../src/pika";

describe("test pika ", () => {
  type SomeExchanges = "hello" | "world" | "error";
  type SomeEvents = "hello.world" | "world.hello" | "error";

  const url = process.env.AMQP_URL ?? "amqp://guest:guest@localhost:5672/";
  let h: AMQPPika<SomeExchanges, SomeEvents>;

  beforeAll(async () => {
    h = await AMQPPika.connect(url);
  });

  it("handles messages according to topics", async () => {
    const receivedEvents = {
      helloworld: 0,
      worldhello: 0,
    };

    h.on("hello", "hello.world", async () => {
      receivedEvents.helloworld += 1;
    });

    h.on("world", "world.hello", async () => {
      receivedEvents.worldhello += 1;
    });

    const msg = { hello: "world" };

    for (let i = 0; i < 5; i++) {
      await h.publish("hello", "hello.world", msg);
    }

    for (let i = 0; i < 4; i++) {
      await h.publish("world", "world.hello", msg);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(receivedEvents.helloworld).toBe(5);
    expect(receivedEvents.worldhello).toBe(4);
  });

  it("it handles errors and respects the hanlders return", async () => {
    let errors = 0;

    h.on(
      "error",
      "error",
      () => {
        throw new Error("some error");
      },
      async () => {
        errors += 1;

        return errors < 10;
      },
    );

    await h.publish("error", "error", { h: 1 });

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(errors).toBe(10);
  });
});
