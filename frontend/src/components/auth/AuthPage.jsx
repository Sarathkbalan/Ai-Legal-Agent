import React, { useState } from 'react';
import {
  Scale,
  Shield,
  User,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  FileText
} from 'lucide-react';
import { authService } from '../../services/authService';
import { Card, CardHeader, CardBody } from '../chakra/Card';
import { Badge } from '../chakra/Badge';
import { Input } from '../chakra/Input';
import { Button } from '../chakra/Button';
import { Alert, AlertIcon, AlertDescription } from '../chakra/Alert';

export default function AuthPage({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const user = await authService.login(loginEmail, loginPassword);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(err.error?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) {
      setErrorMsg('Please complete all registration fields.');
      return;
    }
    if (registerPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const user = await authService.register(registerName, registerEmail, registerPassword);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(err.error?.message || err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdmin = () => {
    setLoginEmail('admin123@gmail.com');
    setLoginPassword('admin123');
  };

  const fillDemoUser = () => {
    setLoginEmail('user@lawintel.uk');
    setLoginPassword('User123!');
  };

  return (
    <div className="min-h-screen bg-[#0F1319] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden font-sans text-left">
      
      {/* Background Subtle Gradient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#319795]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#805AD5]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center max-w-md w-full mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#319795] via-[#2C7A7B] to-[#805AD5] text-white shadow-xl shadow-[#319795]/20 mb-4 border border-[#4FD1C5]/30">
          <Scale className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          Law<span className="text-[#4FD1C5]">Intel</span>
          <Badge colorScheme="teal" variant="solid" className="text-xs py-0.5 px-2">
            UK Legal AI
          </Badge>
        </h1>
        <p className="text-xs sm:text-sm text-[#A0AEC0] mt-2">
          UK Legal Research & Document Intelligence Gateway
        </p>
      </div>

      {/* Main Authentication Card */}
      <Card variant="outline" className="max-w-md w-full border-[#2D3748] bg-[#1A202C]/95 backdrop-blur-md shadow-2xl relative z-10">
        
        {/* Tab Headers: Sign In vs Create Account */}
        <div className="grid grid-cols-2 border-b border-[#2D3748] bg-[#171923]">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            className={`py-3.5 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'border-[#4FD1C5] text-white bg-[#1A202C]'
                : 'border-transparent text-[#718096] hover:text-[#CBD5E0]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            className={`py-3.5 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'border-[#4FD1C5] text-white bg-[#1A202C]'
                : 'border-transparent text-[#718096] hover:text-[#CBD5E0]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        <CardBody className="p-6 sm:p-7 space-y-5">

          {/* Error Alert Banner */}
          {errorMsg && (
            <Alert status="error" variant="subtle" className="text-xs">
              <AlertIcon status="error" />
              <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* TAB 1: SINGLE LOGIN PAGE (FOR BOTH ADMIN AND USER) */}
          {activeTab === 'login' && (
            <div className="space-y-5">

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#4FD1C5]" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. admin123@gmail.com or your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#4FD1C5]" />
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  size="md"
                  colorScheme="teal"
                  variant="solid"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full text-xs font-bold py-2.5 shadow-lg shadow-[#319795]/20"
                >
                  Sign In
                </Button>
              </form>

              {/* Quick Fill Credential Shortcuts */}
              <div className="pt-3 border-t border-[#2D3748] space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#718096] tracking-wider block text-center">
                  Quick Credential Fill
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={fillAdmin}
                    className="p-2 rounded-lg bg-[#171923] hover:bg-[#805AD5]/20 border border-[#2D3748] hover:border-[#805AD5]/60 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#B794F4]">Admin ID</span>
                      <Shield className="w-3 h-3 text-[#B794F4]" />
                    </div>
                    <div className="text-[10px] text-[#A0AEC0] truncate">admin123@gmail.com</div>
                    <div className="text-[9px] text-[#718096] font-mono mt-0.5">pass: admin123</div>
                  </button>

                  <button
                    type="button"
                    onClick={fillDemoUser}
                    className="p-2 rounded-lg bg-[#171923] hover:bg-[#319795]/20 border border-[#2D3748] hover:border-[#319795]/60 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#4FD1C5]">User ID</span>
                      <User className="w-3 h-3 text-[#4FD1C5]" />
                    </div>
                    <div className="text-[10px] text-[#A0AEC0] truncate">user@lawintel.uk</div>
                    <div className="text-[9px] text-[#718096] font-mono mt-0.5">pass: User123!</div>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CREATE ACCOUNT (REGISTER) */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              <div className="bg-[#171923] border border-[#2D3748] rounded-xl p-3 text-xs text-[#A0AEC0] space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#4FD1C5]" />
                  Multiple Researcher Accounts Supported
                </div>
                <p className="text-[11px]">
                  Registering creates your researcher profile and navigates you <strong>directly to the Legal Research Chat Interface</strong>.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#4FD1C5]" />
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#4FD1C5]" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="sarah@lawfirm.co.uk"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#4FD1C5]" />
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  size="md"
                  colorScheme="teal"
                  variant="solid"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full text-xs font-bold py-2.5 shadow-lg shadow-[#319795]/20"
                >
                  Register & Navigate to Chat Interface
                </Button>
              </form>

              <div className="pt-2 text-center text-[11px] text-[#718096]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                  className="text-[#4FD1C5] hover:underline font-medium"
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}

        </CardBody>

      </Card>

      {/* Footer Info */}
      <div className="mt-8 text-center text-[11px] text-[#718096] relative z-10 space-y-1">
        <p>LawIntel UK Legal Research AI Agent • Strict Common Law Compliance Gateway</p>
        <p className="font-mono text-[10px]">BAAI/bge-m3 • Qdrant Vector Engine • Groq openai/gpt-oss-120b</p>
      </div>

    </div>
  );
}
