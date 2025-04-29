import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import L from 'leaflet'; // Import Leaflet for distance calculation


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// --- Risk Calculation Logic (Ported from Python) ---

interface AccidentData {
  latitude: number;
  longitude: number;
  count: number;
}

interface RoadSegment {
  from: [number, number];
  to: [number, number];
  distanceKm: number;
  roadName: string;
  riskScore: number; // This might be pre-calculated or calculated here
}

/**
 * Calculates the risk score for a road segment based on nearby accident data.
 * NOTE: This is a simplified client-side calculation. For production,
 *       it's better to calculate this on the backend or during a build step.
 */
export function calculateRiskPerSegment(
  accidentData: AccidentData[],
  segments: RoadSegment[],
  thresholdKm: number = 0.5 // How close an accident needs to be to a segment
): RoadSegment[] {
    return segments.map(segment => {
        let nearbyAccidentCount = 0;
        const segmentLatLngs: L.LatLngExpression[] = [segment.from, segment.to]; // Basic line segment

        for (const accident of accidentData) {
            const accidentLatLng = L.latLng(accident.latitude, accident.longitude);
            // Use Leaflet's geometry utils to check distance to the line segment
            // This is a simplification; true distance requires more complex geometry checks
            // or using a library like turf.js. For simplicity, check distance to endpoints.
            const distToStart = L.latLng(segment.from).distanceTo(accidentLatLng) / 1000;
            const distToEnd = L.latLng(segment.to).distanceTo(accidentLatLng) / 1000;

            if (distToStart <= thresholdKm || distToEnd <= thresholdKm) {
                nearbyAccidentCount += accident.count;
            }
            // A more accurate check would involve `L.GeometryUtil.distanceToSegment` if available
            // or a similar geometric calculation.
        }

        // Calculate risk score (e.g., accidents per km)
        // Avoid division by zero
        const riskScore = segment.distanceKm > 0 ? nearbyAccidentCount / segment.distanceKm : 0;

        return {
            ...segment,
            // Override or set the riskScore based on calculation
            riskScore: parseFloat(riskScore.toFixed(2)) // Keep 2 decimal places
        };
    });
}
