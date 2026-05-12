import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { AuthLayout } from './LoginPage';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, email, password });
      setDone(true);
    } catch { toast.error('Reset failed. The link may have expired.'); }
    finally { setLoading(false); }
  };

  if (done) return (
    <AuthLayout title="Password reset" subtitle="Your password has been updated">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-slate-500 text-sm mb-6">You can now sign in with your new password.</p>
        <Link to="/auth/login" className="btn-primary w-full py-3 text-sm">Go to Login</Link>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} placeholder="At least 8 characters" className="input pl-10 pr-10" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</> : 'Reset Password'}
        </button>
      </form>
      <Link to="/auth/login" className="flex justify-center text-sm text-slate-500 hover:text-green-600 mt-6 transition-colors">
        Back to Login
      </Link>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
