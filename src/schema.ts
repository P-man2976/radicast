import { z } from "zod";

const RadiruAreaId = z.enum(["sapporo", "sendai", "tokyo", "nagoya", "osaka", "hiroshima", "matsuyama", "fukuoka"]);
export type RadiruAreaId = z.infer<typeof RadiruAreaId>

const RadiruStationId = z.enum(["r1hls" , "r2hls" , "fmhls"])
export type RadiruStationId = z.infer<typeof RadiruStationId>;

export const NHKStationParams = z.object({
	areaId: RadiruAreaId,
	stationId: RadiruStationId,
});
export type NHKStationParams = z.infer<typeof NHKStationParams>

export const RadikoStationParams = z.object({
	stationId: z.string()
})