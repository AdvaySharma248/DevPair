'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMentorshipStore, UserRole } from '@/store/mentorship-store';
import { Code2, Loader2 } from 'lucide-react';
import {
  getFirebaseAuthErrorMessage,
  loginWithFirebase,
  signupWithFirebase,
} from '@/lib/firebase-auth';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setUser = useMentorshipStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const authenticatedUser = isLogin
        ? await loginWithFirebase(email, password)
        : await signupWithFirebase({ email, password, name, role });

      setUser(authenticatedUser);
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-xl">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-semibold text-foreground">DevPair</span>
          </div>
          <CardTitle className="text-lg text-foreground">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {isLogin 
              ? 'Sign in to continue your mentorship journey' 
              : 'Get started with your free account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-foreground">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="h-9 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-9 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 text-sm"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-xs text-foreground">I want to</Label>
                <RadioGroup 
                  value={role} 
                  onValueChange={(value) => setRole(value as UserRole)}
                  className="flex gap-3"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem 
                      value="student" 
                      id="student" 
                      className="border-primary text-primary" 
                    />
                    <Label htmlFor="student" className="text-sm text-foreground cursor-pointer">Learn</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem 
                      value="mentor" 
                      id="mentor" 
                      className="border-primary text-primary" 
                    />
                    <Label htmlFor="mentor" className="text-sm text-foreground cursor-pointer">Mentor</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded border border-destructive/20">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="ml-1.5 text-primary hover:underline font-medium"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
