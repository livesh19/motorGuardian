
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
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
  useMap,
  MapCameraChangedEvent,
  MapCameraProps,
} from '@vis.gl/react-google-maps';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react'; // Import Loader icon

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

// Mock Accident Data (Example locations in Chennai)
const mockAccidentData: google.maps.LatLngLiteral[] = [
  { lat: 13.041, lng: 80.235 }, // T. Nagar
  { lat: 13.043, lng: 80.237 }, // T. Nagar
  { lat: 13.058, lng: 80.264 }, // Anna Salai near Spencer Plaza
  { lat: 13.056, lng: 80.266 }, // Anna Salai
  { lat: 13.007, lng: 80.221 }, // Guindy Kathipara Junction area
  { lat: 13.009, lng: 80.223 }, // Guindy
  { lat: 13.000, lng: 80.268 }, // Besant Nagar Beach Road
  { lat: 12.991, lng: 80.248 }, // OMR Tidel Park area
  { lat: 12.988, lng: 80.246 }, // OMR
  { lat: 13.080, lng: 80.271 }, // Central Station surroundings
  { lat: 13.036, lng: 80.270 }, // Mylapore Tank area
  { lat: 13.074, lng: 80.195 }, // Koyambedu Bus Stand area
  // Add more points for a denser heatmap
  { lat: 13.045, lng: 80.240 },
  { lat: 13.050, lng: 80.255 },
  { lat: 13.005, lng: 80.259 }, // Adyar
  { lat: 13.061, lng: 80.249 }, // Nungambakkam High Road
];

// Component to render Directions using DirectionsRenderer
const DirectionsRendererComponent: React.FC<{ directionsResult: google.maps.DirectionsResult | null }> = ({ directionsResult }) => {
    const map = useMap();
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

    useEffect(() => {
        if (!map) return;

        // Initialize or get the existing DirectionsRenderer instance
        if (!directionsRendererRef.current) {
            console.log("Initializing DirectionsRenderer");
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
                 suppressMarkers: true, // We use AdvancedMarker for start/end points
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
            console.log("Setting directions on renderer:", directionsResult);
            directionsRendererRef.current.setDirections(directionsResult);
        } else {
            // Clear directions if result is null
            console.log("Clearing directions from renderer");
            if (directionsRendererRef.current) {
                 directionsRendererRef.current.setDirections({ routes: [] });
                 // Optionally reset map view here if needed when clearing route
                 // map.setCenter(defaultCenter);
                 // map.setZoom(defaultZoom);
            }
        }

         // Cleanup function: Remove directions from map when component unmounts or dependencies change significantly
        // return () => {
        //     if (directionsRendererRef.current) {
        //          console.log("Cleaning up DirectionsRenderer");
        //          directionsRendererRef.current.setMap(null); // Detach from map
        //     }
        // };
    }, [map, directionsResult]); // Re-run when map instance or directionsResult changes

    return null; // This component manages the renderer but doesn't render direct DOM elements
};

// Component to render Heatmap
const HeatmapLayerComponent: React.FC<{ data: google.maps.LatLngLiteral[] }> = ({ data }) => {
    const map = useMap();
    const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

    useEffect(() => {
        if (!map || typeof google === 'undefined' || !google.maps.visualization) {
            console.log("Map or visualization library not ready for heatmap.");
            return;
        }

        // Convert LatLngLiteral data to LatLng objects for the HeatmapLayer
        const heatmapData = data.map(coord => new google.maps.LatLng(coord.lat, coord.lng));

        // Initialize or update the HeatmapLayer
        if (!heatmapRef.current) {
            console.log("Initializing HeatmapLayer with data:", heatmapData.length);
            heatmapRef.current = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                map: map,
                radius: 25, // Adjusted radius
                opacity: 0.7, // Adjusted opacity
                 gradient: [ // Optional: Customize heatmap colors
                    "rgba(0, 255, 255, 0)", // Transparent cyan
                    "rgba(0, 255, 255, 1)", // Opaque cyan
                    "rgba(0, 191, 255, 1)", // Deep sky blue
                    "rgba(0, 127, 255, 1)", // Azure
                    "rgba(0, 63, 255, 1)",  // Blue
                    "rgba(0, 0, 255, 1)",   // Blue
                    "rgba(0, 0, 223, 1)", // Darker blue
                    "rgba(0, 0, 191, 1)", // Darker blue
                    "rgba(0, 0, 159, 1)", // Darker blue
                    "rgba(0, 0, 127, 1)", // Very dark blue
                    "rgba(63, 0, 91, 1)", // Purple
                    "rgba(127, 0, 63, 1)", // Dark red
                    "rgba(191, 0, 31, 1)", // Red
                    "rgba(255, 0, 0, 1)" // Red
                ]
            });
        } else {
            console.log("Updating HeatmapLayer data");
            heatmapRef.current.setData(heatmapData);
            // Ensure it's still on the map
            if (heatmapRef.current.getMap() !== map) {
                heatmapRef.current.setMap(map);
            }
        }

        // No cleanup function needed here as the layer persists with the map instance managed by APIProvider

    }, [map, data]); // Re-run when map instance or data changes

    return null; // Component manages the layer, doesn't render DOM
};


const NavigationPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [sourceCoords, setSourceCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [destination, setDestination] = useState<string>('');
  const [isRouteCalculated, setIsRouteCalculated] = useState<boolean>(false);
  const [totalDistance, setTotalDistance] = useState<string>('');
  const [totalDuration, setTotalDuration] = useState<string>('');
  const [selectedDestinationCoords, setSelectedDestinationCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [isClient, setIsClient] = useState(false); // State to track client-side mounting
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const chennaiCenter: google.maps.LatLngLiteral = { lat: 13.05, lng: 80.25 }; // Fixed center
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(chennaiCenter); // State for map center
  const [mapZoom, setMapZoom] = useState<number>(13); // State for map zoom

  // Ref for map instance to control bounds etc. outside of hooks if needed
  const mapRef = useRef<google.maps.Map | null>(null);


  // Geolocation and client-side check hook
  useEffect(() => {
     setIsClient(true); // Indicate component has mounted on client
     handleManualLocation(); // Fetch location on initial load
  }, []); // Empty dependency array means run once on mount


   // Function to manually set current location
   const handleManualLocation = useCallback(() => {
      if (!navigator.geolocation) {
         toast({ title: "Error", description: "Geolocation not available.", variant: "destructive" });
         setIsFetchingLocation(false); // Stop loading state even on error
         // Set a default location if needed
         if (!sourceCoords) {
             const defaultLocation = landmarkCoords["Nungambakkam"];
             setSourceCoords(defaultLocation);
             setMapCenter(defaultLocation);
             setMapZoom(14);
         }
         return;
      }
      setIsFetchingLocation(true);
      setSourceCoords(null); // Clear previous while fetching
      // Don't reset map center immediately, wait for fetch result or failure

      navigator.geolocation.getCurrentPosition(
          (position) => {
              const { latitude, longitude } = position.coords;
              console.log("Manual location fetch success:", latitude, longitude);
              if (typeof latitude === 'number' && isFinite(latitude) &&
                  typeof longitude === 'number' && isFinite(longitude)) {
                 const newCoords = { lat: latitude, lng: longitude };
                 // Validate coords further if necessary (e.g., check if within expected bounds)
                 if (latitude > -90 && latitude < 90 && longitude > -180 && longitude < 180) {
                    setSourceCoords(newCoords);
                    setMapCenter(newCoords); // Re-center map
                    setMapZoom(15); // Zoom in closer on user location
                    toast({ title: "Location Refreshed", description: "Using current location.", duration: 3000 });
                    // Clear previous route if location changes significantly (optional)
                     // setDirectionsResult(null);
                     // setIsRouteCalculated(false);
                     // setTotalDistance('');
                     // setTotalDuration('');
                 } else {
                     console.error("Geolocation coordinates out of bounds:", newCoords);
                     toast({ title: "Location Error", description: "Received invalid coordinates. Using default.", variant: "destructive" });
                     // Fallback to default if bounds check fails
                     if (!sourceCoords) { // Check if sourceCoords is still null
                         const defaultLocation = landmarkCoords["Nungambakkam"];
                         setSourceCoords(defaultLocation);
                         setMapCenter(defaultLocation);
                         setMapZoom(14);
                     }
                 }
              } else {
                console.error("Invalid manual coordinates received:", latitude, longitude);
                toast({ title: "Location Error", description: "Received invalid coordinates format. Using default.", variant: "destructive" });
                 // Fallback to default if format is invalid
                 if (!sourceCoords) {
                    const defaultLocation = landmarkCoords["Nungambakkam"];
                    setSourceCoords(defaultLocation);
                    setMapCenter(defaultLocation);
                    setMapZoom(14);
                 }
              }
              setIsFetchingLocation(false);
          },
          (error) => {
               console.error("Error getting manual location:", error);
               toast({ title: "Location Error", description: `Could not get current location: ${error.message}. Using default.`, variant: "destructive" });
                // Fallback to default on error
                if (!sourceCoords) {
                    const defaultLocation = landmarkCoords["Nungambakkam"];
                    setSourceCoords(defaultLocation);
                    setMapCenter(defaultLocation);
                    setMapZoom(14);
                }
               setIsFetchingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 } // Adjusted options
      );
   }, [toast, sourceCoords]); // Include sourceCoords to potentially avoid unnecessary state updates if already set


   // Function to calculate route using Google Maps Directions Service
   const handleCalculateRoute = useCallback(async () => {
     if (!isClient || !sourceCoords || !destination) return;
     console.log("Calculating route from:", sourceCoords, "to:", destination);

     const destCoords = landmarkCoords[destination];
     if (!destCoords) {
       toast({ title: "Error", description: "Destination landmark not recognized.", variant: "destructive" });
       return;
     }

     // Ensure source coordinates are valid before proceeding
     if (!sourceCoords || typeof sourceCoords.lat !== 'number' || !isFinite(sourceCoords.lat) || typeof sourceCoords.lng !== 'number' || !isFinite(sourceCoords.lng)) {
        toast({ title: "Error", description: "Invalid source location coordinates.", variant: "destructive" });
        handleManualLocation(); // Try fetching location again
        return;
     }


     setSelectedDestinationCoords(destCoords);
     setIsCalculatingRoute(true);
     setDirectionsResult(null); // Clear previous result
     setIsRouteCalculated(false);
     setTotalDistance('');
     setTotalDuration('');

     try {
        // Ensure DirectionsService is available
        if (typeof google === 'undefined' || !google.maps || !google.maps.DirectionsService) {
            throw new Error("Google Maps Directions Service not loaded.");
        }
        const directionsService = new google.maps.DirectionsService();
        const request: google.maps.DirectionsRequest = {
            origin: sourceCoords,
            destination: destCoords,
            travelMode: google.maps.TravelMode.DRIVING, // Assuming driving mode
        };

        console.log("Sending Directions Request:", request);
        const response = await directionsService.route(request);
        console.log("Directions response:", response);

        if (response.status === 'OK' && response.routes.length > 0) {
            setDirectionsResult(response); // Trigger the DirectionsRendererComponent
            setIsRouteCalculated(true);
            const route = response.routes[0].legs[0];
            setTotalDistance(route.distance?.text || 'N/A');
            setTotalDuration(route.duration?.text || 'N/A');

             // Fit map bounds to the route - Let DirectionsRendererComponent handle this
             // The DirectionsRenderer usually adjusts the viewport automatically.
             // If manual control is needed:
            if (mapRef.current && response.routes[0].bounds) {
                 console.log("Fitting map to bounds:", response.routes[0].bounds);
                 mapRef.current.fitBounds(response.routes[0].bounds, 80); // Add padding
            } else {
                  console.log("Map ref or route bounds not available for fitting.");
                  // Optional: Fallback centering if fitBounds fails
                  const midLat = (sourceCoords.lat + destCoords.lat) / 2;
                  const midLng = (sourceCoords.lng + destCoords.lng) / 2;
                  setMapCenter({ lat: midLat, lng: midLng });
                  // Calculate appropriate zoom level based on distance (more complex)
                  setMapZoom(12); // Example fallback zoom
            }
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
   }, [isClient, sourceCoords, destination, toast, handleManualLocation]); // Dependencies


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
               toast({ title: "Location Needed", description: "Fetching current location...", variant: "destructive" });
               handleManualLocation(); // Attempt to get location again
               return;
          }
          // Additional check for valid source coordinates before calculating
          if (typeof sourceCoords.lat !== 'number' || !isFinite(sourceCoords.lat) || typeof sourceCoords.lng !== 'number' || !isFinite(sourceCoords.lng)) {
               toast({ title: "Invalid Location", description: "Current location is invalid. Please try refreshing location.", variant: "destructive" });
               handleManualLocation();
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
                 // Optionally reset map view
                 if (sourceCoords && isFinite(sourceCoords.lat) && isFinite(sourceCoords.lng)) {
                     setMapCenter(sourceCoords);
                     setMapZoom(13);
                 } else {
                     setMapCenter(chennaiCenter);
                     setMapZoom(13);
                 }
            }
         }
     }, [destination, isClient, sourceCoords]); // Add sourceCoords dependency

     // Camera handling
     const handleCameraChange = useCallback((ev: MapCameraChangedEvent) => {
         // Update state if needed, but be cautious of feedback loops with fitBounds
         // setMapCenter(ev.detail.center);
         // setMapZoom(ev.detail.zoom);
         // console.log("Camera changed:", ev.detail.center, ev.detail.zoom);
     }, []);

     // Callback to get the map instance once it's loaded
     const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
         console.log("Map instance loaded and assigned to ref:", mapInstance);
         mapRef.current = mapInstance;
         // You could potentially re-trigger route calculation or fitting here
         // if directionsResult exists but wasn't rendered properly before map load.
         // if (directionsResult && mapRef.current && directionsResult.routes[0]?.bounds) {
         //    mapRef.current.fitBounds(directionsResult.routes[0].bounds);
         // }
     }, []);


   if (!apiKey) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-gradient-to-br from-background to-muted/30">
         <p className="text-destructive text-center">Google Maps API Key is missing. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.</p>
       </div>
     );
   }


   return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-gradient-to-br from-background to-muted/30">

       {/* Map container */}
        <div className="w-full max-w-4xl h-[400px] md:h-[500px] mb-4 rounded-lg overflow-hidden shadow-lg border border-border relative">
          {/* Loading Overlay */}
          {(isFetchingLocation || isCalculatingRoute) && (
              <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-muted-foreground">
                      {isFetchingLocation ? 'Getting location...' : 'Calculating route...'}
                  </p>
              </div>
          )}
          {isClient ? (
            <APIProvider apiKey={apiKey} libraries={['visualization', 'marker', 'routes']}> {/* Add 'routes' library */}
               <Map
                 ref={mapRef} // Assign ref here - Important: APIProvider must wrap Map for useMap hook to work in children
                 mapId={mapId}
                 center={mapCenter} // Controlled center
                 zoom={mapZoom} // Controlled zoom
                 gestureHandling={'greedy'}
                 disableDefaultUI={true}
                 className="w-full h-full"
                 mapTypeId="roadmap"
                 onCameraChanged={handleCameraChange}
                 // onLoad={onMapLoad} // `ref` prop is preferred with APIProvider
                 options={{ // Pass initial options if needed
                    // Example: mapTypeControl: false, streetViewControl: false
                 }}
               >
                 {/* Source Marker - Check if sourceCoords is valid */}
                 {sourceCoords && typeof sourceCoords.lat === 'number' && typeof sourceCoords.lng === 'number' && isFinite(sourceCoords.lat) && isFinite(sourceCoords.lng) && (
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

                 {/* Directions Renderer Component */}
                 <DirectionsRendererComponent directionsResult={directionsResult} />

                 {/* Heatmap Layer Component */}
                 <HeatmapLayerComponent data={mockAccidentData} />

               </Map>
            </APIProvider>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <p className="text-muted-foreground">Initializing Map...</p>
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
           disabled={isCalculatingRoute || isFetchingLocation}
         />
         <datalist id="landmarks">
           {Object.keys(landmarkCoords).map((landmark, idx) => (
             <option key={idx} value={landmark} />
           ))}
         </datalist>

         {/* Action Buttons */}
         <div className='flex flex-col sm:flex-row gap-3'>
           <Button onClick={handleFindRouteClick} className="flex-1 bg-primary hover:bg-accent" disabled={!isClient || isFetchingLocation || isCalculatingRoute}>
             {isCalculatingRoute ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</>) : 'Find Route'}
           </Button>
           <Button variant="outline" onClick={handleManualLocation} className="flex-1" disabled={!isClient || isFetchingLocation || isCalculatingRoute}>
              {isFetchingLocation ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Locating...</>) : 'Refresh Location'}
           </Button>
         </div>

          {/* Route Information Panel */}
          {isRouteCalculated && (
           <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: 'auto' }}
             transition={{ duration: 0.3 }}
             className="mt-2 p-3 border border-border rounded-md bg-background/50 text-xs"
           >
             <h3 className="font-semibold mb-1 text-sm text-foreground">Route Summary</h3>
             <p>Distance: <span className="font-medium text-primary">{totalDistance}</span></p>
             <p>Est. Duration: <span className="font-medium text-primary">{totalDuration}</span></p>
             <p className="mt-1 text-muted-foreground">Heatmap shows areas with higher mock accident frequency.</p>
           </motion.div>
         )}

         {/* Proceed Buttons (conditionally rendered) */}
         {isRouteCalculated && (
           <div className="flex flex-col sm:flex-row gap-2 mt-4 border-t border-border pt-4">
             <Button onClick={() => router.push('/dashboard-non-obd')} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
               Proceed to Non-OBD Dashboard
             </Button>
             <Button onClick={() => router.push('/dashboard-obd')} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
               Proceed to OBD Dashboard
             </Button>
           </div>
         )}

       </motion.div>
     </div>
    );
};

NavigationPage.displayName = 'NavigationPage';

export default NavigationPage;
