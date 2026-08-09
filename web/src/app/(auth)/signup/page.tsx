"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useSignup } from "@/lib/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signup = useSignup();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    signup.mutate({ email, password });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Sign up</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          {signup.isError && (
            <p className="text-sm text-red-600">
              {signup.error instanceof ApiError
                ? signup.error.message
                : "Something went wrong."}
            </p>
          )}
          <Button type="submit" disabled={signup.isPending}>
            {signup.isPending ? "Signing up..." : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
