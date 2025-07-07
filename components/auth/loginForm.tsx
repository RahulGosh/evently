"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoginSchema } from "../../types/index";
import { login } from "../../lib/actions/user.action";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      login(values).then((data) => {
        setError(data?.error);
        setSuccess(data?.success);
        if (data?.success) {
          router.push("/dashboard");
        }
      });
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome back</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            disabled={isPending}
            placeholder="john.doe@example.com"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            disabled={isPending}
            placeholder="******"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {(error || urlError) && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
            {error || urlError}
          </div>
        )}

        {success && (
          <div className="text-green-500 text-sm p-2 bg-green-50 rounded-md">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isPending ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isPending ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            Google
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            GitHub
          </button>
        </div>
      </div>

      <div className="mt-4 text-center text-sm">
        <p>
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-blue-600 hover:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};