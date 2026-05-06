import { tool } from "@opencode-ai/plugin";
console.log("plugin module loaded");

const fn = async (ctx) => {
  console.log("plugin function called with ctx:", typeof ctx);
  console.log("ctx keys:", Object.keys(ctx));
  console.log("ctx.client:", typeof ctx.client);
  console.log("ctx.client.session:", typeof ctx.client?.session);
  console.log("ctx.client.session.list:", typeof ctx.client?.session?.list);
  return { tool: {} };
};

export default fn;
