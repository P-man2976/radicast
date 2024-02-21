import { RadiruConfig } from "./types.js";
import { xmlParser } from "./xml-parser.js";

export async function getRadiruStationList (): Promise<RadiruConfig> {
	const stationList = await(await fetch("https://www.nhk.or.jp/radio/config/config_web.xml")).text();

	return xmlParser.parse(stationList);
}