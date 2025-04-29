
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// --- Risk Calculation Logic Removed ---
// The calculateRiskPerSegment function and related helpers were removed
// as the heatmap and risk calculation feature using Leaflet is no longer implemented.
// This logic relied on client-side libraries not suitable for the current setup.

// Interface definitions removed as they are no longer used.
// interface AccidentData { ... }
// interface RoadSegment { ... }

