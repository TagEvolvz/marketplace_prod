import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../../services/api';
import { AuthLayout } from './LoginPage';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';
    if (!token || !email) { setStatus('error'); return; }
    authAPI.verifyEmail(token, email)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, []);

  const content = {
    loading: {
      icon: <Loader2 className="w-10 h-10 text-green-600 animate-spin" />,
      title: 'Verifying your email…',
      sub: 'Please wait a moment.',
      cta: null,
    },
    success: {
      icon: <CheckCircle className="w-10 h-10 text-green-600" />,
      title: 'Email verified!',
      sub: 'Your account is now active. You can sign in.',
      cta: <Link to="/auth/login" className="btn-primary w-full py-3 text-sm mt-2">Sign In Now</Link>,
    },
    error: {
      icon: <XCircle className="w-10 h-10 text-red-500" />,
      title: 'Verification failed',
      sub: 'The link is invalid or has expired. Request a new one from the login page.',
      cta: <Link to="/auth/login" className="btn-secondary w-full py-3 text-sm mt-2">Back to Login</Link>,
    },
  }[status];

  return (
    <AuthLayout title="Email Verification" subtitle="Confirming your account">
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
          {content.icon}
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">{content.title}</h2>
        <p className="text-sm text-slate-500 mb-4">{content.sub}</p>
        {content.cta}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
