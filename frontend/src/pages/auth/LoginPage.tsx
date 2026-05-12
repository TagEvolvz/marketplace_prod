import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import logo from '../../logo.png';
import { useAppDispatch } from '../../store';
import { loginUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

const AuthLayout: React.FC<{ children: React.ReactNode; title: string; subtitle: string }> = ({ children, title, subtitle }) => (
  <div className="auth-surface flex min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_30rem),linear-gradient(180deg,#ffffff,#f7f8fb)] text-slate-900">
    <div className="relative hidden w-5/12 overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.22),transparent_26rem)]" />
      <div className="relative text-center">
        <Link to="/" className="inline-flex items-center gap-3 mb-8">
          <img src={logo} alt="FLOW" className="w-12 h-12 object-contain rounded-xl" />
          <span className="text-2xl font-extrabold text-white">FLOW</span>
        </Link>
        <h2 className="mb-3 text-4xl font-extrabold leading-tight text-white">Secure account access</h2>
        <p className="mx-auto mb-6 max-w-xs text-base leading-7 text-slate-300">Continue shopping, manage orders, and checkout faster.</p>
      </div>
    </div>

    <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-brand-primary transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <img src={logo} alt="FLOW" className="w-8 h-8 object-contain" />
            <span className="font-bold text-slate-900">FLOW</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = await dispatch(loginUser(data)).unwrap();
      toast.success('Welcome back!');
      // If the logged-in user is an admin, redirect to the admin area root.
      if (payload?.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Invalid email or password');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input {...register('email')} type="email" autoComplete="email" placeholder="you@example.com"
              className={`input pl-10 ${errors.email ? 'input-error' : ''}`} />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Password</label>
            <Link to="/auth/forgot-password" className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input {...register('password')} type={showPw ? 'text' : 'password'} autoComplete="current-password"
              placeholder="Your password" className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 mt-2 text-sm">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        No account yet?{' '}
        <Link to="/auth/register" className="text-brand-primary hover:text-brand-primary/80 font-semibold">Create one</Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
export { AuthLayout };
