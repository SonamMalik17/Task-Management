'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInputSchema, type LoginInput } from '@ai-task/shared';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '@/store/store';
import { setCredentials } from '@/features/auth/store/authSlice';
import { useLoginMutation } from '@/features/auth/services/authApi';
import { showToast } from '@/features/ui/uiSlice';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginInputSchema) });

  // Same UX whether the failure is 401, 429, or 500 — surface the API message.
  const onSubmit = handleSubmit(async (data) => {
    try {
      const result = await login(data).unwrap();
      dispatch(setCredentials(result));
      router.push('/dashboard');
    } catch (err: any) {
      dispatch(
        showToast({
          tone: 'error',
          message: err?.data?.error?.message ?? 'Sign-in failed',
        }),
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        id="password"
        type="password"
        label="Password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" isLoading={isLoading}>
        Sign in
      </Button>
    </form>
  );
}
