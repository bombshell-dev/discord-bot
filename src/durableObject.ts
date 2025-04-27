import { DurableObject } from "cloudflare:workers";

export class DiscordBotDurableObject extends DurableObject {
  async sayHello(): Promise<string> {
    return "Hello, World!";
  }
}
