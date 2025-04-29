
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  // Polyline is not exported directly, use google.maps.Polyline
  useMap,
} from '@vis.gl/react-google-maps';

// Import utils (only cn is used now)
import { cn } from '@/lib/utils';


// Define the segment risk data type
interface SegmentRiskData {
  roadName: string;
  riskScore: number;
  accidentCount: number;
}

// Mock coordinates for landmarks
const landmarkCoords: { [key: string]: google.maps.LatLngLiteral } = {
    "T. Nagar": { lat: 13.0408, lng: 80.2344 },
    "Anna Salai": { lat: 13.0550, lng: 80.2650 }, // Approx center
    "Adyar": { lat: 13.0080, lng: 80.2589 },
    "Nungambakkam": { lat: 13.0604, lng: 80.2478 },
    "Mylapore": { lat: 13.0355, lng: 80.2712 },
    "Besant Nagar": { lat: 13.0010, lng: 80.2699 },
    "Central Station Area": { lat: 13.0827, lng: 80.2707 },
    "Marina Beach Area": { lat: 13.0080, lng: 80.2800 },
};


// Mocked road graph for demonstration (replace with actual data)
interface RoadSegment {
  from: google.maps.LatLngLiteral;
  to: google.maps.LatLngLiteral;
  distanceKm: number;
  roadName: string;
  riskScore: number; // Mock risk score
}

const mockedRoadGraph: RoadSegment[] = [
  { from: landmarkCoords["Central Station Area"], to: landmarkCoords["Nungambakkam"], distanceKm: 2.8, roadName: "Poonamallee High Road", riskScore: 3 }, // Moderate Risk
  { from: landmarkCoords["Nungambakkam"], to: { lat: 13.0479, lng: 80.2139 }, distanceKm: 3.5, roadName: "Nelson Manickam Road", riskScore: 4 }, // High Risk (Intermediate point)
  { from: { lat: 13.0479, lng: 80.2139 }, to: landmarkCoords["Marina Beach Area"], distanceKm: 7.2, roadName: "Sardar Patel Road (Adyar)", riskScore: 2 }, // Low-Moderate Risk
  { from: landmarkCoords["Central Station Area"], to: { lat: 13.0479, lng: 80.2139 }, distanceKm: 6.5, roadName: "EVK Sampath Road -> Anna Nagar", riskScore: 5 }, // High Risk Alternative
  { from: landmarkCoords["Nungambakkam"], to: landmarkCoords["Central Station Area"], distanceKm: 2.8, roadName: "Poonamallee High Road (Return)", riskScore: 3 }, // Return Path
  { from: { lat: 13.0479, lng: 80.2139 }, to: landmarkCoords["Nungambakkam"], distanceKm: 3.5, roadName: "Nelson Manickam Road (Return)", riskScore: 4 },
  { from: landmarkCoords["Marina Beach Area"], to: { lat: 13.0479, lng: 80.2139 }, distanceKm: 7.2, roadName: "Sardar Patel Road (Return)", riskScore: 2 },
  { from: { lat: 13.0479, lng: 80.2139 }, to: landmarkCoords["Central Station Area"], distanceKm: 6.5, roadName: "Anna Nagar -> EVK Sampath Road (Return)", riskScore: 5 },
  // Add a safer but longer route segment
  { from: landmarkCoords["Central Station Area"], to: landmarkCoords["Marina Beach Area"], distanceKm: 10.0, roadName: "Coastal Road (Hypothetical Safer Route)", riskScore: 1 }, // Low Risk
  { from: landmarkCoords["Marina Beach Area"], to: landmarkCoords["Central Station Area"], distanceKm: 10.0, roadName: "Coastal Road (Return)", riskScore: 1 },
];



// Helper function to check if two LatLngLiterals are approximately equal
const areCoordsEqual = (coord1: google.maps.LatLngLiteral, coord2: google.maps.LatLngLiteral, tolerance = 1e-4): boolean => {
    if (!coord1 || !coord2) return false; // Guard against null/undefined
    return Math.abs(coord1.lat - coord2.lat) < tolerance && Math.abs(coord1.lng - coord2.lng) < tolerance;
};


