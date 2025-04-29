'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Mock data simulating Speed vs RPM over time during a Chennai ride
const mockChartData = [
  { time: '0s', speed: 0, rpm: 800 },
  { time: '5s', speed: 15, rpm: 1500 }, // Start moving in traffic
  { time: '10s', speed: 30, rpm: 2500 }, // Acceleration (Anna Salai)
  { time: '15s', speed: 25, rpm: 2000 }, // Slight slow down
  { time: '20s', speed: 45, rpm: 3500 }, // Moderate speed (OMR)
  { time: '25s', speed: 50, rpm: 4000 },
  { time: '30s', speed: 35, rpm: 2800 }, // Braking for traffic light (Tidel Park)
  { time: '35s', speed: 10, rpm: 1200 }, // Slow moving
  { time: '40s', speed: 20, rpm: 1800 }, // Picking up speed
  { time: '45s', speed: 60, rpm: 4500 }, // Faster stretch (ECR approach)
  { time: '50s', speed: 70, rpm: 5000 },
  { time: '55s', speed: 65, rpm: 4800 },
  { time: '60s', speed: 40, rpm: 3000 }, // Slowing down for junction
];

interface SpeedRpmChartProps {
  rideCondition: 'Urban' | 'Highway' | 'Rainy'; // Added prop
}


const SpeedRpmChart: React.FC<SpeedRpmChartProps> = ({ rideCondition }) => {

    // Adjust data based on condition (simple example)
    const getDataForCondition = () => {
        switch(rideCondition) {
            case 'Highway':
                return mockChartData.map(d => ({ ...d, speed: Math.min(100, d.speed * 1.5), rpm: Math.min(7000, d.rpm * 1.3) }));
            case 'Rainy':
                 return mockChartData.map(d => ({ ...d, speed: Math.max(0, d.speed * 0.7), rpm: Math.max(800, d.rpm * 0.8) }));
            case 'Urban':
            default:
                return mockChartData;
        }
    }

   const chartData = getDataForCondition();


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Ride Dynamics: Speed vs RPM</CardTitle>
          <CardDescription>Live performance overview ({rideCondition} condition)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10, // Reduced right margin
                left: -20, // Adjusted left margin to pull Y-axis labels closer
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" fontSize={12} label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill:'hsl(var(--chart-1))', dx: -15 }} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" fontSize={12} label={{ value: 'RPM', angle: 90, position: 'insideRight', fill:'hsl(var(--chart-2))', dx: 15 }} />
              <Tooltip
                 contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                 labelStyle={{ color: 'hsl(var(--foreground))' }}
                 itemStyle={{ color: 'hsl(var(--foreground))' }}
               />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line yAxisId="left" type="monotone" dataKey="speed" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 6 }} name="Speed (km/h)" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="rpm" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 6 }} name="RPM" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SpeedRpmChart;
