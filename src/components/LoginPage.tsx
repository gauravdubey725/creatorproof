import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  X, 
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess: (email: string, name?: string, username?: string) => void;
}

// Strict RFC-compliant email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, signup, demoLogin } = useAuth();

  // Mode: 'login' or 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Form fields
  const [loginIdentifier, setLoginIdentifier] = useState('alex.vance@creatorproof.io');
  const [loginPassword, setLoginPassword] = useState('Password123!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // General auth toast
  const [authToast, setAuthToast] = useState<string | null>(null);

  // Validation errors
  const [loginErrors, setLoginErrors] = useState<{ identifier?: string; password?: string }>({});
  const [signupErrors, setSignupErrors] = useState<{
    username?: string;
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Validate Login Form
  const validateLogin = () => {
    const errors: { identifier?: string; password?: string } = {};
    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      errors.identifier = 'Please enter your email address or username.';
      setAuthToast('Please enter your email address or username.');
    } else if (cleanId.includes('@') && !EMAIL_REGEX.test(cleanId)) {
      errors.identifier = 'Please enter a valid email address (e.g. user@domain.com).';
      setAuthToast('Invalid email address. Valid format: user@domain.com');
    }

    if (!loginPassword) {
      errors.password = 'Please enter your account password.';
      if (!errors.identifier) setAuthToast('Please enter your account password.');
    } else if (loginPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
      if (!errors.identifier) setAuthToast('Password must be at least 6 characters.');
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Sign Up Form
  const validateSignup = () => {
    const errors: {
      username?: string;
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!signupUsername.trim()) {
      errors.username = 'Username is required.';
      setAuthToast('Username is required.');
    } else if (signupUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
      setAuthToast('Username must be at least 3 characters.');
    }

    if (!signupFullName.trim()) {
      errors.fullName = 'Full Name or pseudonym is required.';
      if (!errors.username) setAuthToast('Full Name or pseudonym is required.');
    }

    if (!signupEmail.trim()) {
      errors.email = 'Email address is required.';
      if (!errors.username && !errors.fullName) setAuthToast('Email address is required.');
    } else if (!EMAIL_REGEX.test(signupEmail.trim())) {
      errors.email = 'Please enter a valid email address (e.g. user@domain.com).';
      setAuthToast('Invalid email address format. Valid format: user@domain.com');
    }

    if (!signupPassword) {
      errors.password = 'Password is required.';
      if (!errors.email) setAuthToast('Password is required.');
    } else if (signupPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
      setAuthToast('Password must be at least 6 characters.');
    }

    if (!signupConfirmPassword) {
      errors.confirmPassword = 'Confirm your password.';
      if (!errors.password) setAuthToast('Please confirm your password.');
    } else if (signupPassword !== signupConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      setAuthToast('Passwords do not match.');
    }

    if (!agreeTerms) {
      errors.terms = 'You must accept the terms of service and blockchain protocol.';
      if (!errors.confirmPassword && !errors.password && !errors.email) {
        setAuthToast('You must accept the terms of service.');
      }
    }

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthToast(null);
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const result = await login(loginIdentifier, loginPassword);
      setIsLoading(false);
      if (!result.success) {
        const errMsg = result.error || 'Invalid credentials or wrong password.';
        setAuthToast(errMsg);
        setLoginErrors(prev => ({ ...prev, password: 'Wrong password or account not found.' }));
      } else {
        onLoginSuccess(loginIdentifier);
      }
    } catch (err: any) {
      setIsLoading(false);
      setAuthToast(err.message || 'Login failed.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthToast(null);
    if (!validateSignup()) return;

    setIsLoading(true);
    try {
      const result = await signup(signupEmail, signupPassword, signupFullName, signupUsername);
      setIsLoading(false);
      if (!result.success) {
        const errMsg = result.error || 'Failed to create account.';
        setAuthToast(errMsg);
        setSignupErrors(prev => ({ ...prev, email: errMsg }));
      } else {
        onLoginSuccess(signupEmail, signupFullName, signupUsername);
      }
    } catch (err: any) {
      setIsLoading(false);
      setAuthToast(err.message || 'Registration failed.');
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setLoginErrors({});
    setAuthToast(null);
    try {
      await demoLogin();
      setIsLoading(false);
      onLoginSuccess('alex.vance@creatorproof.io', 'Alex Vance', 'alexvance');
    } catch (err: any) {
      setIsLoading(false);
      setAuthToast(err.message || 'Demo login failed.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setForgotError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotEmailSent(true);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-x-hidden">
      {/* Background Ambience Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 my-auto py-6">
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-xl shadow-violet-600/30 border border-violet-400/40 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
            Creator<span className="text-violet-400">Proof</span>
          </h1>
          <p className="text-xs font-semibold text-violet-300/90 mt-1 uppercase tracking-wider">
            Blockchain Content Protection System
          </p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            Cryptographic SHA-256 fingerprinting & immutable ledger provenance.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Card Title & Demo Button */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">
                {authMode === 'signup' ? 'Create Creator Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {authMode === 'signup' 
                  ? 'Register your cryptographic profile & keys' 
                  : 'Access your content certificates & ledger'}
              </p>
            </div>
            <button
              type="button"
              id="demo-quick-login-btn"
              onClick={handleDemoLogin}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-violet-300 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 rounded-lg transition cursor-pointer"
              title="Skip typing and login instantly with demo profile"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Demo Login</span>
            </button>
          </div>

          {/* Authentication Alert / Error Toast */}
          {authToast && (
            <div
              id="auth-error-toast"
              className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs font-semibold text-rose-300 flex items-center justify-between gap-2 animate-fadeIn"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setAuthToast(null)}
                className="text-rose-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              {/* Email / Username field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="login-email-input"
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      if (loginErrors.identifier) setLoginErrors(prev => ({ ...prev, identifier: undefined }));
                    }}
                    placeholder="creator@proof.io or alexvance"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      loginErrors.identifier 
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-slate-700/80 focus:ring-violet-500/40 focus:border-violet-500'
                    }`}
                  />
                </div>
                {loginErrors.identifier && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{loginErrors.identifier}</span>
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => {
                      setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                      setForgotEmailSent(false);
                      setShowForgotPasswordModal(true);
                    }}
                    className="text-[11px] text-violet-400 hover:text-violet-300 cursor-pointer transition hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="login-password-input"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginErrors.password) setLoginErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      loginErrors.password 
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-slate-700/80 focus:ring-violet-500/40 focus:border-violet-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                    title={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{loginErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-button"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to CreatorProof</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= SIGN UP FORM ================= */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5" noValidate>
              {/* Username field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="signup-username-input"
                    value={signupUsername}
                    onChange={(e) => {
                      setSignupUsername(e.target.value);
                      if (signupErrors.username) setSignupErrors(prev => ({ ...prev, username: undefined }));
                    }}
                    placeholder="e.g. alexvance"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      signupErrors.username 
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-slate-700/80 focus:ring-violet-500/40 focus:border-violet-500'
                    }`}
                  />
                </div>
                {signupErrors.username && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{signupErrors.username}</span>
                  </p>
                )}
              </div>

              {/* Full Name field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name / Pseudonym
                </label>
                <input
                  type="text"
                  id="signup-fullname-input"
                  value={signupFullName}
                  onChange={(e) => {
                    setSignupFullName(e.target.value);
                    if (signupErrors.fullName) setSignupErrors(prev => ({ ...prev, fullName: undefined }));
                  }}
                  placeholder="e.g. Alex Vance"
                  className={`w-full px-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                    signupErrors.fullName 
                      ? 'border-rose-500 focus:ring-rose-500/40' 
                      : 'border-slate-700/80 focus:ring-violet-500/40 focus:border-violet-500'
                  }`}
                />
                {signupErrors.fullName && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{signupErrors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Email field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="signup-email-input"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      if (signupErrors.email) setSignupErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="alex@creatorproof.io"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      signupErrors.email 
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-slate-700/80 focus:ring-violet-500/40 focus:border-violet-500'
                    }`}
                  />
                </div>
                {signupErrors.email && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{signupErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    id="signup-password-input"
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      if (signupErrors.password) setSignupErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    placeholder="At least 6 characters"
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      signupErrors.password 
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-slate-700/80 focus:ring-violet-500/40 focus:border-violet-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {signupErrors.password && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{signupErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    id="signup-confirm-password-input"
                    value={signupConfirmPassword}
                    onChange={(e) => {
                      setSignupConfirmPassword(e.target.value);
                      if (signupErrors.confirmPassword) setSignupErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Repeat your password"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      signupErrors.confirmPassword 
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-slate-700/80 focus:ring-violet-500/40 focus:border-violet-500'
                    }`}
                  />
                </div>
                {signupErrors.confirmPassword && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{signupErrors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    id="signup-terms-checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (signupErrors.terms) setSignupErrors(prev => ({ ...prev, terms: undefined }));
                    }}
                    className="mt-0.5 w-4 h-4 text-violet-600 rounded bg-slate-950 border-slate-700 focus:ring-violet-500 accent-violet-600 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 leading-relaxed">
                    I agree to the <span className="text-violet-400 hover:underline">Terms of Service</span>, cryptographic ledger protocol, and zero-knowledge hashing policy.
                  </span>
                </label>
                {signupErrors.terms && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{signupErrors.terms}</span>
                  </p>
                )}
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                id="create-account-submit-button"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Creator Account...</span>
                  </div>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle between Login and Sign Up */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              {authMode === 'signup' ? 'Already have an account?' : "Don't have a creator account yet?"}{' '}
              <button
                type="button"
                id="toggle-auth-mode-btn"
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                  setLoginErrors({});
                  setSignupErrors({});
                }}
                className="font-semibold text-violet-400 hover:text-violet-300 ml-1 underline underline-offset-2 cursor-pointer"
              >
                {authMode === 'signup' ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        {/* Feature Highlights beneath card */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center justify-center text-emerald-400 mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] font-semibold text-slate-300">SHA-256</p>
            <p className="text-[10px] text-slate-400">Zero-loss hash</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center justify-center text-violet-400 mb-1">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] font-semibold text-slate-300">Immutable</p>
            <p className="text-[10px] text-slate-400">Polygon ledger</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center justify-center text-blue-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] font-semibold text-slate-300">Tamper Proof</p>
            <p className="text-[10px] text-slate-400">Instant check</p>
          </div>
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotPasswordModal && (
        <div 
          id="forgot-password-modal"
          onClick={() => setShowForgotPasswordModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleIn text-white"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Reset Your Password</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your registered creator email to receive a recovery link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotEmailSent ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Password Reset Email Sent</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  We've dispatched recovery instructions and cryptographic verification steps to <strong className="text-violet-300">{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="mt-4 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-4" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="creator@proof.io"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
                    />
                  </div>
                  {forgotError && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{forgotError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
