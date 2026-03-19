import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { PoweredByFooter } from "@/components/brand/PoweredByFooter";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      // Clear any stale caches before login
      queryClient.clear();
      console.log("[RBAC] Login attempt for:", email.trim());
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      console.log("[RBAC] Login successful — navigating to dashboard");
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Enter your email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl font-heading font-bold">Admin Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to manage church attendance</p>
          </div>

          <div className="bg-card rounded-xl border p-6 sm:p-8 shadow-[var(--shadow-elevated)]">
            {forgotMode ? (
              resetSent ? (
                <div className="text-center py-4">
                  <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-lg font-heading font-bold mb-2">Check Your Email</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    If an account exists for <span className="font-medium text-foreground">{email}</span>,
                    you will receive a password reset link.
                  </p>
                  <Button variant="outline" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                    Back to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-center mb-2">
                    <h2 className="text-lg font-heading font-bold">Forgot Password</h2>
                    <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <Input id="forgot-email" type="email" placeholder="admin@dlbc.org" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <button type="button" onClick={() => setForgotMode(false)} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors">
                    ← Back to Sign In
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input id="login-email" type="email" placeholder="admin@dlbc.org" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Signing in..." : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>}
                </Button>
              </form>
            )}
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">← Back to Home</Link>
          </div>
        </div>
      </div>
      <PoweredByFooter />
    </div>
  );
}
