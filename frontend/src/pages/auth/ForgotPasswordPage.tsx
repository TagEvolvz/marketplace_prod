import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { AuthLayout } from './LoginPage';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch { toast.error('Failed to send reset email'); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <AuthLayout title="Check your inbox" subtitle="Reset link sent">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          If an account exists for <span className="font-semibold text-slate-700">{email}</span>, you'll receive a reset link shortly.
        </p>
        <Link to="/auth/login" className="btn-primary w-full py-3 text-sm">Back to Login</Link>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Forgot password?" subtitle="We'll send you a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="you@example.com" className="input pl-10" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Reset Link'}
        </button>
      </form>
      <Link to="/auth/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-green-600 mt-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
