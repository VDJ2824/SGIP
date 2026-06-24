import { z } from 'zod';

const email = z.string().trim().email();
const password = z.string().min(8, 'Password must be at least 8 characters');
const otp = z.string().regex(/^\d{6}$/, 'OTP must be 6 digits');

export const registerSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email,
    password,
  }),
});

export const verifyRegisterOtpSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    email,
    otp,
  }),
});

export const loginSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    email,
    password,
  }),
});

export const verifyLoginOtpSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    email,
    otp,
  }),
});

export const authProfileSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({}).passthrough().optional(),
});

export const changePasswordSchema = z.object({
  params: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  body: z.object({
    currentPassword: password,
    newPassword: password,
  }).refine((body) => body.currentPassword !== body.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  }),
});
