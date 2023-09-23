import { XMLParser } from "fast-xml-parser";
import { RadiruConfig } from "./types.js";

const parser = new XMLParser();

export async function getRadiruStationList (): Promise<RadiruConfig> {
	const stationList = await(await fetch("https://www.nhk.or.jp/radio/config/config_web.xml")).text();

	return parser.parse(stationList);
}