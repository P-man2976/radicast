#!/usr/bin/env node

import { networkInterfaces } from "os";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { serve } from "@hono/node-server";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import radikoRoute from "./radiko.js";
import radiruRoute from "./radiru.js";

console.log("[Server] Starting radicast server...");

const parser = yargs(hideBin(process.argv))
	.option("port", {
		alias: "p",
		default: 8080,
		description: "HTTP server port number",
		type: "number",
	})
	.option("cors", {
		alias: "c",
		default: false,
		description: "Add `Access-Control-Allow-Origin` Header",
		type: "boolean",
	});

export const port = parser.parseSync().port || 8080;
const isCorsEnabled = parser.parseSync().cors;

const netInfos = networkInterfaces();
const interfaces = Object.values(netInfos).flatMap((val) => val ?? []);
export const address = interfaces?.find(({ family }) => family === "IPv4")?.address ?? "127.0.0.1";

const app = new Hono();

if (isCorsEnabled) app.use(cors());

app.onError(async (err, c) => {
	if (err instanceof HTTPException) {
		// Get the custom response
		return err.getResponse();
	}
	console.error(err);
	return new Response("Server Error", { status: 500 });
});

app.route("/radiko", radikoRoute);
app.route("/nhk", radiruRoute);

serve({
	...app,
	port,
});
