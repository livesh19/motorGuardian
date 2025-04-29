import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';

// Import mock accident data
import accidentsData from '@/data/chennai-accidents.json';

// Import utils (only cn is used now)
import { cn } from '@/lib/utils';


// Define the segment risk data type
interface SegmentRiskData {
  roadName: string;
  riskScore: number;
  accidentCount: number;
}

// Mock data for Chennai landmarks, replace with API later
const chennaiLandmarks = ["T. Nagar", "Anna Salai", "Adyar", "Nungambakkam", "Mylapore", "Besant Nagar", "Central Station Area", "Marina Beach Area"];


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
        const remainingDistance = distance(segment.to, end); // Approx distance
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
             const lastLegDistance = distance(current, end);
             totalDistance += lastLegDistance;
             // totalRisk += some_estimated_risk; // Optional: Add risk for the last visual leg
             segmentRisks.push({ roadName: "Direct to Destination", riskScore: 2, accidentCount: 10}); // Example placeholder
          }
      }


  } else {
      // If no segments found from start, just draw a line to the end
       if(!(current[0] === end[0] && current[1] === end[1])) {
         route.push(end);
         totalDistance = distance(start, end);
         totalRisk = 2 * totalDistance; // Estimate risk based on distance
         segmentRisks.push({ roadName: "Direct Route", riskScore: 2, accidentCount: Math.round(totalRisk * 5)});
       }
  }


  return { route, totalDistance, totalRisk, segmentRisks };
};


// Distance calculation function
const distance = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371; // Radius of the earth in km
    const lat1 = coord1[0] * Math.PI / 180;
    const lon1 = coord1[1] * Math.PI / 180;
    const lat2 = coord2[0] * Math.PI / 180;
    const lon2 = coord2[1] * Math.PI / 180;

    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;

    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Framer Motion popup variants
const popupVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

// Define props for the component if any (currently none needed)
interface NavigationPageProps {}


