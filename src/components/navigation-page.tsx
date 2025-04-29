
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
  InfoWindow, // Keep if needed for markers later
  useMap,
  MapCameraChangedEvent,
  MapCameraProps,
} from '@vis.gl/react-google-maps';

// Import utils
import { cn } from '@/lib/utils';

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
            }
        }

         // Cleanup function: Remove directions from map when component unmounts or dependencies change significantly
        return () => {
            if (directionsRendererRef.current) {
                 console.log("Cleaning up DirectionsRenderer");
                 directionsRendererRef.current.setMap(null); // Detach from map
                 // directionsRendererRef.current = null; // Remove instance if you want a new one next time
            }
        };
    }, [map, directionsResult]); // Re-run when map instance or directionsResult changes

    return null; // This component manages the renderer but doesn't render direct DOM elements
};

// Component to render Heatmap
const HeatmapLayerComponent: React.FC<{ data: google.maps.LatLngLiteral[] }> = ({ data }) => {
    const map = useMap();
    const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

    useEffect(() => {
        if (!map || !google.maps.visualization) {
            console.log("Map or visualization library not ready for heatmap.");
            return;
        }

        // Convert LatLngLiteral data to LatLng objects for the HeatmapLayer
        const heatmapData = data.map(coord => new google.maps.LatLng(coord.lat, coord.lng));

        // Initialize or update the HeatmapLayer
        if (!heatmapRef.current) {
            console.log("Initializing HeatmapLayer with data:", heatmapData);
            heatmapRef.current = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                map: map,
                radius: 20, // Adjust radius as needed
                opacity: 0.6, // Adjust opacity
            });
        } else {
            console.log("Updating HeatmapLayer data");
            heatmapRef.current.setData(heatmapData);
            // Ensure it's still on the map (might be cleared by other effects)
            if (heatmapRef.current.getMap() !== map) {
                heatmapRef.current.setMap(map);
            }
        }

        // Cleanup function
        return () => {
            if (heatmapRef.current) {
                console.log("Cleaning up HeatmapLayer");
                heatmapRef.current.setMap(null);
                // heatmapRef.current = null; // Optional: nullify if you always want a new instance
            }
        };
    }, [map, data]); // Re-run when map instance or data changes

    return null; // Component manages the layer, doesn't render DOM
};


const NavigationPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [sourceCoords, setSourceCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const chennaiCenter: google.maps.LatLngLiteral = { lat: 13.05, lng: 80.25 }; // Fixed center
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
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(chennaiCenter); // State for map center

   // Use useMap hook to get the map instance - needed for heatmap layer
  // const map = useMap(); // This needs to be used inside a Map component context

  // Ref for map instance to control bounds etc. outside of hooks if needed
  const mapRef = useRef<google.maps.Map | null>(null);


  // Geolocation and client-side check hook
  useEffect(() => {
     setIsClient(true); // Indicate component has mounted on client
     if (navigator.geolocation) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Geolocation success:", latitude, longitude);
           // Validate coordinates
           if (typeof latitude === 'number' && isFinite(latitude) &&
               typeof longitude === 'number' && isFinite(longitude)) {
               const coords = { lat: latitude, lng: longitude };
               setSourceCoords(coords);
               setMapCenter(coords); // Center map on fetched location
               toast({ title: "Location Found", description: `Current location set.`, duration: 3000 });
           } else {
                console.error("Invalid coordinates received:", latitude, longitude);
                const defaultLocation = landmarkCoords["Nungambakkam"]; // Fallback
                setSourceCoords(defaultLocation);
                setMapCenter(defaultLocation);
                toast({ title: "Location Error", description: "Received invalid coordinates. Using Nungambakkam.", variant: "destructive", duration: 5000 });
           }
          setIsFetchingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          const defaultLocation = landmarkCoords["Nungambakkam"]; // Use a default landmark
          setSourceCoords(defaultLocation);
          setMapCenter(defaultLocation);
          toast({ title: "Location Error", description: "Could not get location. Using default: Nungambakkam.", variant: "destructive", duration: 5000 });
          setIsFetchingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options for geolocation
      );
    } else {
      console.error("Geolocation is not supported.");
      const defaultLocation = landmarkCoords["Nungambakkam"]; // Use a default landmark
      setSourceCoords(defaultLocation);
      setMapCenter(defaultLocation);
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
      setMapCenter(chennaiCenter); // Reset center while fetching
      navigator.geolocation.getCurrentPosition(
          (position) => {
              const { latitude, longitude } = position.coords;
              console.log("Manual location fetch success:", latitude, longitude);
              if (typeof latitude === 'number' && isFinite(latitude) &&
                  typeof longitude === 'number' && isFinite(longitude)) {
                 const newCoords = { lat: latitude, lng: longitude };
                 setSourceCoords(newCoords);
                 setMapCenter(newCoords); // Re-center map
                 toast({ title: "Location Refreshed", description: "Using current location.", duration: 3000 });
                  // Clear previous route if location changes
                  setDirectionsResult(null);
                  setIsRouteCalculated(false);
                  setTotalDistance('');
                  setTotalDuration('');
              } else {
                console.error("Invalid manual coordinates received:", latitude, longitude);
                const defaultLocation = landmarkCoords["Nungambakkam"];
                setSourceCoords(defaultLocation);
                setMapCenter(defaultLocation);
                toast({ title: "Location Error", description: "Received invalid coordinates. Using Nungambakkam.", variant: "destructive" });
              }
              setIsFetchingLocation(false);
          },
          (error) => {
               console.error("Error getting manual location:", error);
               const defaultLocation = landmarkCoords["Nungambakkam"];
              setSourceCoords(defaultLocation);
              setMapCenter(defaultLocation);
              toast({ title: "Location Error", description: "Could not get current location. Using default.", variant: "destructive" });
              setIsFetchingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
   }, [isClient, toast]);


   // Function to calculate route using Google Maps Directions Service
   const handleCalculateRoute = useCallback(async () => {
     if (!isClient || !sourceCoords || !destination) return;
     console.log("Calculating route from:", sourceCoords, "to:", destination);

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
        // Ensure DirectionsService is available
        if (!google || !google.maps || !google.maps.DirectionsService) {
            throw new Error("Google Maps Directions Service not loaded.");
        }
        const directionsService = new google.maps.DirectionsService();
        const request: google.maps.DirectionsRequest = {
            origin: sourceCoords,
            destination: destCoords,
            travelMode: google.maps.TravelMode.DRIVING, // Assuming driving mode
        };

        const response = await directionsService.route(request);
        console.log("Directions response:", response);

        if (response.status === 'OK' && response.routes.length > 0) {
            setDirectionsResult(response); // Trigger the DirectionsRendererComponent
            setIsRouteCalculated(true);
            const route = response.routes[0].legs[0];
            setTotalDistance(route.distance?.text || 'N/A');
            setTotalDuration(route.duration?.text || 'N/A');

             // Fit map bounds to the route
            if (mapRef.current && response.routes[0].bounds) {
                console.log("Fitting map to bounds:", response.routes[0].bounds);
                mapRef.current.fitBounds(response.routes[0].bounds);
                 // Adjust zoom slightly after fitBounds if needed
                 // setTimeout(() => {
                 //   if (mapRef.current) {
                 //     const currentZoom = mapRef.current.getZoom();
                 //     if (currentZoom && currentZoom > 15) { // Don't zoom in too much
                 //       mapRef.current.setZoom(15);
                 //     }
                 //   }
                 // }, 100);
            } else {
                 console.log("Map ref or route bounds not available for fitting.");
                 // Manually center if bounds fitting fails
                 setMapCenter(sourceCoords); // Or perhaps midpoint?
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
                 // Optionally reset map view
                 if (sourceCoords) setMapCenter(sourceCoords);
                 else setMapCenter(chennaiCenter);
                 if(mapRef.current) mapRef.current.setZoom(13);
            }
         }
     }, [destination, isClient, sourceCoords]); // Add sourceCoords dependency

     // Camera handling - might conflict with fitBounds, use carefully
     const handleCameraChange = useCallback((ev: MapCameraChangedEvent) => {
         // console.log("Camera changed:", ev.detail);
         // setMapCenter(ev.detail.center); // Update center state if needed
     }, []);

     // Callback to get the map instance once it's loaded
     const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
         console.log("Map instance loaded:", mapInstance);
         mapRef.current = mapInstance;
         // We might need to re-apply heatmap or directions if they were set before map loaded
         // This can happen with complex state interactions.
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
        <div className="w-full max-w-4xl h-[400px] md:h-[500px] mb-4 rounded-lg overflow-hidden shadow-lg border border-border">
          {isClient ? (
            <APIProvider apiKey={apiKey} libraries={['visualization', 'marker']}> {/* Load visualization library */}
               <Map
                 mapId={mapId}
                 center={mapCenter} // Controlled center
                 zoom={13} // Controlled zoom (can be adjusted by fitBounds)
                 gestureHandling={'greedy'}
                 disableDefaultUI={true}
                 className="w-full h-full"
                 mapTypeId="roadmap"
                 onCameraChanged={handleCameraChange}
                 onLoad={onMapLoad} // Capture map instance
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

                 {/* Directions Renderer Component */}
                 <DirectionsRendererComponent directionsResult={directionsResult} />

                 {/* Heatmap Layer Component */}
                 <HeatmapLayerComponent data={mockAccidentData} />

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
             <p className="mt-1 text-muted-foreground">Heatmap shows areas with higher mock accident frequency.</p>
           </motion.div>
         )}
       </motion.div>
     </div>
    );
};

NavigationPage.displayName = 'NavigationPage';

export default NavigationPage;
