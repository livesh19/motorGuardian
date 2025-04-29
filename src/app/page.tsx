'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  // Optional: Add a loading state or a minimal message
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-foreground">Redirecting to login...</p>
    </div>
  );
}
