import { describe, expect, it } from "vitest";
import { InMemoryPika } from "../src/in-memory-pika";

describe("In memory for testing purposes", () => {
  it("handles happy path", async () => {
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

  it("supports error handling", async () => {
    const h = new InMemoryPika<"e", "e">();

    let recvErrors = 0;

    h.on(
      "e",
      "e",
      async () => {
        throw new Error("some error");
      },
      async () => {
        recvErrors += 1;
        return false;
      },
    );

    for (let i = 0; i < 10; i++) {
      await h.publish("e", "e", { hi: 1 });
    }

    expect(recvErrors).toBe(10);
  });
});
