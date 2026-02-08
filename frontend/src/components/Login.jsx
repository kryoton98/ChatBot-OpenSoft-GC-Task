import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Cpu, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { login } from '../utils/api'; 
import { GoogleLogin } from '@react-oauth/google'; // <--- IMPORT
import { jwtDecode } from "jwt-decode"; // <--- IMPORT
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Background Component
  const Background = () => (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#050510]">
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
    </div>
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      const receivedToken = res.data.token || res.data.accessToken;

      if (!receivedToken) {
        setError("System Error: No secure token received.");
        setIsLoading(false);
        return; 
      }

      localStorage.setItem('token', receivedToken);
      setTimeout(() => navigate('/chat'), 800);

    } catch (err) {
      setError(err.response?.data?.error || 'Authentication Failed');
      setIsLoading(false);
    }
  };

  // --- GOOGLE SUCCESS HANDLER ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      // 1. Get the Google Token
      const googleToken = credentialResponse.credential;

      // 2. Send it to YOUR Backend
      // (Make sure your backend has this route, see Step 2 below)
      // ✅ CORRECT (Matches your controller comments)
const res = await axios.post('http://localhost:3000/api/v1/auth/google', { 
  token: googleToken 
});
      // 3. Get YOUR App's Token from the response
      const appToken = res.data.token;

      if (!appToken) throw new Error("Server verified Google but returned no token");

      // 4. Save the VALID App Token
      localStorage.setItem('token', appToken);
      
      // 5. Navigate
      navigate('/chat');
      
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Google Login Failed: Server rejected token");
    } finally {
      setIsLoading(false);
    }
};

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans text-gray-100">
      <Background />

      <div className="relative z-10 w-full max-w-md p-4">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          
          <div className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-6">
              <Cpu size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-cyan-400/60 font-mono uppercase tracking-widest">AI ChatBot [-\/-] Secure Access</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl flex items-center gap-3 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email & Password inputs... (Keep your existing inputs here) */}
               <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Identity Protocol</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-0 focus:border-cyan-500/50 focus:bg-white/10 text-white placeholder-gray-500 transition-all outline-none"
                    placeholder="kryoton@aichat.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password [chatbot123]</label>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                {isLoading ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
              </button>
            </form>

            {/* --- GOOGLE LOGIN SECTION --- */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#0a0a15] text-gray-500">Or Access Via</span></div>
              </div>

              <div className="mt-6 flex justify-center">
                 {/* Google Button - Automatically handles style and popup */}
                 <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Authentication Failed')}
                    theme="filled_black"
                    shape="pill"
                    width="100%"
                 />
              </div>
            </div>
            {/* --------------------------- */}

            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                New User? <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-bold">Create Access ID</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;