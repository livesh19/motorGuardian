tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle, Popup, Tooltip } from 'react-leaflet';
// Removed HeatMapLayer import as dependency is removed
// import HeatMapLayer from './heatmap-layer';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


// Import mock accident data
import accidentsData from '@/data/chennai-accidents.json';

//Import utils
import { calculateRiskPerSegment } from '@/lib/utils';

// Correctly import the custom marker icon
import markerIconPng from "leaflet/dist/images/marker-icon.png";


// Define the segment risk data type
interface SegmentRiskData {
  roadName: string;
  riskScore: number;
  accidentCount: number;
}

// Now you can use L.icon as intended
const customMarkerIcon = L.icon({
  iconUrl: markerIconPng.src,
  // iconRetinaUrl: markerIconPng.src, // Retina URL might be same or different depending on asset
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],     // size of the icon
  iconAnchor: [12, 41],    // point of the icon which will correspond to marker's location
  popupAnchor: [1, -34],   // point from which the popup should open relative to the iconAnchor
  shadowSize: [41, 41]     // size of the shadow
});



// Mock data for Chennai landmarks, replace with API later
const chennaiLandmarks = ["T. Nagar", "Anna Salai", "Adyar", "Nungambakkam", "Mylapore", "Besant Nagar"];


// Define AccidentData interface
interface AccidentData {
  latitude: number;
  longitude: number;
  count: number;
}

// Mocked road graph for demonstration (replace with actual data)
interface RoadSegment {
  from: [number, number];
  to: [number, number];
  distanceKm: number;
  roadName: string;
  riskScore: number; // Mock risk score
}

const mockedRoadGraph: RoadSegment[] = [
  { from: [13.0827, 80.2707], to: [13.0604, 80.2478], distanceKm: 2.8, roadName: "Poonamallee High Road", riskScore: 3 }, // Moderate Risk
  { from: [13.0604, 80.2478], to: [13.0479, 80.2139], distanceKm: 3.5, roadName: "Nelson Manickam Road", riskScore: 4 }, // High Risk
  { from: [13.0479, 80.2139], to: [13.0080, 80.2800], distanceKm: 7.2, roadName: "Sardar Patel Road (Adyar)", riskScore: 2 }, // Low-Moderate Risk
  { from: [13.0827, 80.2707], to: [13.0479, 80.2139], distanceKm: 6.5, roadName: "EVK Sampath Road -> Anna Nagar", riskScore: 5 }, // High Risk Alternative
  { from: [13.0604, 80.2478], to: [13.0827, 80.2707], distanceKm: 2.8, roadName: "Poonamallee High Road (Return)", riskScore: 3 }, // Return Path
  { from: [13.0479, 80.2139], to: [13.0604, 80.2478], distanceKm: 3.5, roadName: "Nelson Manickam Road (Return)", riskScore: 4 },
  { from: [13.0080, 80.2800], to: [13.0479, 80.2139], distanceKm: 7.2, roadName: "Sardar Patel Road (Return)", riskScore: 2 },
   { from: [13.0479, 80.2139], to: [13.0827, 80.2707], distanceKm: 6.5, roadName: "Anna Nagar -> EVK Sampath Road (Return)", riskScore: 5 },
    // Add a safer but longer route segment
   { from: [13.0827, 80.2707], to: [13.0080, 80.2800], distanceKm: 10.0, roadName: "Coastal Road (Hypothetical Safer Route)", riskScore: 1 }, // Low Risk
   { from: [13.0080, 80.2800], to: [13.0827, 80.2707], distanceKm: 10.0, roadName: "Coastal Road (Return)", riskScore: 1 },
];



