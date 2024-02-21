import ffmpeg from "fluent-ffmpeg";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { getRadikoArea, getRadikoStationList, authRadiko } from "../radiko";
import { Parser } from "m3u8-parser";
import { zValidator } from "@hono/zod-validator";
import { RadikoStationParams } from "../schema";
import { address, port } from ".";
import { HTTPException } from "hono/http-exception";

const radikoAuthToken: { token: string | null; expire: Date | null } = {
	token: null,
	expire: null,
};

export async function getRadikoToken() {
	if ((radikoAuthToken.expire?.valueOf() ?? 0) < Date.now() || !radikoAuthToken.token) {
		const token = await authRadiko();

		radikoAuthToken.token = token;
		radikoAuthToken.expire = new Date(Date.now() + 1000 * 60 * 8); // 8 mins

		return token;
	} else {
		return radikoAuthToken.token;
	}
}

const app = new Hono();

app.get("/live/:stationId", zValidator("param", RadikoStationParams), async (c) => {
	const { stationId } = c.req.param();

	const command = ffmpeg()
		.input(`http://${address}:${port}/radiko/m3u8/${stationId}`)
		.noVideo()
		.outputFormat("mp3")
		.on("error", (err, stdout, stderr) => {
			// console.error(`[Error] FFmpeg threw error:`, err);
			command.destroy();
			return;
		})
		.pipe(undefined, { end: true });

	c.header("Content-Type", "audio/mpeg");

	return stream(c, async (stream) => {
		const onData = async (chunk: Uint8Array) => {
			// console.log(`Write ${chunk.length} byte`);
			await stream.write(chunk);
		};

		stream.onAbort(() => {
			console.log("[Server] Stream aborted");
			// command.destroy();
			command.end();
			command.off("data", onData);
		});

		command.on("data", onData);
		command.on("end", async () => {
			await stream.close();
		});

		while (!command.closed) {
			await stream.sleep(100);
		}
	});
});

app.get("/m3u8/:stationId", async (c) => {
	const { stationId } = c.req.param();
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

	c.header("Content-Type", "application/x-mpegURL");

	return c.body(m3u8);
});

app.get("/stations/:areaId?", async (c) => {
	const { areaId } = c.req.param();
	const area = areaId ?? (await getRadikoArea());

	if (!area) throw new HTTPException(400);

	const stations = await getRadikoStationList(area);

	return c.render(
		<html>
			<body>
				<div>現在の地域ID: {area}</div>
				<table>
					<thead>
						<tr style={{ backgroundColor: "#ddd" }}>
							<th>ID</th>
							<th>局名</th>
							<th>エリアフリー</th>
							<th>タイムフリー</th>
						</tr>
					</thead>
					<tbody>
						{stations.map(({ id, name, areafree, timefree }) => (
							<tr>
								<th>
									<a href={`/radiko/live/${id}`}>{id}</a>
								</th>
								<th>{name}</th>
								<th>{areafree === 1 ? "○" : "×"}</th>
								<th>{timefree === 1 ? "○" : "×"}</th>
							</tr>
						))}
					</tbody>
				</table>
			</body>
		</html>
	);
});

export default app;
