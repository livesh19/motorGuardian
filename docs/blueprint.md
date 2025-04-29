# **App Name**: MotoGuardian

## Core Features:

- Login & Authentication: Implement a responsive login page with animated background and mock authentication.
- Dashboard Display: Display a dashboard with live metrics (speed, RPM, etc.) based on simulated OBD data or sensor data. Display different dashboards based on mock OBD status.
- AI Safety Tips: Provide safety tips based on simulated ride events. Use a tool to decide if safety tips are needed to be recommended based on harsh braking, over-speeding on certain routes, and weather.

## Style Guidelines:

- Dark mode theme with green accents for safe conditions and red accents for alerts.
- Use a gradient background for the login page with colors that complement the dark theme.
- Accent: Teal (#008080) for interactive elements.
- Utilize ShadCN components for a modern and consistent UI.
- Implement Framer Motion transitions for smooth UI interactions and animations.
- Use clear and intuitive icons for navigation and data visualization.

## Original User Request:
Build a stunning, responsive, and interactive web application using React, TailwindCSS, ShadCN/UI, and Framer Motion. The app should have:

1. 🚪 Login Page:
Fullscreen login screen with a modern animated background (e.g., gradient waves or bike silhouette animation).

Input fields: Email, Password.

Buttons: Login, Forgot Password.

Mock authentication logic.

2. 🔀 Conditional Routing After Login:
After login, determine if the user has an OBD-enabled or non-OBD bike.

Redirect accordingly:

/dashboard-obd for bikes with OBD.

/dashboard-non-obd for sensor-equipped bikes (ultrasonic, GPS, accelerometer).

3. 📊 OBD Dashboard (/dashboard-obd):
Cards for live OBD metrics: Speed, RPM, Throttle Position, Coolant Temp, Fuel Level, Battery Voltage.

Interactive line graph: Speed vs RPM over time (using Recharts).

Fault & diagnostics section: Live DTC Codes, Aggressive Acceleration Warning, Eco Score.

Trip history table (based on mock ride data from Chennai).

“Rider Health Score” gauge based on throttle, braking, and fuel behavior.

4. 📍 Non-OBD Dashboard (/dashboard-non-obd):
Real-time GPS location map centered on Chennai (mock routes like Anna Salai, OMR).

Proximity Alert Count, “Crash Likelihood Score” (radial gauge).

Acceleration graph from mock Chennai traffic (urban braking spikes).

Ride analytics: Smoothness Score, Near Miss Count, Harsh Braking Index.

Weather adaptive suggestions (simulate rainy/peak hour traffic conditions).

5. 🎨 UI & UX Design:
Sleek dark mode with city-themed accents (green for safe, red for alerts).

Use ShadCN components for modern cards, nav, tabs, and modals.

Framer Motion transitions for all UI interactions.

Navbar with user profile, bike type toggle, and logout option.

6. 📱 Mobile Responsiveness:
All views must work on both mobile and desktop.

Use adaptive tabs or sidebar for switching views.

7. 📦 Mock Data Notes:
All metrics, trip routes, and event data must simulate real-world traffic patterns from Chennai.

Example: High traffic in T. Nagar, braking in Kodambakkam, over-speed on ECR.

Simulate rainy day conditions or festival season ride data.

8. 🌟 Extras:
“Suggest Safety Tips” modal for users based on recent ride events.

Toggle between ride conditions (Urban, Highway, Rainy).

Export trip summary as PDF.
  