// Function to mock Dijkstra's algorithm for route calculation
const calculateRoute = (
  start: [number, number],
  end: [number, number],
  roadGraph: RoadSegment[],
  beta: number = 2 // Default beta value for balanced
): { route: [number, number][]; totalDistance: number; totalRisk: number; segmentRisks: SegmentRiskData[] } => {

  // Super simplified pathfinding: Find direct segments or a two-step path
  const route: [number, number][] = [start];
  let totalDistance = 0;
  let totalRisk = 0;
  const segmentRisks: SegmentRiskData[] = [];
  let current = start;

  // Check for direct connection first, considering beta
  let bestDirectSegment: RoadSegment | null = null;
  let minDirectCost = Infinity;

  for (const segment of roadGraph) {
     if (segment.from[0] === start[0] && segment.from[1] === start[1] &&
        segment.to[0] === end[0] && segment.to[1] === end[1]) {
          const cost = segment.distanceKm + beta * segment.riskScore;
          if(cost < minDirectCost){
              minDirectCost = cost;
              bestDirectSegment = segment;
          }
     }
  }

  if (bestDirectSegment) {
    route.push(bestDirectSegment.to);
    totalDistance = bestDirectSegment.distanceKm;
    totalRisk = bestDirectSegment.riskScore;
    segmentRisks.push({ roadName: bestDirectSegment.roadName, riskScore: bestDirectSegment.riskScore, accidentCount: Math.round(bestDirectSegment.riskScore * 5) }); // Mock accident count
    return { route, totalDistance, totalRisk, segmentRisks };
  }


  // If no direct route, try finding the best first step based on cost
  let bestFirstStep: RoadSegment | null = null;
  let minFirstStepCost = Infinity;

  for (const segment of roadGraph) {
    if (segment.from[0] === current[0] && segment.from[1] === current[1]) {
        // Estimate remaining cost (simple heuristic: distance to end + risk)
        const remainingDistance = L.latLng(segment.to).distanceTo(L.latLng(end)) / 1000; // Approx distance
        const estimatedTotalCost = (segment.distanceKm + beta * segment.riskScore) + (remainingDistance + beta * 2); // Assume average risk=2 for remaining

        if (estimatedTotalCost < minFirstStepCost) {
            minFirstStepCost = estimatedTotalCost;
            bestFirstStep = segment;
        }
    }
  }

  if (bestFirstStep) {
    route.push(bestFirstStep.to);
    totalDistance += bestFirstStep.distanceKm;
    totalRisk += bestFirstStep.riskScore;
    segmentRisks.push({ roadName: bestFirstStep.roadName, riskScore: bestFirstStep.riskScore, accidentCount: Math.round(bestFirstStep.riskScore * 5) });
    current = bestFirstStep.to;

    // Find the best second step to reach the destination
     let bestSecondStep: RoadSegment | null = null;
     let minSecondStepCost = Infinity;
     for (const segment of roadGraph) {
        if (segment.from[0] === current[0] && segment.from[1] === current[1] &&
            segment.to[0] === end[0] && segment.to[1] === end[1]) {
             const cost = segment.distanceKm + beta * segment.riskScore;
              if(cost < minSecondStepCost){
                minSecondStepCost = cost;
                bestSecondStep = segment;
             }
        }
     }

      if(bestSecondStep){
          route.push(bestSecondStep.to);
          totalDistance += bestSecondStep.distanceKm;
          totalRisk += bestSecondStep.riskScore;
          segmentRisks.push({ roadName: bestSecondStep.roadName, riskScore: bestSecondStep.riskScore, accidentCount: Math.round(bestSecondStep.riskScore * 5) });
      } else {
          // If no second step reaches the end, just add the end point (visual approximation)
          if(!(current[0] === end[0] && current[1] === end[1])) {
             route.push(end);
             // Add estimated distance/risk for the last leg if needed for totals
             const lastLegDistance = L.latLng(current).distanceTo(L.latLng(end)) / 1000;
             totalDistance += lastLegDistance;
             // totalRisk += some_estimated_risk; // Optional: Add risk for the last visual leg
             segmentRisks.push({ roadName: "Direct to Destination", riskScore: 2, accidentCount: 10}); // Example placeholder
          }
      }


  } else {
      // If no segments found from start, just draw a line to the end
       if(!(current[0] === end[0] && current[1] === end[1])) {
         route.push(end);
         totalDistance = L.latLng(start).distanceTo(L.latLng(end)) / 1000;
         totalRisk = 2 * totalDistance; // Estimate risk based on distance
         segmentRisks.push({ roadName: "Direct Route", riskScore: 2, accidentCount: Math.round(totalRisk * 5)});
       }
  }


  return { route, totalDistance, totalRisk, segmentRisks };
};


