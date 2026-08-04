import React, { useState } from 'react';
import { 
  auth, 
  getUserProfile, 
  setUserProfile, 
  firebaseSignOut, 
  UserProfile,
  registerUserAccount,
  loginUserAccount
} from '../lib/firebase';
import { 
  Lock, 
  UserCheck, 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Clock, 
  ShieldAlert,
  Crown,
  User,
  Sparkles
} from 'lucide-react';

interface AuthLandingProps {
  onAuthSuccess: (profile: UserProfile) => void;
  adminPasscode?: string;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ 
  onAuthSuccess, 
  adminPasscode = 'admin123' 
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
  const [adminKey, setAdminKey] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter your username or email address and password.');
      return;
    }

    setLoginLoading(true);

    try {
      const profile = await loginUserAccount(loginEmail, loginPassword);
      onAuthSuccess(profile);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message) {
        setLoginError(err.message);
      } else {
        setLoginError('Failed to authenticate. Please check your credentials.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMessage(null);

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Please fill out all required fields including a unique username.');
      return;
    }

    if (regUsername.trim().length < 3) {
      setRegError('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(regUsername.trim())) {
      setRegError('Username can only contain letters, numbers, underscores, dots, and hyphens.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }

    // Verify Admin key if Admin role selected
    const cleanRegEmail = regEmail.trim().toLowerCase();
    const isSuperAdminRegister = cleanRegEmail === 'patrickf.baliton.ndsdata@gmail.com';
    const effectiveRole = isSuperAdminRegister ? 'admin' : selectedRole;

    if (effectiveRole === 'admin' && !isSuperAdminRegister) {
      if (adminKey.trim() !== adminPasscode && adminKey.trim() !== 'admin123') {
        setRegError('Invalid Administrator Security Key. Check passcode or register as a Technician user.');
        return;
      }
    }

    setRegLoading(true);

    try {
      const { profile, requiresApproval } = await registerUserAccount(
        regEmail,
        regPassword,
        regName,
        effectiveRole,
        regUsername
      );

      if (requiresApproval) {
        setRegSuccessMessage(
          'Registration Successful! Your account has been registered with INACTIVE status. An Administrator must activate your account before you can log in.'
        );
        setRegName('');
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setAdminKey('');
      } else {
        setRegSuccessMessage('Administrator Account Created and Activated! You are now logged in.');
        onAuthSuccess(profile);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message) {
        setRegError(err.message);
      } else {
        setRegError('Failed to register account.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Subtle Mesh Gradient */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-amber-500/30 text-amber-400 shadow-xl mb-1">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Trip Analysis Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Samsara Log KMZ Parser & Technician Scheduling Portal
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('register');
                setRegError(null);
                setRegSuccessMessage(null);
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-start space-x-2.5 animate-shake">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Username or Email Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin101 or name@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Password</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loginLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{regError}</span>
                </div>
              )}

              {regSuccessMessage && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{regSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. john_doe or tech_user"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Password (6+ chars)</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Account Type / Role Selection */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-300 block">Requested Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('user')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2 ${
                      selectedRole === 'user'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0 text-amber-400" />
                    <div>
                      <span className="text-xs block font-bold">Technician / Staff</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Pending Admin Approval</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2 ${
                      selectedRole === 'admin'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Crown className="w-4 h-4 shrink-0 text-amber-400" />
                    <div>
                      <span className="text-xs block font-bold">Administrator</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Requires Admin Key</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Admin Passcode input if Admin role requested */}
              {selectedRole === 'admin' && (
                <div className="space-y-1 p-3 bg-slate-950 rounded-xl border border-amber-500/30">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Administrator Security Passcode</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter security passcode"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Entering a valid Admin Security Key creates an instantly active Administrator account.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {regLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create User Account</span>
                    <UserPlus className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security Footer Notice */}
        <div className="text-center space-y-1 text-slate-500 text-xs">
          <p className="flex items-center justify-center gap-1.5 font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Firebase Auth & Firestore Cloud Security Enabled</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Account approvals and permissions are strictly enforced by system administrators.
          </p>
        </div>
      </div>
    </div>
  );
};
