'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterInputSchema, type RegisterInput } from '@ai-task/shared';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '@/store/store';
import { setCredentials } from '@/features/auth/store/authSlice';
import { useRegisterMutation } from '@/features/auth/services/authApi';
import { showToast } from '@/features/ui/uiSlice';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

export function RegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterInputSchema) });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const result = await registerUser(data).unwrap();
      dispatch(setCredentials(result));
      router.push('/dashboard');
    } catch (err: any) {
      dispatch(
        showToast({
          tone: 'error',
          message: err?.data?.error?.message ?? 'Sign-up failed',
        }),
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Input id="name" label="Name" error={errors.name?.message} {...register('name')} />
      <Input id="email" type="email" label="Email" error={errors.email?.message} {...register('email')} />
      <Input
        id="password"
        type="password"
        label="Password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" isLoading={isLoading}>
        Create account
      </Button>
    </form>
  );
}
