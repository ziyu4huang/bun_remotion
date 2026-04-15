import * as readline from "node:readline";
import { createAgent } from "../agent.js";
import { renderEvent } from "./renderer.js";
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";

export async function startCli() {
  const agent = createAgent();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  agent.subscribe((event) => {
    renderEvent(event);
  });

  console.log("Pi Agent CLI — coding assistant powered by pi-agent");
  console.log("Commands: /quit, /clear, /model <provider/model>");
  console.log("");

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input === "/quit" || input === "/exit") {
      agent.abort();
      rl.close();
      process.exit(0);
    }

    if (input === "/clear") {
      agent.reset();
      console.log("Conversation cleared.\n");
      rl.prompt();
      return;
    }

    if (input.startsWith("/model ")) {
      const modelStr = input.slice(7).trim();
      if (modelStr) {
        try {
          const [provider, ...nameParts] = modelStr.split("/");
          const modelName = nameParts.join("/");
          const apiKey = getEnvApiKey(provider as any);
          if (!apiKey) {
            console.log(`No API key for "${provider}". Set the environment variable and restart.\n`);
          } else {
            const model = getModel(provider as any, modelName as any);
            agent.state.model = model;
            console.log(`Model switched to ${provider}/${modelName}\n`);
          }
        } catch (e) {
          console.log(`Invalid model: ${e}\n`);
        }
      }
      rl.prompt();
      return;
    }

    // Normal prompt
    try {
      await agent.prompt(input);
    } catch (e) {
      console.error(`\nError: ${e}`);
    }

    rl.prompt();
  });

  rl.on("close", () => {
    process.exit(0);
  });
}