// Framer Motion popup variants
const popupVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

const NavigationPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [sourceCoords, setSourceCoords] = useState<[number, number] | null>(null);
   // Default to a known Chennai landmark if geolocation fails or isn't available
   const defaultLocation: [number, number] = [13.0479, 80.2139]; // Example: Nungambakkam
  const [destination, setDestination] = useState<string>('');
  const [isRouteCalculated, setIsRouteCalculated] = useState<boolean>(false);
  const [route, setRoute] = useState<[number, number][]>([]); // Route path coordinates
  const mapRef = useRef<L.Map | null>(null); // Ref for the map instance
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [beta, setBeta] = useState<number>(2); // State for beta value, default to balanced
  const [totalDistance, setTotalDistance] = useState<number>(0); // State for total distance
  const [totalRisk, setTotalRisk] = useState<number>(0); // State for total risk
  const [segmentRisks, setSegmentRisks] = useState<SegmentRiskData[]>([]); // State for total risk
   const [selectedDestinationCoords, setSelectedDestinationCoords] = useState<[number, number] | null>(null);

    // Mock coordinates for landmarks
    const landmarkCoords: { [key: string]: [number, number] } = {
        "T. Nagar": [13.0408, 80.2344],
        "Anna Salai": [13.0550, 80.2650], // Approx center
        "Adyar": [13.0080, 80.2589],
        "Nungambakkam": [13.0604, 80.2478],
        "Mylapore": [13.0355, 80.2712],
        "Besant Nagar": [13.0010, 80.2699],
         // Add coordinates corresponding to roadGraph endpoints if needed as landmarks
         "Central Station Area": [13.0827, 80.2707],
         "Marina Beach Area": [13.0080, 80.2800] // Endpoint C
    };


  // Calculate the risk per segment (Consider doing this on the server or build step for performance)
