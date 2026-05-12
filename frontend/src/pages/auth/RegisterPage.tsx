import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { AuthLayout } from './LoginPage';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  email:     z.string().email('Invalid email'),
  password:  z.string().min(8, 'Min 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Needs upper, lower & number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const password = watch('password', '');

  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase',     ok: /[A-Z]/.test(password) },
    { label: 'Lowercase',     ok: /[a-z]/.test(password) },
    { label: 'Number',        ok: /\d/.test(password) },
  ];

  const onSubmit = async (data: FormData) => {
    try {
      await authAPI.register({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password });
      setSuccess(true);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    }
  };

  if (success) return (
    <AuthLayout title="Check your email" subtitle="Verification link sent">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          We sent a verification link to your email.<br />Click it to activate your account.
        </p>
        <Link to="/auth/login" className="btn-primary w-full py-3 text-sm">Go to Login</Link>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Create your account" subtitle="Start shopping and selling today">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input {...register('firstName')} placeholder="John" className={`input pl-10 ${errors.firstName ? 'input-error' : ''}`} />
            </div>
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="label">Last name</label>
            <input {...register('lastName')} placeholder="Doe" className={`input ${errors.lastName ? 'input-error' : ''}`} />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input {...register('email')} type="email" placeholder="you@example.com" className={`input pl-10 ${errors.email ? 'input-error' : ''}`} />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Create a strong password"
              className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {checks.map(({ label, ok }) => (
                <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ok ? 'bg-green-500' : 'bg-slate-300'}`} /> {label}
                </div>
              ))}
            </div>
          )}
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="label">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input {...register('confirmPassword')} type={showPw ? 'text' : 'password'} placeholder="Repeat your password"
              className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`} />
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 mt-2 text-sm">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
        </button>

        <p className="text-xs text-slate-400 text-center">
          By signing up you agree to our{' '}
          <Link to="/terms" className="underline hover:text-green-600">Terms</Link> and{' '}
          <Link to="/privacy" className="underline hover:text-green-600">Privacy Policy</Link>
        </p>
      </form>

      <p className="text-center text-slate-500 text-sm mt-5">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-green-600 hover:text-green-700 font-semibold">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;
