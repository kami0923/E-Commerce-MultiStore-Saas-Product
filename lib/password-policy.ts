import { z } from "zod";

export const passwordSchema = z.string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Password cannot exceed 128 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/\d/, "Include a number.")
  .regex(/[^A-Za-z0-9]/, "Include a symbol.");

export function passwordRequirements(value: string) {
  return {
    length: value.length >= 12 && value.length <= 128,
    lowercase: /[a-z]/.test(value), uppercase: /[A-Z]/.test(value), number: /\d/.test(value), symbol: /[^A-Za-z0-9]/.test(value),
  };
}
