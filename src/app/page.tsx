'use client'; // Add this directive

import dynamic from 'next/dynamic';

// Dynamically import NavigationPage with ssr: false
const NavigationPage = dynamic(() => import('@/components/navigation-page'), {
  ssr: false,
  loading: () => <p className="text-center text-muted-foreground">Loading Map...</p> // Optional loading state
});


export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <NavigationPage/>
    </main>
  );
};
