'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

interface DiagnosticsCardProps {
  dtcCodes: string[];
  warnings: string[];
  ecoScore: number;
  rideCondition: 'Urban' | 'Highway' | 'Rainy';
}

const DiagnosticsCard: React.FC<DiagnosticsCardProps> = ({ dtcCodes, warnings, ecoScore, rideCondition }) => {

   // Adjust warnings based on condition (example)
   const conditionWarnings = rideCondition === 'Rainy' ? ['Slippery Road Detected'] : [];
   const allWarnings = [...warnings, ...conditionWarnings];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="shadow-md h-full">
        <CardHeader>
          <CardTitle>Faults & Diagnostics</CardTitle>
           <CardDescription>System status & efficiency ({rideCondition})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-destructive" /> DTC Codes
            </h4>
            {dtcCodes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dtcCodes.map((code, index) => (
                  <Badge key={index} variant="destructive">{code}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> No active fault codes.
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" /> Warnings
            </h4>
            {allWarnings.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                 {allWarnings.map((warning, index) => (
                  <Badge key={index} variant="secondary" className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">{warning}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center">
                 <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> No warnings.
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-blue-500" /> Eco Score
            </h4>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${ecoScore > 75 ? 'text-green-500' : ecoScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                {ecoScore}%
              </span>
              <Badge variant={ecoScore > 75 ? 'default' : ecoScore > 50 ? 'secondary' : 'destructive'} className={ecoScore > 75 ? 'bg-green-600/20 text-green-400 border-green-600/30' : ecoScore > 50 ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : ''}>
                {ecoScore > 75 ? 'Excellent' : ecoScore > 50 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
              <p className="text-xs text-muted-foreground mt-1">Based on acceleration and braking patterns.</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DiagnosticsCard;
