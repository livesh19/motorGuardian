
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from "framer-motion";
// Removed RadioGroup imports as beta preference is removed
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  // InfoWindow, // Not currently used
  useMap,
  MapCameraChangedEvent,
  MapCameraProps,
} from '@vis.gl/react-google-maps';

// Import utils
import { cn } from '@/lib/utils';

// Define the segment risk data type (kept for potential future use, but not used now)
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
    "Guindy": { lat: 13.0067, lng: 80.2206 },
    "Velachery": { lat: 12.985, lng: 80.218 },
    "OMR - Tidel Park": { lat: 12.9905, lng: 80.2472 },
    "Koyambedu": { lat: 13.0731, lng: 80.1931 },
};


// Framer Motion popup variants (kept for potential future use)
const popupVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

// Component to render Directions using DirectionsRenderer
const DirectionsRendererComponent: React.FC<{ directionsResult: google.maps.DirectionsResult | null }> = ({ directionsResult }) => {
    const map = useMap();
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

    useEffect(() => {
        if (!map) return;

        // Initialize or get the existing DirectionsRenderer instance
        if (!directionsRendererRef.current) {
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
                 suppressMarkers: true, // Use AdvancedMarker for start/end points
                 polylineOptions: {
                    strokeColor: 'hsl(var(--primary))', // Use theme color for route
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                 }
            });
             directionsRendererRef.current.setMap(map);
        }

        // Update directions if they change
        if (directionsResult) {
            directionsRendererRef.current.setDirections(directionsResult);
        } else {
            // Clear directions if result is null
            directionsRendererRef.current.setDirections({ routes: [] });
        }

         // Cleanup function: Remove directions from map when component unmounts or dependencies change significantly
        return () => {
            if (directionsRendererRef.current) {
                 directionsRendererRef.current.setMap(null); // Detach from map
                 // Optionally, nullify the ref if you want a fresh instance next time
                 // directionsRendererRef.current = null;
            }
        };
    }, [map, directionsResult]); // Re-run when map instance or directionsResult changes

    return null; // This component manages the renderer but doesn't render direct DOM elements
};


const NavigationPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [sourceCoords, setSourceCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [initialCenter, setInitialCenter] = useState<google.maps.LatLngLiteral>({ lat: 13.05, lng: 80.25 }); // Fixed initial center
  const [destination, setDestination] = useState<string>('');
  const [isRouteCalculated, setIsRouteCalculated] = useState<boolean>(false);
  // const [showWarningPopup, setShowWarningPopup] = useState(false); // Removed as risk data is not used
  // const [beta, setBeta] = useState<number>(2); // Removed beta preference
  const [totalDistance, setTotalDistance] = useState<string>('');
  const [totalDuration, setTotalDuration] = useState<string>('');
  // const [segmentRisks, setSegmentRisks] = useState<SegmentRiskData[]>([]); // Removed risk data
  const [selectedDestinationCoords, setSelectedDestinationCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [isClient, setIsClient] = useState(false); // State to track client-side mounting
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';
  const mapRef = useRef<google.maps.Map | null>(null); // Ref to store the map instance
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);


  // Geolocation and client-side check hook
  useEffect(() => {
     setIsClient(true); // Indicate component has mounted on client
     if (navigator.geolocation) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (isFinite(latitude) && isFinite(longitude)) {
            const coords = { lat: latitude, lng: longitude };
            setSourceCoords(coords);
            setInitialCenter(coords); // Center map on fetched location
            toast({ title: "Location Found", description: `Current location set.`, duration: 3000 });
          } else {
            console.error("Invalid coordinates received:", latitude, longitude);
            // Fallback to default if coords are invalid
            const defaultLocation = { lat: 13.0604, lng: 80.2478 }; // Nungambakkam
            setSourceCoords(defaultLocation);
            setInitialCenter(defaultLocation);
            toast({ title: "Location Error", description: "Received invalid coordinates. Using default.", variant: "destructive", duration: 5000 });
          }
          setIsFetchingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          const defaultLocation = { lat: 13.0604, lng: 80.2478 }; // Nungambakkam
          setSourceCoords(defaultLocation);
          setInitialCenter(defaultLocation);
          toast({ title: "Location Error", description: "Could not get location. Using default: Nungambakkam.", variant: "destructive", duration: 5000 });
          setIsFetchingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options for geolocation
      );
    } else {
      console.error("Geolocation is not supported.");
      const defaultLocation = { lat: 13.0604, lng: 80.2478 }; // Nungambakkam
      setSourceCoords(defaultLocation);
      setInitialCenter(defaultLocation);
      toast({ title: "Location Unavailable", description: "Geolocation not supported. Using default: Nungambakkam.", variant: "destructive", duration: 5000 });
      setIsFetchingLocation(false);
    }
  }, [toast]); // Run once on mount


   // Function to manually set current location
   const handleManualLocation = useCallback(() => {
      if (!isClient || !navigator.geolocation) {
         toast({ title: "Error", description: "Geolocation not available.", variant: "destructive" });
         return;
      }
      setIsFetchingLocation(true);
      setSourceCoords(null); // Clear previous while fetching
      navigator.geolocation.getCurrentPosition(
          (position) => {
              const { latitude, longitude } = position.coords;
              if (isFinite(latitude) && isFinite(longitude)) {
                 const newCoords = { lat: latitude, lng: longitude };
                 setSourceCoords(newCoords);
                 setInitialCenter(newCoords); // Re-center map
                 toast({ title: "Location Refreshed", description: "Using current location.", duration: 3000 });
                  // Clear previous route if location changes
                  setDirectionsResult(null);
                  setIsRouteCalculated(false);
              } else {
                const defaultLocation = { lat: 13.0604, lng: 80.2478 }; // Nungambakkam
                setSourceCoords(defaultLocation);
                setInitialCenter(defaultLocation);
                toast({ title: "Location Error", description: "Received invalid coordinates. Using default.", variant: "destructive" });
              }
              setIsFetchingLocation(false);
          },
          (error) => {
              const defaultLocation = { lat: 13.0604, lng: 80.2478 }; // Nungambakkam
              setSourceCoords(defaultLocation);
              setInitialCenter(defaultLocation);
              toast({ title: "Location Error", description: "Could not get current location. Using default.", variant: "destructive" });
              setIsFetchingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
   }, [isClient, toast]);


   // Function to calculate route using Google Maps Directions Service
   const handleCalculateRoute = useCallback(async () => {
     if (!isClient || !sourceCoords || !destination) return;

     const destCoords = landmarkCoords[destination];
     if (!destCoords) {
       toast({ title: "Error", description: "Destination landmark not recognized.", variant: "destructive" });
       return;
     }

     setSelectedDestinationCoords(destCoords);
     setIsCalculatingRoute(true);
     setDirectionsResult(null); // Clear previous result
     setIsRouteCalculated(false);

     try {
        const directionsService = new google.maps.DirectionsService();
        const request: google.maps.DirectionsRequest = {
            origin: sourceCoords,
            destination: destCoords,
            travelMode: google.maps.TravelMode.DRIVING, // Assuming driving mode
        };

        const response = await directionsService.route(request);

        if (response.status === 'OK' && response.routes.length > 0) {
            setDirectionsResult(response);
            setIsRouteCalculated(true);
            const route = response.routes[0].legs[0];
            setTotalDistance(route.distance?.text || 'N/A');
            setTotalDuration(route.duration?.text || 'N/A');
             // Fit map bounds to the route
             if (mapRef.current && response.routes[0].bounds) {
                mapRef.current.fitBounds(response.routes[0].bounds);
            }
            // setShowWarningPopup(false); // Reset warning popup (if re-added)
        } else {
            console.error("Directions request failed due to " + response.status);
            toast({ title: "Route Error", description: `Could not find a route: ${response.status}`, variant: "destructive" });
            setDirectionsResult(null);
            setIsRouteCalculated(false);
        }
     } catch (error) {
        console.error("Error fetching directions:", error);
        toast({ title: "Route Error", description: "An error occurred while calculating the route.", variant: "destructive" });
         setDirectionsResult(null);
         setIsRouteCalculated(false);
     } finally {
        setIsCalculatingRoute(false);
     }
   }, [isClient, sourceCoords, destination, toast]); // Dependencies


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
          if (!sourceCoords) {
               toast({ title: "Location Needed", description: "Waiting for current location...", variant: "destructive" });
               return;
          }
         handleCalculateRoute(); // Perform the calculation
     };

    // Clear route if destination changes
     useEffect(() => {
         if (isClient) {
            const currentDestCoords = landmarkCoords[destination];
            setSelectedDestinationCoords(currentDestCoords || null);

            // Clear route visualization and details if destination becomes empty or invalid
            if (!destination || !currentDestCoords) {
                setDirectionsResult(null);
                setIsRouteCalculated(false);
                setTotalDistance('');
                setTotalDuration('');
            }
         }
     }, [destination, isClient]);

     // Adjust map center when initialCenter changes (after location fetch)
     const handleCameraChange = useCallback((ev: MapCameraChangedEvent) => {
        if (mapRef.current && !isRouteCalculated) { // Only update if not showing a route
             // mapRef.current.moveCamera({ center: ev.detail.center, zoom: ev.detail.zoom });
             // console.log("Camera changed:", ev.detail);
        }
     }, [isRouteCalculated]);

     // Initialize map center based on fetched location or default
     const initialCameraProps: MapCameraProps = {
        center: initialCenter,
        zoom: 13
     };


   if (!apiKey) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-gradient-to-br from-background to-muted/30">
         <p className="text-destructive text-center">Google Maps API Key is missing. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.</p>
       </div>
     );
   }


   return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-gradient-to-br from-background to-muted/30">
       {/* Warning Popup (Placeholder - logic removed) */}
       {/* <AnimatePresence>
         {showWarningPopup && (
           <motion.div ... >
             <p>⚠️ Route includes high-risk zones...</p>
           </motion.div>
         )}
       </AnimatePresence> */}

       {/* Map container */}
        <div className="w-full max-w-4xl h-[400px] md:h-[500px] mb-4 rounded-lg overflow-hidden shadow-lg border border-border">
          {isClient ? (
            <APIProvider apiKey={apiKey}>
               <Map
                 ref={mapRef} // Assign ref to map instance
                 mapId={mapId}
                 defaultCenter={initialCenter} // Use state for initial center
                 defaultZoom={13}
                 gestureHandling={'greedy'}
                 disableDefaultUI={true}
                 className="w-full h-full"
                 mapTypeId="roadmap"
                 // onCameraChanged={handleCameraChange} // Optional: handle camera changes
                 {...initialCameraProps} // Control camera state if needed
               >
                 {/* Source Marker */}
                 {!isFetchingLocation && sourceCoords && (
                   <AdvancedMarker position={sourceCoords} title="Your Location">
                     <Pin background={'hsl(var(--primary))'} glyphColor={'#fff'} borderColor={'#fff'} />
                   </AdvancedMarker>
                 )}

                 {/* Destination Marker */}
                 {selectedDestinationCoords && (
                   <AdvancedMarker position={selectedDestinationCoords} title={`Destination: ${destination}`}>
                     <Pin background={'hsl(var(--destructive))'} glyphColor={'#fff'} borderColor={'#fff'} />
                   </AdvancedMarker>
                 )}

                 {/* Directions Renderer */}
                 {isRouteCalculated && directionsResult && (
                     <DirectionsRendererComponent directionsResult={directionsResult} />
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
           placeholder="Enter destination landmark (e.g., T. Nagar)"
           value={destination}
           onChange={(e) => setDestination(e.target.value)}
           list="landmarks"
           className="bg-input border-border focus:ring-primary"
           disabled={isCalculatingRoute}
         />
         <datalist id="landmarks">
           {Object.keys(landmarkCoords).map((landmark, idx) => (
             <option key={idx} value={landmark} />
           ))}
         </datalist>

         {/* Route Preference Radio Group Removed */}
         {/* <div className='...'> ... </div> */}

         {/* Action Buttons */}
         <div className='flex flex-col sm:flex-row gap-3'>
           <Button onClick={handleFindRouteClick} className="flex-1 bg-primary hover:bg-accent" disabled={!isClient || !sourceCoords || isFetchingLocation || isCalculatingRoute}>
             {isCalculatingRoute ? 'Calculating...' : 'Find Route'}
           </Button>
           <Button variant="outline" onClick={handleManualLocation} className="flex-1" disabled={!isClient || isFetchingLocation || isCalculatingRoute}>
              {isFetchingLocation ? 'Getting Location...' : 'Use Current Location'}
           </Button>
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
             <p>Distance: <span className="font-medium text-primary">{totalDistance}</span></p>
             <p>Est. Duration: <span className="font-medium text-primary">{totalDuration}</span></p>
             {/* Risk info removed */}
             {/* <p>Avg. Risk Score: ...</p> */}
             {/* {segmentRisks.filter(s => s.riskScore >= 4).length > 0 && ( ... )} */}
           </motion.div>
         )}
       </motion.div>
     </div>
    );
};

NavigationPage.displayName = 'NavigationPage';

export default NavigationPage;