// Function to mock Dijkstra's algorithm for route calculation
const calculateRoute = (
  start: google.maps.LatLngLiteral,
  end: google.maps.LatLngLiteral,
  roadGraph: RoadSegment[],
  beta: number = 2 // Default beta value for balanced
): { route: google.maps.LatLngLiteral[]; totalDistance: number; totalRisk: number; segmentRisks: SegmentRiskData[] } => {

  // Super simplified pathfinding: Find direct segments or a two-step path
  const route: google.maps.LatLngLiteral[] = [start];
  let totalDistance = 0;
  let totalRisk = 0;
  const segmentRisks: SegmentRiskData[] = [];
  let current = start;

  // Check for direct connection first, considering beta
  let bestDirectSegment: RoadSegment | null = null;
  let minDirectCost = Infinity;

  for (const segment of roadGraph) {
     if (areCoordsEqual(segment.from, start) && areCoordsEqual(segment.to, end)) {
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
    if (areCoordsEqual(segment.from, current)) {
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
        if (areCoordsEqual(segment.from, current) && areCoordsEqual(segment.to, end)) {
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
          if(!areCoordsEqual(current, end)) {
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
       if(!areCoordsEqual(current, end)) {
         route.push(end);
         totalDistance = distance(start, end);
         totalRisk = 2 * totalDistance; // Estimate risk based on distance
         segmentRisks.push({ roadName: "Direct Route", riskScore: 2, accidentCount: Math.round(totalRisk * 5)});
       }
  }


  return { route, totalDistance, totalRisk, segmentRisks };
};


// Distance calculation function
const distance = (coord1: google.maps.LatLngLiteral, coord2: google.maps.LatLngLiteral): number => {
    if (!coord1 || !coord2) return 0; // Guard against null/undefined

    const R = 6371; // Radius of the earth in km
    const lat1 = coord1.lat * Math.PI / 180;
    const lon1 = coord1.lng * Math.PI / 180;
    const lat2 = coord2.lat * Math.PI / 180;
    const lon2 = coord2.lng * Math.PI / 180;

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

// Helper component to draw Polyline
const RoutePolyline: React.FC<{ route: google.maps.LatLngLiteral[], segmentRisks: SegmentRiskData[] }> = ({ route, segmentRisks }) => {
    const map = useMap();
    const polylinesRef = useRef<google.maps.Polyline[]>([]);

    useEffect(() => {
        if (!map || route.length < 2) {
            // Clear existing polylines if map is not ready or route is invalid
            polylinesRef.current.forEach(p => p.setMap(null));
            polylinesRef.current = [];
            return;
        }

        // Clear previous polylines
        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];

        // Draw new polylines segment by segment
        for (let i = 0; i < route.length - 1; i++) {
            const segmentPath = [route[i], route[i + 1]];
            const segmentInfo = segmentRisks[i];

            let color = 'hsl(var(--chart-2))'; // Default blue (low risk assumed if no info)
            let strokeWeight = 5;
            let zIndex = 1; // Default z-index

            if (segmentInfo) {
                if (segmentInfo.riskScore >= 4) {
                    color = 'hsl(var(--destructive))'; // Red (High Risk)
                     strokeWeight = 6;
                     zIndex = 3;
                } else if (segmentInfo.riskScore >= 2) {
                    color = 'hsl(var(--chart-4))'; // Yellow/Orange (Moderate Risk)
                    strokeWeight = 5;
                     zIndex = 2;
                } else {
                    color = 'hsl(var(--success))'; // Green (Low Risk)
                     strokeWeight = 4;
                }
            }


            const polyline = new google.maps.Polyline({
                path: segmentPath,
                geodesic: true,
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: strokeWeight,
                map: map,
                zIndex: zIndex,
            });
            polylinesRef.current.push(polyline);
        }

         // Cleanup function to remove polylines when component unmounts or dependencies change
         return () => {
             polylinesRef.current.forEach(p => p.setMap(null));
             polylinesRef.current = [];
         };

    }, [map, route, segmentRisks]); // Depend on map instance, route, and segmentRisks

    return null; // This component doesn't render anything itself
};


// Define props for the component if any (currently none needed)
interface NavigationPageProps {}

const NavigationPage: React.FC<NavigationPageProps> = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [sourceCoords, setSourceCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const defaultLocation: google.maps.LatLngLiteral = { lat: 13.0604, lng: 80.2478 }; // Default Nungambakkam
  const chennaiCenter: google.maps.LatLngLiteral = { lat: 13.05, lng: 80.25 };
  const [destination, setDestination] = useState<string>('');
  const [isRouteCalculated, setIsRouteCalculated] = useState<boolean>(false);
  const [route, setRoute] = useState<google.maps.LatLngLiteral[]>([]);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [beta, setBeta] = useState<number>(2); // 0: fastest, 2: balanced, 5: safest
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalRisk, setTotalRisk] = useState<number>(0);
  const [segmentRisks, setSegmentRisks] = useState<SegmentRiskData[]>([]);
  const [selectedDestinationCoords, setSelectedDestinationCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [isClient, setIsClient] = useState(false); // State to track client-side mounting
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID'; // Use your Map ID or fallback
  const mapRef = useRef<google.maps.Map | null>(null); // Ref to store the map instance


  // Geolocation and client-side check hook
  useEffect(() => {
     setIsClient(true); // Indicate component has mounted on client
     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Validate coordinates
          if (isFinite(latitude) && isFinite(longitude)) {
            const coords = { lat: latitude, lng: longitude };
            setSourceCoords(coords);
            toast({ title: "Location Found", description: `Current location set.`, duration: 3000 });
             mapRef.current?.setCenter(coords);
          } else {
            console.error("Invalid coordinates received:", latitude, longitude);
            setSourceCoords(defaultLocation);
            toast({ title: "Location Error", description: "Received invalid coordinates. Using default.", variant: "destructive", duration: 5000 });
            mapRef.current?.setCenter(defaultLocation);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setSourceCoords(defaultLocation);
          toast({ title: "Location Error", description: "Using default: Nungambakkam.", variant: "destructive", duration: 5000 });
          mapRef.current?.setCenter(defaultLocation);
        }
      );
    } else {
      console.error("Geolocation is not supported.");
      setSourceCoords(defaultLocation);
      toast({ title: "Location Unavailable", description: "Using default: Nungambakkam.", variant: "destructive", duration: 5000 });
      mapRef.current?.setCenter(defaultLocation);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // Run once on mount


   // Function to manually set current location
   const handleManualLocation = () => {
      if (!isClient) return; // Ensure running on client
      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
             (position) => {
                  const { latitude, longitude } = position.coords;
                  if (isFinite(latitude) && isFinite(longitude)) {
                     const newCoords = { lat: latitude, lng: longitude };
                     setSourceCoords(newCoords);
                     toast({ title: "Location Refreshed", description: "Using current location.", duration: 3000 });
                     mapRef.current?.setCenter(newCoords);
                  } else {
                    console.error("Invalid coordinates received:", latitude, longitude);
                    setSourceCoords(defaultLocation);
                    toast({ title: "Location Error", description: "Received invalid coordinates. Using default.", variant: "destructive" });
                    mapRef.current?.setCenter(defaultLocation);
                  }
              },
             (error) => {
                 setSourceCoords(defaultLocation);
                 toast({ title: "Location Error", description: "Could not get current location. Using default.", variant: "destructive" });
                 mapRef.current?.setCenter(defaultLocation);
              }
         );
     } else {
         setSourceCoords(defaultLocation);
          toast({ title: "Location Unavailable", description: "Geolocation not supported. Using default.", variant: "destructive" });
          mapRef.current?.setCenter(defaultLocation);
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

               // Adjust map bounds to fit the route
                if (mapRef.current && calculatedRoute.route.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    calculatedRoute.route.forEach(point => bounds.extend(point));
                    mapRef.current.fitBounds(bounds);
                }


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
                 defaultCenter={chennaiCenter} // Use a fixed default center
                 defaultZoom={13}
                 gestureHandling={'greedy'}
                 disableDefaultUI={true}
                 className="w-full h-full"
                 mapTypeId="roadmap"
                 onMapLoad={({map}) => {mapRef.current = map}} // Store map instance in ref
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

                 {isRouteCalculated && route.length > 0 && (
                     <RoutePolyline route={route} segmentRisks={segmentRisks} />
                 )}

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
             <Button onClick={() => router.push('/dashboard-non-obd')} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
               Proceed to Non-OBD Dashboard
             </Button>
             <Button onClick={() => router.push('/dashboard-obd')} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
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

export default NavigationPage;
