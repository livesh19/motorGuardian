import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// --- Risk Calculation Logic Removed ---
// The calculateRiskPerSegment function was removed because it depended on Leaflet (L)
// which should only run on the client. This logic should be moved to the
// specific client component that needs it (e.g., navigation-page.tsx).

// Interface definitions remain if needed by other non-Leaflet utilities
// interface AccidentData {
//   latitude: number;
//   longitude: number;
//   count: number;
// }

// interface RoadSegment {
//   from: [number, number];
//   to: [number, number];
//   distanceKm: number;
//   roadName: string;
//   riskScore: number; // This might be pre-calculated or calculated here
// }
