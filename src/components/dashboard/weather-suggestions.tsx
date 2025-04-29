'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CloudRain, Sun, Umbrella, Wind, Lightbulb } from 'lucide-react';
import { getWeather, type Weather } from '@/services/weather'; // Import the service

interface WeatherSuggestionsProps {
  latitude: number;
  longitude: number;
  rideCondition: 'Urban' | 'Highway' | 'Rainy'; // To potentially influence suggestions further
}

const WeatherSuggestions: React.FC<WeatherSuggestionsProps> = ({ latitude, longitude, rideCondition }) => {
  const [weather, setWeather] = React.useState<Weather | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real app, call getWeather(latitude, longitude)
        // For now, simulate based on rideCondition
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

        let simulatedWeather: Weather;
        if (rideCondition === 'Rainy') {
          simulatedWeather = { temperatureCelsius: 26, conditions: 'Rainy', humidity: 85 };
        } else if (rideCondition === 'Highway' && Math.random() > 0.3) { // Sometimes sunny on highway
           simulatedWeather = { temperatureCelsius: 32, conditions: 'Sunny', humidity: 60 };
        } else { // Default Urban or sometimes cloudy highway
          simulatedWeather = { temperatureCelsius: 29, conditions: 'Cloudy', humidity: 70 };
        }
        setWeather(simulatedWeather);

      } catch (err) {
        console.error("Failed to get weather:", err);
        setError('Could not load weather data.');
        setWeather(null); // Ensure weather is null on error
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude, rideCondition]); // Refetch if location or condition changes

  const getSuggestions = (currentWeather: Weather | null): string[] => {
    if (!currentWeather) return ['Loading weather data...'];

    const suggestions: string[] = [];
    const { conditions, temperatureCelsius, humidity } = currentWeather;

    if (conditions.toLowerCase().includes('rain')) {
      suggestions.push("🌧️ Reduce speed and increase following distance.");
      suggestions.push("☂️ Ensure visor is clear and consider rain gear.");
      suggestions.push("💡 Brake gently and anticipate longer stopping distances.");
    } else if (conditions.toLowerCase().includes('sunny')) {
      suggestions.push(`☀️ Hot weather (${temperatureCelsius}°C). Stay hydrated.`);
      if (temperatureCelsius > 30) {
          suggestions.push("🕶️ Wear sunglasses/tinted visor for glare.");
      }
       if (rideCondition === 'Highway') {
           suggestions.push("🛣️ Watch out for increased traffic during clear weather.");
       }
    } else if (conditions.toLowerCase().includes('cloudy')) {
      suggestions.push(`☁️ Pleasant conditions (${temperatureCelsius}°C). Be aware of potential changes.`);
      if (humidity > 75) {
          suggestions.push("💧 High humidity. Visor might fog up.");
      }
    } else {
        suggestions.push("🤔 Unknown conditions. Ride cautiously.");
    }

    if (rideCondition === 'Urban') {
        suggestions.push("🏙️ Expect stop-and-go traffic. Stay alert.");
    } else if (rideCondition === 'Highway') {
         suggestions.push("💨 Be mindful of crosswinds on open stretches.");
    }


    return suggestions;
  };

  const suggestions = getSuggestions(weather);
  const WeatherIcon = weather?.conditions.toLowerCase().includes('rain') ? CloudRain : weather?.conditions.toLowerCase().includes('sunny') ? Sun : Wind;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="h-full"
    >
      <Card className="shadow-md h-full flex flex-col">
        <CardHeader>
          <CardTitle>Weather Adaptive Suggestions</CardTitle>
           <CardDescription>Tips based on current conditions ({rideCondition})</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading weather & suggestions...</p>
          ) : error ? (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : weather ? (
            <Alert className="bg-card border-border">
               <div className="flex items-center mb-3">
                   <WeatherIcon className="h-5 w-5 mr-2 text-primary" />
                 <AlertTitle className="font-semibold">
                     Current: {weather.temperatureCelsius}°C, {weather.conditions} ({weather.humidity}% Humidity)
                 </AlertTitle>
               </div>
              <AlertDescription>
                <ul className="space-y-2 text-sm list-none pl-0">
                  {suggestions.map((tip, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start"
                    >
                      <Lightbulb className="h-4 w-4 mr-2 mt-0.5 text-yellow-400 shrink-0" />
                      <span>{tip}</span>
                    </motion.li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
              <p className="text-center text-muted-foreground">No weather data available.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeatherSuggestions;
