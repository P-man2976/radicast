#!/usr/bin/env node

import { networkInterfaces } from "os";
import ffmpeg from "fluent-ffmpeg";
import express from "express";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Parser } from "m3u8-parser";
import { NHKStationParams, RadikoStationParams } from "./schema.js";
import { getRadikoToken } from "./radiko.js";
import { stationList } from "./radiru.js";
import { validator } from "./middleware.js";

const netInfos = networkInterfaces();
const interfaces = Object.values(netInfos).flatMap((val) => val ?? []);
const address = interfaces?.find(({ family }) => family === "IPv4")?.address ?? "127.0.0.1";

const argv = yargs(hideBin(process.argv)).option("port", {
	alias: "p",
	default: 8080,
	description: "HTTP server port number",
	type: "number",
}).argv;
const port = (await argv).port || 8080;

const app = express();

app.get("/radiko/:stationId", validator(RadikoStationParams), async (req, res) => {
	try {
		const { stationId } = req.params;

		const command = ffmpeg()
			.input(`http://${address}:${port}/radiko/m3u8/${stationId}`)
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

app.get("/radiko/m3u8/:stationId", async (req, res) => {
	try {
		const { stationId } = req.params;
		const authToken = await getRadikoToken();

		const parser = new Parser();
		parser.push(
			await (
				await fetch(
					`https://si-f-radiko.smartstream.ne.jp/so/playlist.m3u8?station_id=${stationId}&type=b&l=15&lsid=11cbd3124cef9e8004f9b5e9f77b66`,
					{ headers: { "X-Radiko-AuthToken": authToken } }
				)
			).text()
		);
		parser.end();

		const m3u8 = await (await fetch(parser.manifest.playlists[0].uri)).text();

		res.setHeader("Content-Type", "application/x-mpegURL");

		return res.status(200).send(m3u8);
	} catch (error) {
		console.error(error);
		res.status(500).send();
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

		const command = ffmpeg()
			.input(streamUrl)
			.noVideo()
			.outputFormat("mp3")
			.on("error", (err, stdout, stderr) => {
				console.error(`[Error] FFmpeg threw error:`, { cause: { err } });
				res.destroy();
				return;
			})
			.pipe();
		res.writeHead(200, {
			"Content-Type": "audio/mpeg",
		});
		command.pipe(res);
	} catch (error) {
		console.error("err", error);
		res.destroy();
	}
});

app.listen(port, () => console.log(`[Server] Started radicast server on http://${address}:${port}`));
