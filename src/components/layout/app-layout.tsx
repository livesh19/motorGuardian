'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Bike, Gauge, MapPin, BarChart, LogOut, Settings, User, ShieldAlert, LifeBuoy, Menu, CloudRain, Sun, TrafficCone, FileText } from 'lucide-react';
import SafetyTipsModal from '@/components/safety-tips-modal'; // Import the modal

interface AppLayoutProps {
  children: React.ReactNode;
  bikeType: 'obd' | 'non-obd';
}

export default function AppLayout({ children, bikeType }: AppLayoutProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rideCondition, setRideCondition] = useState<'Urban' | 'Highway' | 'Rainy'>('Urban'); // Default condition

  const handleLogout = () => {
    // Add actual logout logic here (e.g., clear tokens)
    console.log('Logging out...');
    router.push('/login');
  };

  const handleToggleBikeType = () => {
    const newPath = bikeType === 'obd' ? '/dashboard-non-obd' : '/dashboard-obd';
    router.push(newPath);
  };

    // Mock ride events based on condition
    const mockRideEvents = {
        Urban: [
        { type: 'harsh_braking', location: 'T. Nagar', speed: 25 },
        { type: 'near_miss', location: 'Kodambakkam High Road', speed: 30 },
        { type: 'harsh_braking', location: 'Anna Salai Traffic', speed: 15 },
        ],
        Highway: [
        { type: 'over_speeding', location: 'ECR', speed: 95 },
        { type: 'harsh_braking', location: 'OMR Toll Plaza Approach', speed: 60 },
        ],
        Rainy: [
        { type: 'near_miss', location: 'Velachery Main Road', speed: 20 },
        { type: 'harsh_braking', location: 'Guindy Kathipara Flyover', speed: 25 },
        { type: 'harsh_braking', location: 'Mount Road Underpass', speed: 18 },
        ],
    };

    // Mock location - Chennai center
    const mockLocation = { latitude: 13.0827, longitude: 80.2707 };


  return (
    <SidebarProvider defaultOpen>
       <div className="flex min-h-screen bg-background text-foreground">
         <Sidebar collapsible="icon">
             <SidebarHeader className="p-4 flex items-center justify-between">
                 <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                 <Bike className="h-6 w-6 text-primary" />
                 <span className="font-bold text-lg">MotoGuardian</span>
                 </div>
                 <SidebarTrigger className="md:hidden" />
             </SidebarHeader>
             <SidebarContent>
                 <SidebarMenu>
                 <SidebarMenuItem>
                     <SidebarMenuButton
                        href={bikeType === 'obd' ? "/dashboard-obd" : "/dashboard-non-obd"}
                        isActive={true}
                        tooltip="Dashboard"
                        >
                        <Gauge />
                        <span>Dashboard</span>
                     </SidebarMenuButton>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                     <SidebarMenuButton onClick={() => setIsModalOpen(true)} tooltip="Safety Tips">
                        <ShieldAlert />
                        <span>Safety Tips</span>
                     </SidebarMenuButton>
                 </SidebarMenuItem>
                 {/* Add more menu items as needed */}
                 <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton tooltip="Ride Conditions">
                                {rideCondition === 'Urban' && <TrafficCone />}
                                {rideCondition === 'Highway' && <MapPin />}
                                {rideCondition === 'Rainy' && <CloudRain />}
                                <span>{rideCondition}</span>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                        <DropdownMenuLabel>Ride Condition</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setRideCondition('Urban')}>
                            <TrafficCone className="mr-2 h-4 w-4" /> Urban
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRideCondition('Highway')}>
                            <MapPin className="mr-2 h-4 w-4" /> Highway
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRideCondition('Rainy')}>
                            <CloudRain className="mr-2 h-4 w-4" /> Rainy
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 </SidebarMenuItem>
                  <SidebarMenuItem>
                     <SidebarMenuButton onClick={() => alert('Exporting PDF... (Feature not implemented)')} tooltip="Export Summary">
                        <FileText />
                        <span>Export Summary</span>
                     </SidebarMenuButton>
                 </SidebarMenuItem>
                 </SidebarMenu>
             </SidebarContent>
             <SidebarFooter className="p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="justify-start gap-2 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
                            <Avatar className="h-6 w-6">
                            <AvatarImage src="https://picsum.photos/id/237/40/40" alt="User Avatar" />
                            <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span className="group-data-[collapsible=icon]:hidden">User Profile</span>
                        </Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent side="top" align="start" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleBikeType}>
                        <Bike className="mr-2 h-4 w-4" />
                        <span>Switch to {bikeType === 'obd' ? 'Non-OBD' : 'OBD'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => alert('Feature not implemented')}>
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        <span>Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
         </Sidebar>

         <SidebarInset className="flex-1 flex flex-col">
            {/* Header for mobile */}
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
                 <div className="flex items-center gap-2">
                    <Bike className="h-6 w-6 text-primary" />
                    <span className="font-bold">MotoGuardian</span>
                 </div>
                <SidebarTrigger />
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                 <AnimatePresence mode="wait">
                 <motion.div
                    key={router.pathname} // Use pathname for smooth transitions between dashboards
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                    >
                     {React.cloneElement(children as React.ReactElement, { rideCondition })}
                 </motion.div>
                 </AnimatePresence>
            </main>

         </SidebarInset>
       </div>

        <SafetyTipsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            rideEvents={mockRideEvents[rideCondition]}
            location={mockLocation}
         />
    </SidebarProvider>
  );
}

