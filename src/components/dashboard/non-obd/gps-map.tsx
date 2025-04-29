'use client';

import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Mock Routes in Chennai based on conditions
const routes = {
  Urban: [ // T. Nagar -> Anna Salai loop
    { lat: 13.048, lng: 80.242 },
    { lat: 13.055, lng: 80.250 },
    { lat: 13.060, lng: 80.260 }, // Anna Salai
    { lat: 13.052, lng: 80.265 },
    { lat: 13.045, lng: 80.255 },
  ],
  Highway: [ // OMR stretch
    { lat: 12.980, lng: 80.245 }, // Near Tidel Park
    { lat: 12.950, lng: 80.240 },
    { lat: 12.920, lng: 80.235 }, // Sholinganallur
    { lat: 12.890, lng: 80.230 },
    { lat: 12.860, lng: 80.225 }, // Siruseri
  ],
  Rainy: [ // Velachery -> Guindy (slower)
    { lat: 12.985, lng: 80.218 }, // Velachery
    { lat: 12.990, lng: 80.210 },
    { lat: 12.995, lng: 80.200 }, // Near Guindy Race Course
    { lat: 13.005, lng: 80.195 }, // Guindy Kathipara area
    { lat: 13.010, lng: 80.190 },
  ]
};

interface GpsMapProps {
  rideCondition: 'Urban' | 'Highway' | 'Rainy';
}


const GpsMap: React.FC<GpsMapProps> = ({ rideCondition }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID'; // Use your Map ID or fallback

  const [currentPosition, setCurrentPosition] = useState(routes[rideCondition][0]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);

   // Simulate movement along the route
   useEffect(() => {
    const route = routes[rideCondition];
    setCurrentPosition(route[0]); // Reset position when condition changes
    setRouteIndex(0);

    const interval = setInterval(() => {
      setRouteIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % route.length;
        setCurrentPosition(route[nextIndex]);
        return nextIndex;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [rideCondition]);


  if (!apiKey) {
    return (
      <Card className="shadow-md h-[400px] flex items-center justify-center">
        <CardContent>
          <p className="text-destructive">Google Maps API Key is missing. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.</p>
        </CardContent>
      </Card>
    );
  }

  const center = { lat: 13.05, lng: 80.25 }; // Center roughly on Chennai

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
       <Card className="shadow-md h-full">
         <CardHeader>
            <CardTitle>Real-Time Location</CardTitle>
            <CardDescription>Current position based on simulated {rideCondition} ride.</CardDescription>
        </CardHeader>
         <CardContent className="h-[calc(100%-80px)] p-0"> {/* Adjust height calculation based on header */}
            <APIProvider apiKey={apiKey}>
              <Map
                mapId={mapId} // Add your Map ID if you have one
                defaultCenter={center}
                defaultZoom={13}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                className="w-full h-full rounded-b-lg" // Ensure map fills the container
                 mapTypeId='roadmap' // Use standard map tiles
                 // Optional: Add styles for dark mode if needed
                 // styles={[{featureType: "all",elementType: "all",stylers: [{invert_lightness: true},{saturation: 10},{lightness: 30},{gamma: 0.5},{hue: "#435158"}]}]}
              >
                <AdvancedMarker position={currentPosition} onClick={() => setInfoWindowOpen(true)}>
                  <Pin background={'hsl(var(--primary))'} glyphColor={'#fff'} borderColor={'#fff'} />
                </AdvancedMarker>

                {infoWindowOpen && (
                    <InfoWindow position={currentPosition} onCloseClick={() => setInfoWindowOpen(false)}>
                        <p className="text-xs font-semibold text-foreground">Current Location ({rideCondition})</p>
                    </InfoWindow>
                )}
              </Map>
            </APIProvider>
         </CardContent>
       </Card>
    </motion.div>
  );
};

export default GpsMap;
