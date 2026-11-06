'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signInSchema, type SignInInput } from '@/lib/validators';
import { mapAuthError } from './auth-error';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/profile';

  const [error, setError] = useState<string | null>(
    mapAuthError(searchParams.get('error'))
  );
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError(mapAuthError(result?.error) ?? 'Invalid email or password.');
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    } catch (err) {
      console.error('Sign-in error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsDemo = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: 'customer@example.com',
        password: 'customer123',
        redirect: false,
        callbackUrl,
      });
      if (!result || result.error) {
        setError('Demo account is not available. Run the database seed first.');
        return;
      }
      router.push(result.url ?? callbackUrl);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Demo store</span>
        </div>
      </div>

      <div className="space-y-2 rounded-md border bg-amber-50 p-3 text-sm" data-testid="demo-login">
        <p className="font-medium">Try the demo account</p>
        <p className="text-xs text-muted-foreground">
          customer@example.com / customer123: includes a cart and orders in every status.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={signInAsDemo}
          disabled={isLoading}
          data-testid="demo-login-btn"
        >
          Sign in as demo customer
        </Button>
      </div>
    </div>
  );
}
