import { RadikoStation } from "./types.js";
import { xmlParser } from "./xml-parser.js";

const authKey = "bcd151073c03b352e1ef2fd66c32209da9ca0afa";

export async function authRadiko() {
	const resAuth1 = await fetch("https://radiko.jp/v2/api/auth1", {
		headers: { "X-Radiko-App": "pc_html5", "X-Radiko-App-Version": "0.0.1", "X-Radiko-Device": "pc", "X-Radiko-User": "dummy_user" },
	});

	if (resAuth1.status !== 200) throw new Error("[Error] Radiko Auth1 failed", { cause: resAuth1 });

	const authToken = resAuth1.headers.get("X-Radiko-AuthToken");
	const keyLength = Number(resAuth1.headers.get("X-Radiko-Keylength"));
	const keyOffset = Number(resAuth1.headers.get("X-Radiko-Keyoffset"));
	const partialKey = btoa(authKey.slice(keyOffset, keyOffset + keyLength));

	if (!authToken) throw new Error("[Error] Failed to get X-Radiko-AuthToken");

	const resAuth2 = await fetch("https://radiko.jp/v2/api/auth2", {
		headers: { "X-Radiko-AuthToken": authToken, "X-Radiko-PartialKey": partialKey, "X-Radiko-Device": "pc", "X-Radiko-User": "dummy_user" },
	});

	if (resAuth2.status !== 200) throw new Error("[Error] Radiko Auth2 failed", { cause: resAuth2 });

	console.log("[Server] Radiko auth token refreshed");

	return authToken;
}

export async function getRadikoArea() {
	const res = await fetch("https://radiko.jp/area");

	const areaCode = (await res.text()).match(/class="(.*)"/)?.[1];

	return areaCode;
}

export async function getRadikoStationList(area: string): Promise<RadikoStation[]> {
	const res = await fetch(`https://radiko.jp/v3/station/list/${area}.xml`);

	return xmlParser.parse(await res.text()).stations.station;
}
