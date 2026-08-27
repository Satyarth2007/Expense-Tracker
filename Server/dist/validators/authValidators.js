import { z } from 'zod';
export const sendOtpSchema = z.object({
    email: z.string().email(),
});
export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must bne atleast 8 characters"),
    fullName: z.string().min(1).max(150),
    otp: z.string().length(6, "OTP must be 6 digits"),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
//# sourceMappingURL=authValidators.js.map