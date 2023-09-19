import { XMLParser } from "fast-xml-parser";
import { RadiruConfig } from "./types.js";

const parser = new XMLParser();
export const stationList: RadiruConfig = parser.parse(await(await fetch("https://www.nhk.or.jp/radio/config/config_web.xml")).text());
