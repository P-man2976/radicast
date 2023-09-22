const authKey = "bcd151073c03b352e1ef2fd66c32209da9ca0afa";

const radikoAuthToken: { token: string | null; expire: Date | null } = {
	token: null,
	expire: null,
};

export async function getRadikoToken() {
	if ((radikoAuthToken.expire?.valueOf() ?? 0) < Date.now() || !radikoAuthToken.token) {
		return await authRadiko();
	} else {
		return radikoAuthToken.token;
	}
}

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

	// set token
	radikoAuthToken.token = authToken;
	radikoAuthToken.expire = new Date(Date.now() + 1000 * 60 * 8); // 8 mins

	console.log("[Server] Radiko auth token refreshed");

	return authToken;
}
