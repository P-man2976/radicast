#!/usr/bin/env node

import ffmpeg from "fluent-ffmpeg";
import express, { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { NHKStationParams, RadikoStationParams } from "./schema.js";
import { authRadiko } from "./radiko.js";
import { stationList } from "./radiru.js";

const argv = yargs(hideBin(process.argv)).option("port", {
	alias: "p",
	default: 8080,
	description: "HTTP server port number",
	type: "number",
}).argv;
const port = (await argv).port || 8080;

const validator = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
	try {
		await schema.parseAsync({ ...req.params });
		return next();
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).send({
				error: error.flatten(),
			});
		}
	}
};

const app = express();

app.get("/radiko/:stationId", validator(RadikoStationParams), async (req, res) => {
	try {
		const { stationId } = req.params;
		const authToken = await authRadiko();

		const command = ffmpeg()
			.input(`https://radiko.jp/v2/api/ts/playlist.m3u8?station_id=${stationId}`)
			.inputOptions(["-headers", `X-Radiko-Authtoken:${authToken}`])
			.noVideo()
			.outputFormat("mp3")
			.on("error", (err, stdout, stderr) => {
				console.error(`[Error] FFmpeg threw error:`, { cause: { err } });
				res.destroy();
				return;
			})
			.pipe();

		res.header({
			"Content-Type": "audio/mpeg",
		});

		command.pipe(res);
	} catch (error) {
		console.error(error);
		res.destroy();
	}
});

app.get("/nhk/:areaId/:stationId", validator(NHKStationParams), async (req, res) => {
	try {
		const { areaId, stationId } = req.params as NHKStationParams;
		const streamUrl = stationList.radiru_config.stream_url.data.find(({ area }) => area === areaId)?.[stationId];

		if (!streamUrl) {
			res.status(404).send();
			return;
		}

		const command = ffmpeg().input(streamUrl).noVideo().outputFormat("mp3").pipe();
		res.writeHead(200, {
			"Content-Type": "audio/mpeg",
		});
		command.pipe(res);
	} catch (error) {
		console.error("err", error);
		res.destroy();
	}
});

app.listen(port, () => console.log(`[Server] Started radicast server on port ${port}`));
