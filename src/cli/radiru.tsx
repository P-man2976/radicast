import ffmpeg from "fluent-ffmpeg";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { stream } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { NHKStationParams } from "../schema.js";
import { getRadiruStationList } from "../radiru.js";

const app = new Hono();

app.get("/live/:areaId/:stationId", zValidator("param", NHKStationParams), async (c) => {
	const { areaId, stationId } = c.req.param() as NHKStationParams;
	const stationList = await getRadiruStationList();
	const streamUrl = stationList.radiru_config.stream_url.data.find(({ area }) => area === areaId)?.[stationId];

	if (!streamUrl) throw new HTTPException(404);

	const command = ffmpeg()
		.input(streamUrl)
		.noVideo()
		.outputFormat("mp3")
		.on("error", (err, stdout, stderr) => {
			// console.error(`[Error] FFmpeg threw error:`, { cause: { err } });
			command.destroy();
			return;
		})
		.pipe();

	c.header("Content-Type", "audio/mpeg");

	return stream(c, async (stream) => {
		const onData = async (chunk: Uint8Array) => {
			// console.log(`Write ${chunk.length} byte`);
			await stream.write(chunk);
		};

		stream.onAbort(() => {
			console.log("[Server] Stream aborted");
			command.destroy();
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

app.get("/stations", async (c) => {
	const stationList = await getRadiruStationList();

	return c.render(
		<html>
			<body>
				<table>
					<thead>
						<tr style={{ backgroundColor: "#ddd" }}>
							<th>放送局</th>
							<th>ラジオ第一</th>
							<th>ラジオ第二</th>
							<th>NHK-FM</th>
						</tr>
					</thead>
					<tbody>
						{stationList.radiru_config.stream_url.data.map(({ area, areajp }) => (
							<tr>
								<th>{areajp}</th>
								<th>
									<a href={`/nhk/live/${area}/r1hls`}>ラジオ第一</a>
								</th>
								<th>
									<a href={`/nhk/live/${area}/r2hls`}>ラジオ第二</a>
								</th>
								<th>
									<a href={`/nhk/live/${area}/fmhls`}>NHK-FM</a>
								</th>
							</tr>
						))}
					</tbody>
				</table>
			</body>
		</html>
	);
});

export default app;
