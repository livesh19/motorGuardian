'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useToast } from '@/hooks/use-toast';
// Removed react-leaflet imports: MapContainer, TileLayer, Marker, Polyline, useMap, Circle, Popup, Tooltip as LeafletTooltip
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Leaflet is safe to import here due to 'use client'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


// Import mock accident data
import accidentsData from '@/data/chennai-accidents.json';

// Import utils (only cn is used now)
// Removed calculateRiskPerSegment import
import { cn } from '@/lib/utils';

// Correctly import the custom marker icon
// Ensure the path is correct relative to the public folder or use a data URL
// If using the default icon, you might need this fix:
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});


// Define the segment risk data type
interface SegmentRiskData {
  roadName: string;
  riskScore: number;
  accidentCount: number;
}

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

// Define props for the component if any (currently none needed)
interface NavigationPageProps {}

// Map component to handle Leaflet initialization and updates
const LeafletMapComponent = React.memo(({ sourceCoords, destinationCoords, route, segmentRisks }: { sourceCoords: [number, number] | null, destinationCoords: [number, number] | null, route: [number, number][], segmentRisks: SegmentRiskData[] }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null); // Ref for the route layer group
  const markerLayerRef = useRef<L.LayerGroup | null>(null); // Ref for markers

  const chennaiCenter: [number, number] = [13.05, 80.25]; // Slightly adjusted center

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView(sourceCoords || chennaiCenter, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      mapRef.current = map;
      routeLayerRef.current = L.layerGroup().addTo(map); // Initialize route layer group
      markerLayerRef.current = L.layerGroup().addTo(map); // Initialize marker layer group
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [sourceCoords, chennaiCenter]); // Dependency on sourceCoords to set initial view

  // Update markers and route when data changes
  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current || !markerLayerRef.current) return;

    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    const markerLayer = markerLayerRef.current;

    // Clear previous markers and route
    routeLayer.clearLayers();
    markerLayer.clearLayers();

    // Add source marker
    if (sourceCoords) {
      L.marker(sourceCoords).bindPopup("Your current location").addTo(markerLayer);
    }

    // Add destination marker
    if (destinationCoords) {
      L.marker(destinationCoords).bindPopup("Destination").addTo(markerLayer);
    }

    // Add route polyline segments
    if (route.length > 1) {
      route.forEach((_, idx) => {
        if (idx === route.length - 1) return;
        const startPoint = route[idx];
        const endPoint = route[idx + 1];
        const segmentInfo = segmentRisks[idx];

        if (!segmentInfo) return;

        let color = 'blue';
        if (segmentInfo.riskScore >= 4) color = 'red';
        else if (segmentInfo.riskScore >= 2) color = 'orange';
        else color = 'green';

        L.polyline([startPoint, endPoint], { color: color, weight: 5, opacity: 0.8 })
          .bindTooltip(`<strong>${segmentInfo.roadName || `Segment ${idx + 1}`}</strong><br/>Risk Score: ${segmentInfo.riskScore.toFixed(1)}`, { sticky: true })
          .addTo(routeLayer);
      });

      // Fit map bounds to the route
      const bounds = L.latLngBounds(route);
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50] });
      }
    } else if (sourceCoords) {
        // If no route, just center on source
        map.setView(sourceCoords, 13);
    }


  }, [sourceCoords, destinationCoords, route, segmentRisks]); // Dependencies


  return <div ref={mapContainerRef} className="w-full h-full" />;
});

LeafletMapComponent.displayName = 'LeafletMapComponent';


const NavigationPage: React.FC<NavigationPageProps> = React.memo(() => { // Wrap with React.memo
  const router = useRouter();
  const { toast } = useToast();
  const [sourceCoords, setSourceCoords] = useState<[number, number] | null>(null);
   // Default to a known Chennai landmark if geolocation fails or isn't available
   const defaultLocation: [number, number] = [13.0479, 80.2139]; // Example: Nungambakkam
  const [destination, setDestination] = useState<string>('');
  const [isRouteCalculated, setIsRouteCalculated] = useState<boolean>(false);
  const [route, setRoute] = useState<[number, number][]>([]); // Route path coordinates
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
   const handleCalculateRoute = useCallback(() => { // Wrapped in useCallback
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

              // Center map view handled within LeafletMapComponent's useEffect


              const hasHighRiskSegments = calculatedRoute.segmentRisks.some((seg) => seg.riskScore > 3);
              setShowWarningPopup(hasHighRiskSegments);
          } else {
               toast({ title: "Error", description: "Destination not found.", variant: "destructive" });
               setIsRouteCalculated(false);
               setRoute([]);
               setShowWarningPopup(false);
               setSelectedDestinationCoords(null); // Clear destination coords on error
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
  }, [destination, sourceCoords, beta, toast]); // Dependencies for useCallback


   // Trigger calculation when destination or beta changes
   useEffect(() => {
        // Optionally, recalculate when beta changes automatically if desired
        // if (isRouteCalculated) { // Only recalc if a route was already calculated
        //    handleCalculateRoute();
        // }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [destination, sourceCoords]); // Removed beta and isRouteCalculated from deps


   // Function to handle "Find Route" button click
    const handleFindRouteClick = () => {
        if (!destination) {
            toast({ title: "Input Needed", description: "Please enter a destination.", variant: "destructive" });
            return;
        }
        handleCalculateRoute(); // Perform the calculation
    };


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
         {/* Render the LeafletMapComponent */}
          <LeafletMapComponent
            sourceCoords={sourceCoords}
            destinationCoords={selectedDestinationCoords}
            route={route}
            segmentRisks={segmentRisks}
          />
      </div>

      {/* Input & Control Panel */}
       <div className="flex flex-col gap-4 w-full max-w-md p-4 bg-card border rounded-lg shadow-md">
        <Input
          type="text"
          placeholder="Enter destination landmark"
          value={destination}
          onChange={(e) => {
              setDestination(e.target.value);
               setIsRouteCalculated(false); // Clear route when destination changes
               setRoute([]);
               setShowWarningPopup(false);
               setSelectedDestinationCoords(null); // Clear coords when input changes
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
          <RadioGroup value={beta.toString()} onValueChange={value => { setBeta(Number(value)); if(isRouteCalculated) handleCalculateRoute(); }} className="flex gap-4">
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
           <Button onClick={() => router.push('/non-obd-dashboard')} className="w-full bg-green-600 hover:bg-green-700 text-white">
             Proceed to Non-OBD Dashboard
          </Button>
        )}
        {isRouteCalculated && (
             <Button onClick={() => router.push('/obd-dashboard')} className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-2">
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
}); // Close React.memo

NavigationPage.displayName = 'NavigationPage'; // Add display name for React DevTools

export default NavigationPage;
