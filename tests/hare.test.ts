import { describe, it, test, expect } from "vitest";
import { Pika } from "../src/";

describe("test pika ", () => {
  test("should work", () => {
    type SomeExchanges = "hello" | "world";
    type SomeEvents = "hello.world" | "hello.world2";
    type Message = { hello: string };

    const h = new Pika<SomeExchanges, SomeEvents>("hello world");

    h.on("hello", "hello.world", async (message: Message) => {
      h.publish("world", "hello.world2", message);
    });
  });
});
