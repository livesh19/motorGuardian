
'use client'; // Ensure this runs on the client

import React from 'react';
import AppLayout from '@/components/layout/app-layout';
import ObdMetricsCard from '@/components/dashboard/obd/obd-metrics-card';
import SpeedRpmChart from '@/components/dashboard/obd/speed-rpm-chart';
import DiagnosticsCard from '@/components/dashboard/diagnostics-card';
import TripHistoryTable from '@/components/dashboard/trip-history-table';
import RiderHealthGauge from '@/components/dashboard/rider-health-gauge';
import { GaugeCircle, Zap, Droplet, Battery, Fuel, Thermometer } from 'lucide-react'; // Use GaugeCircle

interface ObdDashboardProps {
  rideCondition: 'Urban' | 'Highway' | 'Rainy'; // Receive from AppLayout
}

// Mock data for OBD metrics
const mockObdData = {
  speed: 65,
  rpm: 4200,
  throttlePosition: 30,
  coolantTemp: 85,
  fuelLevel: 75,
  batteryVoltage: 12.4,
};

const mockDiagnostics = {
    dtcCodes: ['P0301'], // Example: Cylinder 1 Misfire Detected
    warnings: ['Aggressive Acceleration Detected'],
    ecoScore: 68, // Example score
    riderHealthScore: 72, // Example score
};


const ObdDashboard: React.FC<ObdDashboardProps> = ({ rideCondition = 'Urban' }) => {
  // In a real app, this data would come from state management or API calls
  const { speed, rpm, throttlePosition, coolantTemp, fuelLevel, batteryVoltage } = mockObdData;
  const { dtcCodes, warnings, ecoScore, riderHealthScore } = mockDiagnostics;

  return (
    <div className="space-y-6 h-full">
      <h1 className="text-2xl font-semibold text-foreground">OBD Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <ObdMetricsCard title="Speed" value={speed} unit="km/h" Icon={GaugeCircle} colorClass="text-blue-400" />
        <ObdMetricsCard title="RPM" value={rpm} unit="" Icon={Zap} colorClass="text-yellow-400" />
        <ObdMetricsCard title="Throttle Pos." value={throttlePosition} unit="%" Icon={Fuel} colorClass="text-purple-400" />
        <ObdMetricsCard title="Coolant Temp." value={coolantTemp} unit="°C" Icon={Thermometer} colorClass="text-orange-400" />
        <ObdMetricsCard title="Fuel Level" value={fuelLevel} unit="%" Icon={Droplet} colorClass="text-teal-400" />
        <ObdMetricsCard title="Battery" value={batteryVoltage} unit="V" Icon={Battery} colorClass="text-indigo-400" />
      </div>

      {/* Chart and Diagnostics/Gauge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpeedRpmChart rideCondition={rideCondition} />
        </div>
        <div className="lg:col-span-1 grid grid-rows-2 gap-6">
           <DiagnosticsCard dtcCodes={dtcCodes} warnings={warnings} ecoScore={ecoScore} rideCondition={rideCondition} />
           <RiderHealthGauge score={riderHealthScore} rideCondition={rideCondition} />
        </div>
      </div>

      {/* Trip History */}
      <div>
        <TripHistoryTable rideCondition={rideCondition} />
      </div>
    </div>
  );
};


// Wrap the dashboard page with the AppLayout
export default function ObdDashboardPage() {
    // This outer component ensures AppLayout receives the props correctly
    // The actual rideCondition state will be managed in AppLayout
    return (
        <AppLayout bikeType="obd">
             {/* Pass props down from AppLayout */}
           {(props) => <ObdDashboard {...props} />}
        </AppLayout>
    );
}
