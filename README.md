# MotoGuardian

MotoGuardian is a web application designed to enhance motorcycle rider safety by providing real-time metrics, diagnostics, and AI-powered safety tips.

This is a Next.js application bootstrapped with `create-next-app` and enhanced with Firebase Studio features.

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file in the root directory by copying `.env.example` (if provided) or creating a new one. Add your Google Maps API Key:
    ```dotenv
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
    # Optional: Add your Google Maps Map ID if you have custom styling
    # NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=YOUR_MAP_ID_HERE
    ```
    You can obtain a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview).

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) (or the specified port) with your browser to see the result.

4.  **Login:**
    Use one of the following mock emails to access different dashboards:
    *   `user-obd@example.com` (any password) for the OBD Dashboard.
    *   `user-non-obd@example.com` (any password) for the Non-OBD (Sensor) Dashboard.

## Core Features

*   **Login & Authentication:** Secure login screen with mock authentication.
*   **Conditional Dashboards:** Displays different dashboards based on whether the user's bike is simulated as OBD-enabled or sensor-equipped.
*   **OBD Dashboard:** Shows live metrics (Speed, RPM, etc.), diagnostics (DTC codes, Eco Score), trip history, and a Rider Health Score.
*   **Non-OBD Dashboard:** Features a real-time GPS map (simulated Chennai routes), proximity alerts, crash likelihood score, acceleration graph, and ride analytics.
*   **AI Safety Tips:** Provides personalized safety suggestions based on simulated ride events and weather conditions using Google AI (Genkit).
*   **Responsive Design:** Fully responsive UI built with Tailwind CSS and ShadCN/UI.
*   **Animations:** Smooth UI transitions using Framer Motion.

## Tech Stack

*   Next.js (React Framework)
*   TypeScript
*   Tailwind CSS (Styling)
*   ShadCN/UI (Component Library)
*   Framer Motion (Animations)
*   Recharts (Charting)
*   @vis.gl/react-google-maps (Mapping)
*   Genkit (AI Flow Management)
*   Zod (Schema Validation)
*   React Hook Form (Form Handling)

## Folder Structure (Key Directories)

*   `src/app/`: Next.js App Router pages (login, dashboards).
*   `src/components/`: Reusable UI components (layout, dashboard cards, charts, map, modal).
*   `src/components/ui/`: ShadCN UI components.
*   `src/ai/`: Genkit AI flows (e.g., `generate-safety-tips`).
*   `src/services/`: Mock data services (e.g., weather).
*   `src/lib/`: Utility functions.
*   `src/hooks/`: Custom React hooks.

## Development Notes

*   The application uses mock data extensively to simulate bike metrics, trip routes (based on Chennai), and ride events.
*   Authentication is currently mocked on the client-side. Replace with a proper authentication provider for production.
*   Weather data is simulated based on the selected 'Ride Condition' toggle in the dashboard layout. Replace `src/services/weather.ts` with a real API call for production.
*   The AI Safety Tips feature uses Genkit. Ensure you have the necessary Google AI API keys configured if deploying or running Genkit flows locally (`npm run genkit:dev`).
