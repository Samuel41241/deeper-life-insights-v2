import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { PoweredByFooter } from "@/components/brand/PoweredByFooter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen flex flex-col bg-muted">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <Logo size="lg" className="justify-center mb-6" />
            <h1 className="text-2xl font-heading font-bold mb-2">Invalid Reset Link</h1>
            <p className="text-muted-foreground mb-6">
              This link is invalid or has expired. Please request a new password reset.
            </p>
            <Link to="/login">
              <Button>Back to Login</Button>
            </Link>
          </div>
        </div>
        <PoweredByFooter />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-muted">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-bold mb-2">Password Updated</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully updated. Redirecting to login...
            </p>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </div>
        </div>
        <PoweredByFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl font-heading font-bold">Set New Password</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
          </div>
          <div className="bg-card rounded-xl border p-6 sm:p-8 shadow-[var(--shadow-elevated)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password">New Password</Label>
                <Input
                  id="reset-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-confirm">Confirm Password</Label>
                <Input
                  id="reset-confirm"
                  type="password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                <Lock className="mr-2 h-4 w-4" />
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>
          <div className="text-center mt-6">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
      <PoweredByFooter />
    </div>
  );
}