const NavigationPage: React.FC<NavigationPageProps> = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [sourceCoords, setSourceCoords] = useState<[number, number] | null>(null);
  const defaultLocation: [number, number] = [13.0604, 80.2478]; // Default Nungambakkam
  const chennaiCenter: [number, number] = [13.05, 80.25];
  const [destination, setDestination] = useState<string>('');
  const [isRouteCalculated, setIsRouteCalculated] = useState<boolean>(false);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [beta, setBeta] = useState<number>(2);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalRisk, setTotalRisk] = useState<number>(0);
  const [segmentRisks, setSegmentRisks] = useState<SegmentRiskData[]>([]);
  const [selectedDestinationCoords, setSelectedDestinationCoords] = useState<[number, number] | null>(null);
  const [isClient, setIsClient] = useState(false); // State to track client-side mounting
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID'; // Use your Map ID or fallback


  // Mock coordinates for landmarks
   const landmarkCoords: { [key: string]: [number, number] } = {
        "T. Nagar": [13.0408, 80.2344],
        "Anna Salai": [13.0550, 80.2650], // Approx center
        "Adyar": [13.0080, 80.2589],
        "Nungambakkam": [13.0604, 80.2478],
        "Mylapore": [13.0355, 80.2712],
        "Besant Nagar": [13.0010, 80.2699],
         "Central Station Area": [13.0827, 80.2707],
         "Marina Beach Area": [13.0080, 80.2800]
    };

  // Geolocation and client-side check hook
  useEffect(() => {
     setIsClient(true); // Indicate component has mounted on client
     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSourceCoords([latitude, longitude]);
          toast({ title: "Location Found", description: `Current location set.`, duration: 3000 });
        },
        (error) => {
          console.error("Error getting location:", error);
          setSourceCoords(defaultLocation);
          toast({ title: "Location Error", description: "Using default: Nungambakkam.", variant: "destructive", duration: 5000 });
        }
      );
    } else {
      console.error("Geolocation is not supported.");
      setSourceCoords(defaultLocation);
      toast({ title: "Location Unavailable", description: "Using default: Nungambakkam.", variant: "destructive", duration: 5000 });
    }
  }, [toast]); // Run once on mount


   // Function to manually set current location
   const handleManualLocation = () => {
      if (!isClient) return; // Ensure running on client
      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
             (position) => {
                  const { latitude, longitude } = position.coords;
                  setSourceCoords([latitude, longitude]);
                  toast({ title: "Location Refreshed", description: "Using current location.", duration: 3000 });
              },
             (error) => {
                 setSourceCoords(defaultLocation);
                 toast({ title: "Location Error", description: "Could not get current location. Using default.", variant: "destructive" });
              }
         );
     } else {
         setSourceCoords(defaultLocation);
          toast({ title: "Location Unavailable", description: "Geolocation not supported. Using default.", variant: "destructive" });
     }
   };


   // Update route when a destination is selected or beta changes
    const handleCalculateRoute = useCallback(() => {
       if (!isClient) return; // Ensure running on client
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

               const hasHighRiskSegments = calculatedRoute.segmentRisks.some((seg) => seg.riskScore > 3);
               setShowWarningPopup(hasHighRiskSegments);
           } else {
                toast({ title: "Error", description: "Destination landmark not recognized.", variant: "destructive" });
                setIsRouteCalculated(false);
                setRoute([]);
                setShowWarningPopup(false);
                setSelectedDestinationCoords(null);
           }
       } else if (!sourceCoords) {
           toast({ title: "Error", description: "Source location not available.", variant: "destructive" });
       } else {
           // Clear route if destination is empty
           setIsRouteCalculated(false);
           setRoute([]);
           setShowWarningPopup(false);
           setSelectedDestinationCoords(null);
       }
   }, [destination, sourceCoords, beta, toast, isClient]);


    // Trigger calculation when beta changes, only if a route exists and destination is valid
    useEffect(() => {
        if (isRouteCalculated && landmarkCoords[destination]) {
           handleCalculateRoute();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [beta]); // Only watch beta here

     useEffect(() => {
        // Clear route if destination or source changes *after* initial load
        // Only clear if the change makes the input invalid
         if (isClient) {
             const currentDestCoords = landmarkCoords[destination];
             setSelectedDestinationCoords(currentDestCoords || null); // Keep dest coords updated

             if (!sourceCoords || !currentDestCoords) {
                // If source disappears or destination becomes invalid, clear route
                 setIsRouteCalculated(false);
                 setRoute([]);
                 setShowWarningPopup(false);
             }
         }
     }, [destination, sourceCoords, isClient]);


    // Function to handle "Find Route" button click
     const handleFindRouteClick = () => {
         if (!destination) {
             toast({ title: "Input Needed", description: "Please enter a destination.", variant: "destructive" });
             return;
         }
          if (!landmarkCoords[destination]) {
              toast({ title: "Invalid Destination", description: "Please select a valid landmark from the list.", variant: "destructive" });
              return;
          }
         handleCalculateRoute(); // Perform the calculation
     };

   if (!apiKey) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-gradient-to-br from-background to-muted/30">
         <p className="text-destructive">Google Maps API Key is missing. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.</p>
       </div>
     );
   }


   return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-gradient-to-br from-background to-muted/30">
         {/* Warning Popup */}
         <AnimatePresence>
         {showWarningPopup && (
            <motion.div
               className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 p-4 rounded-md shadow-lg z-[1001] text-center" // Ensure high z-index
               variants={popupVariants}
               initial="hidden"
               animate="visible"
               exit="exit"
               onClick={() => setShowWarningPopup(false)}
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
         <div className="w-full max-w-4xl h-[400px] md:h-[500px] mb-4 rounded-lg overflow-hidden shadow-lg border border-border">
             {isClient ? (
              <APIProvider apiKey={apiKey}>
                 <Map
                   mapId={mapId}
                   defaultCenter={
                     sourceCoords && sourceCoords[0] && sourceCoords[1]
                       ? { lat: sourceCoords[0], lng: sourceCoords[1] }
                       : chennaiCenter && chennaiCenter[0] && chennaiCenter[1]
                         ? { lat: chennaiCenter[0], lng: chennaiCenter[1] }
                         : { lat: 13.0827, lng: 80.2707 } // Fallback to a default Chennai location
                   }
                   defaultZoom={13}
                   gestureHandling={'greedy'}
                   disableDefaultUI={true}
                   className="w-full h-full rounded-b-lg"
                   mapTypeId="roadmap"
                 >
                   {sourceCoords && (
                     <AdvancedMarker position={sourceCoords} onClick={() => console.log("Source marker clicked")}>
                       <Pin background={'hsl(var(--primary))'} glyphColor={'#fff'} borderColor={'#fff'} />
                     </AdvancedMarker>
                   )}

                   {selectedDestinationCoords && (
                     <AdvancedMarker position={selectedDestinationCoords} onClick={() => console.log("Destination marker clicked")}>
                       <Pin background={'hsl(var(--destructive))'} glyphColor={'#fff'} borderColor={'#fff'} />
                     </AdvancedMarker>
                   )}

                   {route.length > 1 &&
                     route.map((point, index) => {
                       if (index === 0) return null;
                       const prevPoint = route[index - 1];
                       const segmentInfo = segmentRisks[index - 1];

                       let color = 'blue';
                       let riskLabel = "Low Risk";

                       if (segmentInfo && segmentInfo.riskScore >= 4) {
                         color = 'red';
                         riskLabel = "High Risk";
                       } else if (segmentInfo && segmentInfo.riskScore >= 2) {
                         color = 'orange';
                         riskLabel = "Moderate Risk";
                       } else if (segmentInfo) {
                         color = 'green';
                       }
                       return (
                         <Polyline
                           key={index}
                           path={[prevPoint, point]}
                           strokeColor={color}
                           strokeOpacity={0.8}
                           strokeWeight={5}
                         />
                       );
                     })}
                 </Map>
               </APIProvider>
             ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                     <p className="text-muted-foreground">Loading Map...</p>
                  </div>
             )}
           </div>



         {/* Input & Control Panel */}
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 w-full max-w-md p-4 bg-card border border-border rounded-lg shadow-md"
         >
             <Input
                type="text"
                placeholder="Enter destination landmark"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                list="landmarks"
                className="bg-input border-border focus:ring-primary"
             />
             <datalist id="landmarks">
                {Object.keys(landmarkCoords).map((landmark, idx) => (
                   <option key={idx} value={landmark} />
                ))}
             </datalist>

             {/* Route Preference Radio Group */}
             <div className='w-full flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between'>
                <Label className="text-sm font-medium text-muted-foreground pt-1 sm:pt-0">Route Preference:</Label>
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
                <Button onClick={handleFindRouteClick} className="flex-1 bg-primary hover:bg-accent" disabled={!isClient || !sourceCoords}>Find Route</Button>
                <Button variant="outline" onClick={handleManualLocation} className="flex-1" disabled={!isClient}>Use Current Location</Button>
             </div>

             {/* Proceed Buttons (conditionally rendered) */}
             {isRouteCalculated && (
                 <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Button onClick={() => router.push('/non-obd-dashboard')} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    Proceed to Non-OBD Dashboard
                    </Button>
                    <Button onClick={() => router.push('/obd-dashboard')} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
                    Proceed to OBD Dashboard
                    </Button>
                 </div>
             )}


             {/* Route Information Panel */}
             {isRouteCalculated && (
                <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   transition={{ duration: 0.3 }}
                   className="mt-4 p-3 border border-border rounded-md bg-background/50 text-xs"
                >
                   <h3 className="font-semibold mb-1 text-sm text-foreground">Route Summary</h3>
                   <p>Distance: <span className="font-medium text-primary">{totalDistance.toFixed(1)} km</span></p>
                   <p>Est. Time: <span className="font-medium text-primary">{(totalDistance * 3).toFixed(0)} min</span></p> {/* Improved mock time */}
                   <p>Avg. Risk Score: <span className="font-medium text-primary">{(totalRisk / (segmentRisks.length || 1)).toFixed(1)}</span></p>
                   {/* Optionally list risky segments */}
                   {segmentRisks.filter(s => s.riskScore >= 4).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-border/50">
                         <p className="text-destructive font-medium text-xs">High-Risk Segments:</p>
                         <ul className="list-disc list-inside text-destructive text-xs">
                            {segmentRisks.filter(s => s.riskScore >= 4).map((s, i) => <li key={i}>{s.roadName}</li>)}
                         </ul>
                      </div>
                   )}
                </motion.div>
             )}
         </motion.div>
      </div>
   );
};

