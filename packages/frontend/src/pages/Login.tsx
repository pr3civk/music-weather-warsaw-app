import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const m = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: () => nav("/dashboard"),
  });

  function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    m.mutate();
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access your MusicWeather Warsaw dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {m.error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2">
                {m.error.message}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={m.isPending} className="w-full">
              {m.isPending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
