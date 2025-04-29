'use client'; // Ensure this runs on the client

import React from 'react';
import AppLayout from '@/components/layout/app-layout';
import GpsMap from '@/components/dashboard/non-obd/gps-map';
import ProximityCrashScore from '@/components/dashboard/non-obd/proximity-crash-score';
import AccelerationGraph from '@/components/dashboard/non-obd/acceleration-graph';
import RideAnalytics from '@/components/dashboard/non-obd/ride-analytics';
import WeatherSuggestions from '@/components/dashboard/weather-suggestions';


interface NonObdDashboardProps {
  rideCondition: 'Urban' | 'Highway' | 'Rainy'; // Receive from AppLayout
}


// Mock data for Non-OBD sensors
const mockSensorData = {
  proximityAlertCount: 3,
  crashLikelihoodScore: 25, // Lower is better
  smoothnessScore: 65, // Higher is better
  nearMissCount: 1,
  harshBrakingIndex: 4, // Lower is better
};

// Mock Location (Chennai Center) - Pass this to relevant components
const mockLocation = {
  latitude: 13.0827,
  longitude: 80.2707,
};


const NonObdDashboard: React.FC<NonObdDashboardProps> = ({ rideCondition = 'Urban' }) => {
   const { proximityAlertCount, crashLikelihoodScore, smoothnessScore, nearMissCount, harshBrakingIndex } = mockSensorData;


  return (
    <div className="space-y-6 h-full">
       <h1 className="text-2xl font-semibold text-foreground">Sensor-Based Dashboard</h1>

        {/* Map and Proximity/Risk Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[400px] lg:h-auto"> {/* Give map a fixed height on smaller screens */}
                <GpsMap rideCondition={rideCondition} />
            </div>
            <div className="lg:col-span-1">
                 <ProximityCrashScore
                    proximityAlertCount={proximityAlertCount}
                    crashLikelihoodScore={crashLikelihoodScore}
                    rideCondition={rideCondition}
                  />
            </div>
        </div>

         {/* Acceleration, Analytics, and Weather Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div>
                 <AccelerationGraph rideCondition={rideCondition}/>
            </div>
             <div>
                 <RideAnalytics
                    smoothnessScore={smoothnessScore}
                    nearMissCount={nearMissCount}
                    harshBrakingIndex={harshBrakingIndex}
                    rideCondition={rideCondition}
                  />
             </div>
             <div>
                 <WeatherSuggestions
                    latitude={mockLocation.latitude}
                    longitude={mockLocation.longitude}
                    rideCondition={rideCondition}
                 />
             </div>
         </div>

    </div>
  );
};


// Wrap the dashboard page with the AppLayout
export default function NonObdDashboardPage() {
     // This outer component ensures AppLayout receives the props correctly
    // The actual rideCondition state will be managed in AppLayout
    return (
        <AppLayout bikeType="non-obd">
             {/* Pass props down from AppLayout */}
           {(props) => <NonObdDashboard {...props} />}
        </AppLayout>
    );
}
