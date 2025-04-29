'use server';
/**
 * @fileOverview Generates personalized safety tips based on recent ride data.
 *
 * - generateSafetyTips - A function that generates safety tips based on ride data.
 * - GenerateSafetyTipsInput - The input type for the generateSafetyTips function.
 * - GenerateSafetyTipsOutput - The return type for the generateSafetyTips function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {Weather, getWeather} from '@/services/weather';

const RideEventSchema = z.object({
  type: z.enum(['harsh_braking', 'over_speeding', 'near_miss']).describe('The type of ride event.'),
  location: z.string().describe('The location where the event occurred.'),
  speed: z.number().optional().describe('The speed at which the event occurred (if applicable).'),
});

const GenerateSafetyTipsInputSchema = z.object({
  rideEvents: z.array(RideEventSchema).describe('An array of recent ride events.'),
  latitude: z.number().describe('The latitude of the rider.'),
  longitude: z.number().describe('The longitude of the rider.'),
});
export type GenerateSafetyTipsInput = z.infer<typeof GenerateSafetyTipsInputSchema>;

const GenerateSafetyTipsOutputSchema = z.object({
  safetyTips: z.array(z.string()).describe('An array of personalized safety tips.'),
});
export type GenerateSafetyTipsOutput = z.infer<typeof GenerateSafetyTipsOutputSchema>;

export async function generateSafetyTips(input: GenerateSafetyTipsInput): Promise<GenerateSafetyTipsOutput> {
  return generateSafetyTipsFlow(input);
}

const shouldRecommendSafetyTips = ai.defineTool({
  name: 'shouldRecommendSafetyTips',
  description: 'Determines whether safety tips should be recommended based on ride events and weather conditions.',
  inputSchema: z.object({
    rideEvents: z.array(RideEventSchema).describe('An array of recent ride events.'),
    weatherConditions: z.string().describe('The current weather conditions.'),
  }),
  outputSchema: z.boolean().describe('Whether safety tips should be recommended.'),
},
async input => {
  // Implement logic to determine if safety tips should be recommended
  // based on the number and severity of ride events and the weather conditions.
  // For example, recommend safety tips if there are multiple harsh braking events
  // or if the weather is rainy.
  const {rideEvents, weatherConditions} = input;

  if (rideEvents.length > 2 || weatherConditions.toLowerCase().includes('rain')) {
    return true;
  }
  return false;
});


const safetyTipsPrompt = ai.definePrompt({
  name: 'safetyTipsPrompt',
  input: {
    schema: z.object({
      rideEvents: z.array(RideEventSchema).describe('An array of recent ride events.'),
      weatherConditions: z.string().describe('The current weather conditions.'),
    }),
  },
  output: {
    schema: GenerateSafetyTipsOutputSchema,
  },
  tools: [shouldRecommendSafetyTips],
  prompt: `You are an AI assistant that provides personalized safety tips to motorcycle riders based on their recent ride data and weather conditions.

  First, determine if safety tips should be recommended using the shouldRecommendSafetyTips tool.

  If safety tips should be recommended, generate a list of safety tips based on the following ride events and weather conditions:

  Ride Events:
  {{#each rideEvents}}
  - Type: {{type}}, Location: {{location}}{{#if speed}}, Speed: {{speed}}{{/if}}
  {{/each}}

  Weather Conditions: {{weatherConditions}}

  Consider the following:
  - Harsh braking events indicate a need for tips on maintaining safe following distances and anticipating traffic.
  - Over-speeding events indicate a need for tips on adhering to speed limits and being aware of road conditions.
  - Rainy weather conditions indicate a need for tips on reducing speed, increasing following distance, and being extra cautious.

  Output the safety tips in a JSON format like this: {\"safetyTips\": [\"tip 1\", \"tip 2\", ...]}

  If safety tips should not be recommended, return an empty array for safetyTips.
  `,
});

const generateSafetyTipsFlow = ai.defineFlow<
  typeof GenerateSafetyTipsInputSchema,
  typeof GenerateSafetyTipsOutputSchema
>(
  {
    name: 'generateSafetyTipsFlow',
    inputSchema: GenerateSafetyTipsInputSchema,
    outputSchema: GenerateSafetyTipsOutputSchema,
  },
  async input => {
    const weather: Weather = await getWeather(input.latitude, input.longitude);
    const {output} = await safetyTipsPrompt({
      rideEvents: input.rideEvents,
      weatherConditions: weather.conditions,
    });
    return output!;
  }
);
