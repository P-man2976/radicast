import { RadiruAreaId } from "./schema.js";

export interface RadiruConfig {
	radiru_config: {
		info: string;
		stream_url: {
			data: {
				areajp: string;
				area: RadiruAreaId;
				apikey: number;
				areakey: number;
				r1hls: string;
				r2hls: string;
				fmhls: string;
			}[];
		};
		url_program_noa: string;
		url_program_day: string;
		url_program_detail: string;
		radiru_twitter_timeline: string;
	};
}
