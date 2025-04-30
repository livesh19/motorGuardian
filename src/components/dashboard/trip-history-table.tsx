'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock Trip Data - Chennai based routes and events
const mockTrips = [
  { id: 'T001', date: '2024-07-28', route: 'Home (Adyar) -> Office (OMR)', distance: '18 km', duration: '45 min', avgSpeed: '24 km/h', events: ['Harsh Braking (Tidel Park)', 'Near Miss (SRP Tools)'] },
  { id: 'T002', date: '2024-07-27', route: 'T. Nagar Shopping -> Marina Beach', distance: '12 km', duration: '55 min', avgSpeed: '13 km/h', events: ['Aggressive Acceleration (Pondy Bazaar)', 'Harsh Braking (Light House)'] },
  { id: 'T003', date: '2024-07-26', route: 'Weekend Ride (ECR)', distance: '65 km', duration: '1 hr 30 min', avgSpeed: '43 km/h', events: ['Over Speeding (Akkarai)'] },
  { id: 'T004', date: '2024-07-25', route: 'Guindy -> Airport (Rainy)', distance: '8 km', duration: '30 min', avgSpeed: '16 km/h', events: ['Harsh Braking (Kathipara)', 'Slippery Road Alert'] },
  { id: 'T005', date: '2024-07-24', route: 'Koyambedu Market -> Anna Nagar', distance: '6 km', duration: '25 min', avgSpeed: '14 km/h', events: ['Near Miss (Thirumangalam)'] },
];

interface TripHistoryTableProps {
  rideCondition: 'Urban' | 'Highway' | 'Rainy'; // Added prop
}

const TripHistoryTable: React.FC<TripHistoryTableProps> = ({ rideCondition }) => {

   // Filter or modify trips based on condition (simple example)
    const filteredTrips = mockTrips.filter(trip => {
        if (rideCondition === 'Rainy') return trip.route.includes('Rainy');
        if (rideCondition === 'Highway') return trip.route.includes('ECR') || trip.avgSpeed > '40 km/h';
        if (rideCondition === 'Urban') return !trip.route.includes('Rainy') && !trip.route.includes('ECR') && trip.avgSpeed <= '40 km/h';
        return true; // Default show all if condition doesn't match specific filters
    }).slice(0, 3); // Limit to 3 for display


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
       <Card className="shadow-md">
        <CardHeader>
            <CardTitle>Recent Trip History</CardTitle>
            <CardDescription>Summary of your latest rides ({rideCondition} condition filter).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            {}
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Trip ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Duration</TableHead>
                 <TableHead>Avg Speed</TableHead>
                <TableHead>Key Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.id}</TableCell>
                  <TableCell>{trip.date}</TableCell>
                  <TableCell>{trip.route}</TableCell>
                  <TableCell>{trip.distance}</TableCell>
                  <TableCell>{trip.duration}</TableCell>
                   <TableCell>{trip.avgSpeed}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {trip.events.map((event, index) => (
                        <Badge key={index} variant={event.includes('Over Speeding') || event.includes('Aggressive') ? 'destructive' : event.includes('Slippery') ? 'default' : 'secondary'} className={`text-xs whitespace-nowrap ${event.includes('Slippery') ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : ''}`}>
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
               {filteredTrips.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No trips match the current filter ({rideCondition}).
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
       </Card>
    </motion.div>
  );
};

export default TripHistoryTable;
