"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi, ApiError } from "@/lib/api";
import type { LoginInput, SignupInput } from "@/types/api";

export function useLogin() {
  const router = useRouter();
  return useMutation<{ success: true }, ApiError, LoginInput>({
    mutationFn: (input) =>
      authApi("/login", { method: "POST", body: input }),
    onSuccess: () => {
      router.push("/documents");
      router.refresh();
    },
  });
}

export function useSignup() {
  const router = useRouter();
  return useMutation<{ success: true }, ApiError, SignupInput>({
    mutationFn: (input) =>
      authApi("/signup", { method: "POST", body: input }),
    onSuccess: () => {
      router.push("/documents");
      router.refresh();
    },
  });
}

export function useLogout() {
  const router = useRouter();
  return useMutation<{ success: true }, ApiError, void>({
    mutationFn: () => authApi("/logout", { method: "POST" }),
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });
}
