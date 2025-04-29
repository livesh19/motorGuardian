'use client';

import type { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Bike, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: NextPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    console.log('Login attempt:', data);

    // Mock Authentication Logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    // Mock user check (replace with real auth later)
    // For demo, let's assume a specific email determines OBD status
    if (data.email.includes('obd')) {
      // Simulate successful login for OBD user
      console.log('Redirecting to OBD dashboard');
      router.push('/dashboard-obd');
    } else if (data.email.includes('non-obd')) {
        // Simulate successful login for Non-OBD user
        console.log('Redirecting to Non-OBD dashboard');
        router.push('/dashboard-non-obd');
    } else {
        // Simulate failed login
        setError('Invalid email or password. Use "user-obd@example.com" or "user-non-obd@example.com".');
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center animated-gradient p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="mx-auto mb-4"
            >
             <Bike className="h-16 w-16 text-primary" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-primary">MotoGuardian</CardTitle>
            <CardDescription>Your Ride Safety Companion</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} type="email" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" {...field} type="password" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                 <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                   <Button type="submit" className="w-full bg-primary hover:bg-accent" disabled={isLoading}>
                     {isLoading ? 'Logging In...' : 'Login'}
                   </Button>
                 </motion.div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
             <Button variant="link" className="text-sm text-muted-foreground hover:text-primary" disabled={isLoading}>
              Forgot Password?
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
