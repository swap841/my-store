import { SATARA_ZONES } from "./sataraZones";
import { getDistanceKm } from "./distance";

export function getAreaCode(lat: number, lng: number): string {
  for (const zone of SATARA_ZONES) {
    const dist = getDistanceKm(
      lat,
      lng,
      zone.center.lat,
      zone.center.lng
    );

    if (dist <= zone.radiusKm) {
      return zone.code;
    }
  }

  return "OUT_OF_SERVICE";
}