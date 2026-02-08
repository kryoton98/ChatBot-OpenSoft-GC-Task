import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, ShieldCheck, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { register } from '../utils/api'; 

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Reusable Sci-Fi Background
  const Background = () => (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#050510]">
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
    </div>
  );

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register(name, email, password);

      // Robust check: Ensure token exists before saving
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        
        // Slight delay for visual effect
        setTimeout(() => {
           navigate('/chat');
        }, 500);
      } else {
        setError("Registration successful, but auto-login failed. Please try logging in.");
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans text-gray-100">
      <Background />

      <div className="relative z-10 w-full max-w-md p-4">
        {/* Glass Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Establish Identity</h2>
            <p className="text-sm text-cyan-400/60 font-mono uppercase tracking-widest">Chat with my Ai ChatBot</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-0 focus:border-cyan-500/50 focus:bg-white/10 text-white placeholder-gray-500 transition-all outline-none"
                    placeholder="Neel Gupta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-0 focus:border-cyan-500/50 focus:bg-white/10 text-white placeholder-gray-500 transition-all outline-none"
                    placeholder="neelgupta006@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Access Code</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-0 focus:border-cyan-500/50 focus:bg-white/10 text-white placeholder-gray-500 transition-all outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Zap size={20} className="animate-bounce" />
                      <span>INITIALIZING...</span>
                    </>
                  ) : (
                    <>
                      <span>ACTIVATE ACCOUNT</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Already initialized?{' '}
                <Link to="/" className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline underline-offset-4 transition-all">
                  Access Existing Node
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-white/20 mt-6 uppercase tracking-[0.3em]">
          Encrypted Neural Link v2.0
        </p>
      </div>
    </div>
  );
};

export default Signup;