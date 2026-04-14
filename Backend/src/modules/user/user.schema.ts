import z from 'zod';

export const updateUserSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z.object({
    password: z.string(),
});

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