//   const riskPerSegment = useMemo(() => {
//     return calculateRiskPerSegment(accidentsData, mockedRoadGraph);
//   }, []);



  // Geolocation hook
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition( //get the user's location
        (position) => {
          const { latitude, longitude } = position.coords;
          setSourceCoords([latitude, longitude]);
          toast({
            title: "Location Found",
            description: `Current location set.`,
            duration: 3000,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
           setSourceCoords(defaultLocation); // Use default if error
          toast({
            title: "Location Error",
            description: "Could not get location. Using default: Nungambakkam.",
            variant: "destructive",
            duration: 5000,
          });
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
       setSourceCoords(defaultLocation); // Use default if not supported
      toast({
        title: "Location Unavailable",
        description: "Geolocation not supported. Using default: Nungambakkam.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [toast]); // Only run once on mount

  // Function to manually set current location (placeholder)
  const handleManualLocation = () => {
    // For demo, just re-trigger geolocation or set to default
     if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => { /* ... */ }, (error) => { setSourceCoords(defaultLocation); /* ... */ }
        );
    } else {
        setSourceCoords(defaultLocation);
    }
    toast({
      title: "Location",
      description: "Attempting to use current location.",
    });
  };

  // Update route when a destination is selected or beta changes
   const handleCalculateRoute = () => {
      if (destination && sourceCoords) {
          const destCoords = landmarkCoords[destination];
          if (destCoords) {
              setSelectedDestinationCoords(destCoords);
              const calculatedRoute = calculateRoute(sourceCoords, destCoords, mockedRoadGraph, beta);
              setRoute(calculatedRoute.route);
              setTotalDistance(calculatedRoute.totalDistance);
              setTotalRisk(calculatedRoute.totalRisk);
              setSegmentRisks(calculatedRoute.segmentRisks);
              setIsRouteCalculated(true);

              // Center map view on the route
              if (mapRef.current && calculatedRoute.route.length > 0) {
                  const bounds = L.latLngBounds(calculatedRoute.route);
                   try {
                        mapRef.current.flyToBounds(bounds, { padding: [50, 50] }); // Add padding
                    } catch (e) {
                        console.error("Error flying to bounds:", e);
                        mapRef.current.fitBounds(bounds, { padding: [50, 50] }); // Fallback to fitBounds
                    }
              }


              const hasHighRiskSegments = calculatedRoute.segmentRisks.some((seg) => seg.riskScore > 3);
              setShowWarningPopup(hasHighRiskSegments);
          } else {
               toast({ title: "Error", description: "Destination not found.", variant: "destructive" });
               setIsRouteCalculated(false);
               setRoute([]);
               setShowWarningPopup(false);
          }
      } else if (!sourceCoords) {
          toast({ title: "Error", description: "Source location not available.", variant: "destructive" });
      } else {
          // Clear route if destination is cleared
          setIsRouteCalculated(false);
          setRoute([]);
          setShowWarningPopup(false);
          setSelectedDestinationCoords(null);
      }
  };

   // Trigger calculation when destination or beta changes
   useEffect(() => {
     // We call handleCalculateRoute directly here, or trigger it via a button click
     // handleCalculateRoute(); // Auto-calculate on change
     // If you want calculation only on button click, remove this useEffect hook
     // and rely on the "Find Route" button's onClick handler.
     // Let's keep it manual for now, triggered by the button.
      if (isRouteCalculated) { // Recalculate if already calculated and beta changes
          handleCalculateRoute();
       }
   }, [beta, destination, sourceCoords]); // Dependencies for recalculation


   // Function to handle "Find Route" button click
    const handleFindRouteClick = () => {
        if (!destination) {
            toast({ title: "Input Needed", description: "Please enter a destination.", variant: "destructive" });
            return;
        }
        handleCalculateRoute(); // Perform the calculation
    };


  // Function to generate heatmap data from accident data
  // const generateHeatmapData = (data: AccidentData[]): L.LatLngExpression[] => {
  //   return data.map(accident => [accident.latitude, accident.longitude, accident.count * 0.1] as L.LatLngExpression); // Intensity based on count
  // };

  // const heatmapData = useMemo(() => generateHeatmapData(accidentsData), []);

  const chennaiCenter: [number, number] = [13.05, 80.25]; // Slightly adjusted center


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
      {/* Warning Popup */}
      <AnimatePresence>
        {showWarningPopup && (
          <motion.div
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 p-4 rounded-md shadow-lg z-[1001] text-center" // Ensure high z-index
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
             onClick={() => setShowWarningPopup(false)} // Allow dismissing by clicking
             style={{ cursor: 'pointer' }}
          >
            <p className="font-semibold">
              ⚠️ Route includes high-risk zones. Ride cautiously.
            </p>
             <p className="text-xs">(Click to dismiss)</p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Map container */}
       <div className="w-full max-w-4xl h-[400px] md:h-[500px] mb-4 rounded-lg overflow-hidden shadow-lg border">
        <MapContainer center={sourceCoords || chennaiCenter} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef} >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {/* Heatmap layer removed as dependency is gone */}
          {/* <HeatMapLayer points={heatmapData} longitudeExtractor={(m: any) => m[1]} latitudeExtractor={(m: any) => m[0]} intensityExtractor={(m: any) => m[2]} radius={25} blur={15} max={1.0} /> */}

          {/* Source Marker */}
          {sourceCoords && (
             <Marker position={sourceCoords} icon={customMarkerIcon}>
                <Popup>Your current location</Popup>
             </Marker>
          )}

          {/* Destination Marker */}
           {selectedDestinationCoords && (
             <Marker position={selectedDestinationCoords} icon={customMarkerIcon}>
               <Popup>{destination}</Popup>
             </Marker>
           )}

          {/* Display the route as colored segments */}
          {route.length > 1 && route.map((_, idx) => {
             if (idx === route.length - 1) return null; // No segment starts from the last point
             const startPoint = route[idx];
             const endPoint = route[idx + 1];
             const segmentInfo = segmentRisks[idx]; // Get risk info for this segment

             if (!segmentInfo) return null; // Skip if no risk info

             let color = 'blue'; // Default for unknown/direct
             if (segmentInfo.riskScore >= 4) {
               color = 'red'; // High risk
             } else if (segmentInfo.riskScore >= 2) {
               color = 'orange'; // Medium risk
             } else {
               color = 'green'; // Low risk
             }

             return (
               <Polyline key={`segment-${idx}`} positions={[startPoint, endPoint]} color={color} weight={5} opacity={0.8}>
                 <Tooltip sticky>
                    <div>
                        <strong>{segmentInfo.roadName || `Segment ${idx + 1}`}</strong><br/>
                        Risk Score: {segmentInfo.riskScore.toFixed(1)}<br/>
                        {/* Est. Accidents: {segmentInfo.accidentCount} */}
                     </div>
                 </Tooltip>
               </Polyline>
             );
           })}

        </MapContainer>
      </div>

      {/* Input & Control Panel */}
       <div className="flex flex-col gap-4 w-full max-w-md p-4 bg-card border rounded-lg shadow-md">
        <Input
          type="text"
          placeholder="Enter destination landmark"
          value={destination}
          onChange={(e) => {
              setDestination(e.target.value);
               // Clear route when typing new destination
               // setIsRouteCalculated(false);
               // setRoute([]);
               // setShowWarningPopup(false);
          }}
          list="landmarks"
          className="bg-input border-border focus:ring-primary"
        />
        <datalist id="landmarks">
          {Object.keys(landmarkCoords).map((landmark, idx) => (
            <option key={idx} value={landmark} />
          ))}
        </datalist>

        {/* Route Preference Radio Group */}
        <div className='w-full flex flex-col sm:flex-row gap-3 items-center justify-between'>
          <Label className="text-sm font-medium text-muted-foreground">Route Preference:</Label>
          <RadioGroup value={beta.toString()} onValueChange={value => setBeta(Number(value))} className="flex gap-4">
             <div className='flex items-center gap-2'>
                 <RadioGroupItem value="0" id="r1" />
                 <Label htmlFor="r1" className="text-xs">Fastest</Label>
             </div>
             <div className='flex items-center gap-2'>
                 <RadioGroupItem value="2" id="r2" />
                 <Label htmlFor="r2" className="text-xs">Balanced</Label>
             </div>
             <div className='flex items-center gap-2'>
                 <RadioGroupItem value="5" id="r3" />
                 <Label htmlFor="r3" className="text-xs">Safest</Label>
             </div>
          </RadioGroup>
        </div>


        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <Button onClick={handleFindRouteClick} className="flex-1 bg-primary hover:bg-accent">Find Route</Button>
          <Button variant="outline" onClick={handleManualLocation} className="flex-1">Use Current Location</Button>
        </div>

         {/* Proceed Button (conditionally rendered) */}
        {isRouteCalculated && (
           <Button onClick={() => router.push('/dashboard-non-obd')} className="w-full bg-green-600 hover:bg-green-700 text-white">
             Proceed to Non-OBD Dashboard
          </Button>
        )}
        {isRouteCalculated && (
             <Button onClick={() => router.push('/dashboard-obd')} className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-2">
              Proceed to OBD Dashboard
           </Button>
         )}


        {/* Route Information Panel */}
        {isRouteCalculated && (
          <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: 'auto' }}
             transition={{ duration: 0.3 }}
             className="mt-4 p-3 border rounded-md bg-background/50 text-xs"
          >
             <h3 className="font-semibold mb-1 text-sm text-foreground">Route Summary</h3>
             <p>Distance: <span className="font-medium text-primary">{totalDistance.toFixed(1)} km</span></p>
             <p>Est. Time: <span className="font-medium text-primary">{(totalDistance * 3).toFixed(0)} min</span></p> {/* Improved mock time */}
             <p>Avg. Risk Score: <span className="font-medium text-primary">{(totalRisk / (segmentRisks.length || 1)).toFixed(1)}</span></p>
             {/* Optionally list risky segments */}
             {segmentRisks.filter(s => s.riskScore >= 4).length > 0 && (
                <div className="mt-2 pt-2 border-t border-dashed">
                    <p className="text-destructive font-medium text-xs">High-Risk Segments:</p>
                    <ul className="list-disc list-inside text-destructive text-xs">
                       {segmentRisks.filter(s => s.riskScore >= 4).map((s, i) => <li key={i}>{s.roadName}</li>)}
                    </ul>
                </div>
             )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NavigationPage;