NavigationPage.displayName = 'NavigationPage';

// React component to draw polyline on the map
interface PolylineProps {
  path: [number, number][];
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
}

const Polyline: React.FC<PolylineProps> = ({ path, strokeColor, strokeOpacity, strokeWeight }) => {
  // Encoded path is incompatible with react-google-maps. Skipping.
  //const encodedPath = encodePath(path);

  // Instead, return a series of Polyline components.
  return path.map((coord, index) => {
    if (index === 0) return null;
    const prevCoord = path[index - 1];

    return (
      <google.maps.Polyline
        key={`${prevCoord[0]}-${prevCoord[1]}-${coord[0]}-${coord[1]}`} // Unique key
        path={[prevCoord, coord]}
        options={{
          strokeColor,
          strokeOpacity,
          strokeWeight,
          geodesic: true,
          useGeoJsonGeometry: true,
          zIndex: 1,
        }}
      />
    );
  });
};

function encodePath(path: [number, number][]) {
  let encoded = '';

  let plat = 0;
  let plng = 0;

  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const lat = point[0];
    const lng = point[1];

    let late5 = Math.round(lat * 1e5);
    let lnge5 = Math.round(lng * 1e5);

    let dLat = late5 - plat;
    let dLng = lnge5 - plng;

    plat = late5;
    plng = lnge5;

    encoded += encodeSignedNumber(dLat);
    encoded += encodeSignedNumber(dLng);
  }

  return encoded;
}

function encodeSignedNumber(num: number) {
  let sgn_val = num < 0 ? ~(num << 1) : (num << 1);
  let encoded = encodeNumber(sgn_val);
  return encoded;
}

function encodeNumber(num: number) {
  let encoded = '';

  while (num >= 0x20) {
    encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }

  encoded += String.fromCharCode(num + 63);
  return encoded;
}


export default NavigationPage;
