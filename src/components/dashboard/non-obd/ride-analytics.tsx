'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Waves, AlertOctagon, Hand } from 'lucide-react'; // Hand for harsh braking

interface RideAnalyticsProps {
  smoothnessScore: number; // 0-100, higher is smoother
  nearMissCount: number;
  harshBrakingIndex: number; // 0-10, higher means more harsh braking
   rideCondition: 'Urban' | 'Highway' | 'Rainy';
}

const RideAnalytics: React.FC<RideAnalyticsProps> = ({
    smoothnessScore: initialSmoothness,
    nearMissCount: initialNearMiss,
    harshBrakingIndex: initialBraking,
    rideCondition
}) => {

    // Adjust analytics based on condition (example)
    let smoothnessScore = initialSmoothness;
    let nearMissCount = initialNearMiss;
    let harshBrakingIndex = initialBraking;

    if (rideCondition === 'Urban') {
        smoothnessScore = Math.max(0, smoothnessScore - 15);
        nearMissCount = Math.max(0, nearMissCount + 3);
        harshBrakingIndex = Math.min(10, harshBrakingIndex + 2);
    } else if (rideCondition === 'Rainy') {
        smoothnessScore = Math.max(0, smoothnessScore - 25); // Harder to be smooth
        nearMissCount = Math.max(0, nearMissCount + 2);
        harshBrakingIndex = Math.min(10, harshBrakingIndex + 3); // More cautious/sudden braking
    } else if (rideCondition === 'Highway') {
        smoothnessScore = Math.min(100, smoothnessScore + 10); // Can be smoother
        harshBrakingIndex = Math.max(0, harshBrakingIndex - 1); // Less braking
    }

    // Ensure scores are within bounds and integers
    smoothnessScore = Math.round(Math.max(0, Math.min(100, smoothnessScore)));
    nearMissCount = Math.round(Math.max(0, nearMissCount));
    harshBrakingIndex = Math.round(Math.max(0, Math.min(10, harshBrakingIndex)));


  const getSmoothnessColor = (score: number) => {
    if (score > 70) return 'text-green-500';
    if (score > 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBrakingColor = (index: number) => {
    if (index < 3) return 'text-green-500';
    if (index < 7) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="h-full"
    >
      <Card className="shadow-md h-full flex flex-col">
        <CardHeader>
          <CardTitle>Ride Analytics</CardTitle>
           <CardDescription>Performance metrics for your ride ({rideCondition})</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow grid grid-rows-3 gap-4 items-center justify-items-center py-6">
          {/* Smoothness Score */}
          <div className="text-center">
             <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center justify-center">
                 <Waves className="h-4 w-4 mr-2 text-blue-400" /> Smoothness Score
             </h3>
             <p className={`text-3xl font-bold ${getSmoothnessColor(smoothnessScore)}`}>{smoothnessScore}%</p>
              <Badge variant={smoothnessScore > 70 ? 'default' : smoothnessScore > 40 ? 'secondary' : 'destructive'} className={`mt-1 ${smoothnessScore > 70 ? 'bg-green-600/20 text-green-400 border-green-600/30' : smoothnessScore > 40 ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : ''}`}>
                {smoothnessScore > 70 ? "Smooth" : smoothnessScore > 40 ? "Average" : "Jerky"}
              </Badge>
          </div>

          {/* Near Miss Count */}
           <div className="text-center">
             <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center justify-center">
                 <AlertOctagon className="h-4 w-4 mr-2 text-orange-500" /> Near Miss Count
             </h3>
             <p className="text-3xl font-bold text-foreground">{nearMissCount}</p>
              <Badge variant={nearMissCount > 3 ? "destructive" : nearMissCount > 1 ? "secondary" : "default"} className={`mt-1 ${nearMissCount > 3 ? '' : nearMissCount > 1 ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-green-600/20 text-green-400 border-green-600/30'}`}>
                 {nearMissCount > 3 ? "High" : nearMissCount > 1 ? "Moderate" : "Low"} Risk Events
              </Badge>
           </div>

          {/* Harsh Braking Index */}
           <div className="text-center">
             <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center justify-center">
                 <Hand className="h-4 w-4 mr-2 text-red-500" /> Harsh Braking Index
             </h3>
             <p className={`text-3xl font-bold ${getBrakingColor(harshBrakingIndex)}`}>{harshBrakingIndex}<span className="text-sm text-muted-foreground">/10</span></p>
              <Badge variant={harshBrakingIndex > 6 ? "destructive" : harshBrakingIndex > 2 ? "secondary" : "default"} className={`mt-1 ${harshBrakingIndex > 6 ? '' : harshBrakingIndex > 2 ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-green-600/20 text-green-400 border-green-600/30'}`}>
                 {harshBrakingIndex > 6 ? "Frequent" : harshBrakingIndex > 2 ? "Occasional" : "Rare"}
              </Badge>
           </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RideAnalytics;
