'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioTower, ShieldAlert } from 'lucide-react';

interface ProximityCrashScoreProps {
  proximityAlertCount: number;
  crashLikelihoodScore: number; // Score out of 100 (higher is worse)
  rideCondition: 'Urban' | 'Highway' | 'Rainy';
}

const ProximityCrashScore: React.FC<ProximityCrashScoreProps> = ({
   proximityAlertCount: initialProximityCount,
   crashLikelihoodScore: initialCrashScore,
   rideCondition
 }) => {

    // Adjust metrics based on condition (example)
    let proximityAlertCount = initialProximityCount;
    let crashLikelihoodScore = initialCrashScore;

    if (rideCondition === 'Urban') {
        proximityAlertCount = Math.max(0, proximityAlertCount + 5); // More alerts in city
        crashLikelihoodScore = Math.min(100, crashLikelihoodScore + 10);
    } else if (rideCondition === 'Rainy') {
        proximityAlertCount = Math.max(0, proximityAlertCount + 3);
        crashLikelihoodScore = Math.min(100, crashLikelihoodScore + 20); // Higher risk in rain
    } else if (rideCondition === 'Highway') {
         crashLikelihoodScore = Math.min(100, crashLikelihoodScore + 5); // Higher speed risk
    }

    // Ensure scores are within bounds
    proximityAlertCount = Math.round(proximityAlertCount);
    crashLikelihoodScore = Math.round(crashLikelihoodScore);


  const circumference = 2 * Math.PI * 35; // R = 35
  const offset = circumference - (crashLikelihoodScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s < 30) return 'hsl(var(--success))'; // Green (Low Likelihood)
    if (s < 60) return 'hsl(var(--chart-4))'; // Yellow (Medium Likelihood)
    return 'hsl(var(--destructive))'; // Red (High Likelihood)
  };

  const color = getColor(crashLikelihoodScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="h-full"
    >
      <Card className="shadow-md h-full flex flex-col">
        <CardHeader>
          <CardTitle>Proximity & Risk Assessment</CardTitle>
           <CardDescription>Alerts and crash likelihood ({rideCondition})</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-around space-y-6 py-6">
           {/* Proximity Alert */}
           <div className="text-center">
             <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center justify-center">
                 <RadioTower className="h-4 w-4 mr-2 text-blue-400" /> Proximity Alerts
             </h3>
             <p className="text-3xl font-bold text-foreground">{proximityAlertCount}</p>
             <Badge variant={proximityAlertCount > 5 ? "destructive" : proximityAlertCount > 2 ? "secondary" : "default"} className={`mt-1 ${proximityAlertCount > 5 ? '' : proximityAlertCount > 2 ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-green-600/20 text-green-400 border-green-600/30'}`}>
                {proximityAlertCount > 5 ? "High" : proximityAlertCount > 2 ? "Medium" : "Low"} Count
             </Badge>
           </div>

           {/* Crash Likelihood Gauge */}
           <div className="text-center">
             <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center justify-center">
                 <ShieldAlert className="h-4 w-4 mr-2 text-red-500" /> Crash Likelihood
             </h3>
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" strokeWidth="8" stroke="hsl(var(--muted))" fill="transparent" />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="35"
                    strokeWidth="8"
                    stroke={color}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>
                    {crashLikelihoodScore}%
                  </text>
                </svg>
              </div>
                <Badge variant={crashLikelihoodScore > 60 ? "destructive" : crashLikelihoodScore > 30 ? "secondary" : "default"} className={`mt-2 ${crashLikelihoodScore > 60 ? '' : crashLikelihoodScore > 30 ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-green-600/20 text-green-400 border-green-600/30'}`}>
                    Risk: {crashLikelihoodScore > 60 ? "High" : crashLikelihoodScore > 30 ? "Medium" : "Low"}
                </Badge>
           </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProximityCrashScore;
