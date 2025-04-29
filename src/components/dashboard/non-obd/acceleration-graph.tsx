'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Mock Acceleration Data (m/s^2) - Simulating Chennai Traffic
const mockAccelerationData = {
    Urban: [ // Frequent start/stop, some harsh braking
        { time: '0s', acceleration: 0.5 },
        { time: '5s', acceleration: 1.8 }, // Acceleration
        { time: '10s', acceleration: 0.2 }, // Coasting
        { time: '15s', acceleration: -3.5 }, // Harsh Braking (Kodambakkam)
        { time: '20s', acceleration: 0.8 }, // Gentle acceleration
        { time: '25s', acceleration: 1.5 },
        { time: '30s', acceleration: -2.8 }, // Braking for traffic
        { time: '35s', acceleration: 0.1 }, // Crawling
        { time: '40s', acceleration: 2.0 },
        { time: '45s', acceleration: -1.0 },
        { time: '50s', acceleration: -4.0 }, // Another harsh brake (T. Nagar peak hour)
        { time: '55s', acceleration: 1.2 },
        { time: '60s', acceleration: 0.0 },
    ],
    Highway: [ // Smoother acceleration, less braking
        { time: '0s', acceleration: 1.0 },
        { time: '5s', acceleration: 2.5 },
        { time: '10s', acceleration: 1.5 },
        { time: '15s', acceleration: 0.8 }, // Cruising
        { time: '20s', acceleration: 0.5 },
        { time: '25s', acceleration: 2.8 }, // Overtaking
        { time: '30s', acceleration: 1.0 },
        { time: '35s', acceleration: -1.5 }, // Gentle braking for curve
        { time: '40s', acceleration: 0.6 },
        { time: '45s', acceleration: 1.2 },
        { time: '50s', acceleration: 0.4 },
        { time: '55s', acceleration: -2.0 }, // Braking for toll/exit
        { time: '60s', acceleration: 0.2 },
    ],
    Rainy: [ // Cautious acceleration, more braking events
        { time: '0s', acceleration: 0.3 },
        { time: '5s', acceleration: 1.0 },
        { time: '10s', acceleration: -1.5 }, // Cautious braking
        { time: '15s', acceleration: 0.6 },
        { time: '20s', acceleration: -2.5 }, // Braking harder for puddle/visibility
        { time: '25s', acceleration: 0.4 },
        { time: '30s', acceleration: 1.2 },
        { time: '35s', acceleration: -2.0 },
        { time: '40s', acceleration: -3.0 }, // Sudden brake due to low grip / panic
        { time: '45s', acceleration: 0.7 },
        { time: '50s', acceleration: -1.8 },
        { time: '55s', acceleration: 0.5 },
        { time: '60s', acceleration: -1.0 },
    ]
};

interface AccelerationGraphProps {
  rideCondition: 'Urban' | 'Highway' | 'Rainy';
}

const AccelerationGraph: React.FC<AccelerationGraphProps> = ({ rideCondition }) => {
  const chartData = mockAccelerationData[rideCondition];
  const harshBrakingThreshold = -2.5; // m/s^2

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
    >
      <Card className="shadow-md h-full">
        <CardHeader>
          <CardTitle>Acceleration Profile</CardTitle>
           <CardDescription>Acceleration & braking patterns ({rideCondition} conditions)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: -25, // Adjust for Y-axis label
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[-5, 5]} label={{ value: 'm/s²', angle: -90, position: 'insideLeft', fill:'hsl(var(--muted-foreground))', dx: -15 }}/>
               <Tooltip
                 contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                 labelStyle={{ color: 'hsl(var(--foreground))' }}
                 itemStyle={{ color: 'hsl(var(--foreground))' }}
                 formatter={(value: number) => [`${value.toFixed(1)} m/s²`, 'Acceleration']}
               />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
              <ReferenceLine y={harshBrakingThreshold} label={{ value: "Harsh Braking", position: "insideTopLeft", fill: "hsl(var(--destructive))", fontSize: 10 }} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="acceleration"
                 stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
                 activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AccelerationGraph;
