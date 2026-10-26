import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .email('Enter a valid email address.')
  .max(254, 'Email address is too long.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(128, 'Password is too long.'),
});

export const otpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit verification code.'),
});

export const tutorMessageSchema = z.object({
  message: z.string().trim().min(1, 'Type a message first.').max(2000, 'Keep your message under 2,000 characters.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type TutorMessageInput = z.infer<typeof tutorMessageSchema>;
