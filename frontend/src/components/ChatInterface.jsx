import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useTheme } from '../store/ThemeContext';
import { formatTime } from '../utils/api';
import { 
  Send, ImagePlus, Moon, Sun, LogOut, Bot, User, 
  Menu, Settings, X, Cpu, Sparkles, Command, Zap, 
  MessageSquare, Plus, Phone, Mic, MicOff, BarChart2,
  Square, Trash2 // <--- Added Icons here
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// --- Sub-Component: Background Layer ---
const BackgroundLayer = ({ theme, type }) => {
  const baseClasses = "absolute inset-0 z-0 transition-all duration-1000 pointer-events-none";
  
  if (type === 'cyber') {
    return (
      <div className={`${baseClasses} ${theme === 'dark' ? 'bg-[#050510]' : 'bg-gray-50'}`}>
        <div className={`absolute inset-0 opacity-[0.03] ${theme === 'dark' ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]' : 'bg-[linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)] bg-[size:24px_24px]'}`}></div>
        <div className={`absolute left-0 right-0 top-[-10%] h-[500px] w-[500px] rounded-full opacity-20 blur-[100px] ${theme === 'dark' ? 'bg-cyan-500/20' : 'bg-blue-400/20'}`}></div>
      </div>
    );
  }
  
  if (type === 'nebula') {
    return (
      <div className={`${baseClasses} ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'}`}>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    );
  }

  return <div className={`${baseClasses} ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`} />;
};

// --- Sub-Component: Fixed Voice Call Overlay ---
const VoiceCallOverlay = ({ isActive, onClose, sendMessage, messages }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [statusText, setStatusText] = useState("INITIALIZING...");
  
  const recognitionRef = useRef(null);
  const lastMessageRef = useRef(null);
  const synth = window.speechSynthesis;

  // 1. Setup Speech Recognition (The Ears)
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Browser not supported. Please use Chrome.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false; // Stop listening when user stops talking
    recognition.interimResults = true; // Show text while talking
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setStatusText("LISTENING...");
    };

    recognition.onresult = (event) => {
      const text = event.results[event.resultIndex][0].transcript;
      setTranscript(text);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Trigger send logic via effect to avoid stale state
    };

    recognition.onerror = (event) => {
      console.error("Speech Error:", event.error);
      setIsListening(false);
      setStatusText("ERROR - RETRYING");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      synth.cancel();
    };
  }, []);

  // 2. Auto-Start Listening
  useEffect(() => {
    if (isActive && !isSpeaking && !isListening && recognitionRef.current) {
      // Small delay prevents immediate re-trigger
      const timer = setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Ignore if already started
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, isSpeaking, isListening]);

  // 3. Send Message Logic (Triggered when listening stops)
  useEffect(() => {
    if (!isListening && transcript.trim() && isActive) {
      const textToSend = transcript;
      setTranscript(""); // Clear buffer
      setStatusText("PROCESSING...");
      
      // Send to your backend
      sendMessage(textToSend, null, "gemini").catch(err => {
        console.error("Send failed:", err);
        setStatusText("CONNECTION ERROR");
      });
    }
  }, [isListening]);

  // 4. Speak AI Response (The Mouth)
  useEffect(() => {
    if (!isActive || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    // Check if it's a NEW message from the AI
    if (lastMsg.sender === 'ai' && lastMsg !== lastMessageRef.current) {
      lastMessageRef.current = lastMsg;
      speakResponse(lastMsg.text);
    }
  }, [messages, isActive]);

  const speakResponse = (text) => {
    synth.cancel(); // Stop any current speech
    setStatusText("AI SPEAKING...");
    setIsSpeaking(true);

    // Clean text (remove Markdown like **bold** or # headings)
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // --- VOICE SELECTION FIX ---
    // Browsers load voices asynchronously. We try to find a good one.
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                           voices.find(v => v.lang === 'en-US') || 
                           voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false); // This triggers the mic to start again
      setStatusText("LISTENING...");
    };

    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setIsSpeaking(false);
    };

    synth.speak(utterance);
  };

  const handleManualClose = () => {
    synth.cancel();
    recognitionRef.current?.stop();
    onClose();
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Visualizer & Status */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className={`relative transition-all duration-500 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
           {/* Animated Glow Ring */}
          <div className={`absolute inset-0 blur-[60px] rounded-full transition-colors duration-500
            ${isSpeaking ? 'bg-emerald-500/40' : isListening ? 'bg-cyan-500/40' : 'bg-purple-500/40'}`}>
          </div>
          
          <div className="w-48 h-48 rounded-full border border-white/10 bg-black/80 flex items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Simple Animated Bars */}
            <div className="flex items-center gap-2 h-20">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-4 rounded-full transition-all duration-200 ${isSpeaking ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                  style={{ 
                    height: (isSpeaking || isListening) ? `${Math.random() * 100}%` : '10px',
                    animation: (isSpeaking || isListening) ? `pulse 0.5s infinite ${i * 0.1}s` : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 max-w-lg px-4">
          <h2 className="text-2xl font-bold tracking-widest text-white font-mono">{statusText}</h2>
          <p className="text-cyan-400/80 text-lg min-h-[20px] font-medium">
            {isSpeaking ? "" : `"${transcript}"`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-6 mt-12">
           {/* Mic Toggle */}
          <button 
            onClick={() => {
              if (isListening) recognitionRef.current.stop();
              else recognitionRef.current.start();
            }}
            className={`p-6 rounded-full border transition-all hover:scale-105
            ${!isListening ? 'bg-red-500/10 text-red-400 border-red-500/50' : 'bg-white/10 border-white/20 text-white'}`}
          >
            {isListening ? <Mic size={32} /> : <MicOff size={32} />}
          </button>
          
          {/* End Call */}
          <button onClick={handleManualClose} className="p-6 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 hover:scale-110 transition-all">
            <Phone size={32} className="rotate-[135deg]" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatInterface = () => {
  // --- ADDED stopGeneration and deleteChat to destructuring ---
  const { 
    messages, sendMessage, isLoading, 
    chatHistoryList, fetchChatList, loadChat, clearChat, chatId,
    stopGeneration = () => console.warn("stopGeneration not implemented in hook"), 
    deleteChat = (id) => console.warn("deleteChat not implemented in hook for", id)
  } = useChat();
  
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [selectedFile, setSelectedFile] = useState(null);
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [bgType, setBgType] = useState('cyber');

  const messagesEndRef = useRef(null);

  useEffect(() => { fetchChatList(); }, [fetchChatList]);
  
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;
    await sendMessage(input, selectedFile, selectedModel);
    setInput("");
    setSelectedFile(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Handler for deleting a chat from sidebar
  const handleDeleteChat = async (e, id) => {
    e.stopPropagation(); // Prevent loading the chat when deleting
    if (window.confirm("Are you sure you want to delete this chat?")) {
      await deleteChat(id);
    }
  };

  return (
    <div className={`relative flex h-screen w-full overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'dark text-gray-100' : 'text-gray-900'}`}>
      
      <BackgroundLayer theme={isDarkMode ? 'dark' : 'light'} type={bgType} />
      <VoiceCallOverlay 
        isActive={isCallActive} 
        onClose={() => setIsCallActive(false)} 
        sendMessage={sendMessage}
        messages={messages}
      />

      {/* --- LEFT SIDEBAR --- */}
      <aside 
        className={`${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'} 
        relative z-30 flex flex-col h-full transition-all duration-300 ease-in-out
        backdrop-blur-xl border-r border-white/10 flex-shrink-0
        ${isDarkMode ? 'bg-black/40' : 'bg-white/60'}`}
      >
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center border border-white/10">
            <Cpu size={20} className="text-cyan-400" />
          </div>
          <div className={`${!isSidebarOpen && 'opacity-0'} transition-opacity overflow-hidden whitespace-nowrap`}>
            <h1 className="font-bold text-lg tracking-tight">Ai ChatBot</h1>
            <span className="text-[10px] font-mono opacity-60 uppercase text-emerald-500">● Online</span>
          </div>
        </div>

        <div className="p-4">
          <button 
            onClick={clearChat}
            className={`w-full group relative flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 border
            ${isDarkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-cyan-500/50' 
              : 'bg-black/5 hover:bg-black/10 border-black/5'}`}
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className={`text-sm font-medium ${!isSidebarOpen && 'hidden'}`}>New Session</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1 py-2 custom-scrollbar">
          <div className={`px-2 text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 ${!isSidebarOpen && 'hidden'}`}>Memory Banks</div>
          {chatHistoryList.map((chat) => (
            // --- UPDATED: Wrapper div for relative positioning of Delete button ---
            <div key={chat._id} className="relative group">
                <button
                onClick={() => loadChat(chat._id)}
                className={`w-full text-left p-3 pr-9 rounded-lg flex items-center gap-3 transition-all text-sm
                ${chatId === chat._id 
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' 
                    : 'hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                <MessageSquare size={14} className={chatId === chat._id ? 'text-cyan-400' : 'opacity-50'} />
                <span className={`truncate ${!isSidebarOpen && 'hidden'}`}>{chat.title || "Untitled Sequence"}</span>
                </button>
                
                {/* --- ADDED: Delete Button in Sidebar --- */}
                {isSidebarOpen && (
                    <button
                        onClick={(e) => handleDeleteChat(e, chat._id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md 
                                   opacity-0 group-hover:opacity-100 transition-all duration-200
                                   text-gray-400 hover:text-red-400 hover:bg-red-500/10 z-10"
                        title="Delete Chat"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm px-2 py-2 w-full hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={16} /> <span className={`${!isSidebarOpen && 'hidden'}`}>Disconnect</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN INTERFACE --- */}
      <main className="flex-1 relative z-10 flex flex-col h-full min-w-0 bg-transparent">
        
        {/* Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-transparent backdrop-blur-sm z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            
            <div className={`hidden md:flex items-center gap-2 px-1 py-1 rounded-full border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white/40 border-black/5'}`}>
              <button 
                onClick={() => setSelectedModel('gemini')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedModel === 'gemini' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg' : 'opacity-60 hover:opacity-100'}`}
              >
                Gemini 2.5
              </button>
              <button 
                onClick={() => setSelectedModel('groq')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedModel === 'groq' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'opacity-60 hover:opacity-100'}`}
              >
                Groq 90B
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Phone Button */}
            <button 
              onClick={() => setIsCallActive(true)}
              className={`p-2 rounded-full transition-all duration-300 border
              ${isDarkMode 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                : 'bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-200'}`}
            >
              <Phone size={18} />
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-full transition-all duration-300 hover:rotate-45 ${isSettingsOpen ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 space-y-8 scroll-smooth custom-scrollbar relative">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-6 animate-pulse">
                <Sparkles size={40} className="text-cyan-400" />
              </div>
              <p className="text-lg font-light tracking-wide">What is in your minddd? :0</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex gap-4 md:gap-6 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border backdrop-blur-md
                  ${msg.sender === 'ai' 
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                    : 'bg-white/10 border-white/20 text-gray-500 dark:text-gray-300'}`}
                >
                  {msg.sender === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>

                <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-bold tracking-wider opacity-50 uppercase">
                      {msg.sender === 'ai' ? selectedModel : 'User'}
                    </span>
                    <span className="text-[10px] opacity-30">• {msg.timestamp ? formatTime(msg.timestamp) : 'Now'}</span>
                  </div>
                  
                  <div className={`p-4 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed backdrop-blur-md shadow-sm border transition-all
                    ${msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none border-blue-500'
                      : isDarkMode 
                        ? 'bg-white/5 border-white/10 text-gray-200 rounded-tl-none' 
                        : 'bg-white/80 border-white/40 text-gray-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.file && (
                      <div className="mb-3 overflow-hidden rounded-lg border border-white/20">
                        <div className="bg-black/20 p-2 flex items-center gap-2 text-xs">
                           <ImagePlus size={14} /> Attachment
                        </div>
                      </div>
                    )}
                    
                    {/* MARKDOWN RENDERER */}
                    <div className="markdown-body font-light">
                      <ReactMarkdown
                        children={msg.text}
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-cyan-500" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                          code: ({node, inline, className, children, ...props}) => {
                            return inline ? (
                              <code className="bg-black/30 px-1 py-0.5 rounded text-cyan-300 font-mono text-xs" {...props}>
                                {children}
                              </code>
                            ) : (
                              <div className="bg-black/30 p-3 rounded-lg my-2 overflow-x-auto border border-white/10">
                                <code className="font-mono text-xs text-gray-300 block" {...props}>
                                  {children}
                                </code>
                              </div>
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Zap size={18} className="text-cyan-400 animate-pulse" />
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-cyan-500/50 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-500/50 rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-cyan-500/50 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Zone */}
        <div className="flex-shrink-0 p-4 md:p-6 pb-6 z-20">
          <div className={`relative max-w-4xl mx-auto rounded-2xl border backdrop-blur-xl transition-all duration-300
            ${isDarkMode ? 'bg-white/5 border-white/10 focus-within:border-cyan-500/50' : 'bg-white/70 border-black/5 shadow-xl'}`}
          >
            {selectedFile && (
              <div className="absolute -top-14 left-0 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <img src={URL.createObjectURL(selectedFile)} alt="preview" className="h-8 w-8 rounded object-cover" />
                <span className="text-xs text-white opacity-80 truncate max-w-[150px]">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white/20 rounded-full text-white"><X size={14} /></button>
              </div>
            )}
            
            <form onSubmit={handleSend} className="flex items-end gap-2 p-2">
              <button type="button" onClick={() => document.getElementById('file-upload').click()} className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors">
                <ImagePlus size={20} />
              </button>
              
              <button type="button" className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors">
                 <Mic size={20} />
              </button>
              
              <input type="file" id="file-upload" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Initialize command sequence..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base py-3 max-h-32 resize-none placeholder:opacity-40"
                rows={1}
                disabled={isLoading} // Optional: disable input while loading
              />
              
              {/* --- UPDATED: Stop / Send Toggle --- */}
              {isLoading ? (
                  <button 
                    type="button"
                    onClick={stopGeneration}
                    className="p-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-500/20 transition-all duration-300 hover:scale-105 active:scale-95 group"
                    title="Stop Generating"
                  >
                    <Square size={20} fill="currentColor" className="animate-pulse" />
                  </button>
              ) : (
                  <button 
                    type="submit"
                    disabled={!input.trim() && !selectedFile}
                    className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:shadow-none transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Send size={20} />
                  </button>
              )}
            </form>
          </div>
          <div className="text-center mt-3">
             <p className="text-[10px] uppercase tracking-[0.3em] opacity-30">Made by Neel aka kryoton_98</p>
          </div>
        </div>
      </main>

      {/* --- RIGHT SETTINGS DRAWER --- */}
      <div className={`fixed inset-y-0 right-0 w-80 border-l shadow-2xl z-50 transform transition-transform duration-300 
        ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}
        ${isDarkMode 
          ? 'bg-[#0a0a0f]/90 border-white/10 text-gray-100' 
          : 'bg-white/90 border-gray-200 text-gray-900'} backdrop-blur-2xl`}>
        
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <h2 className="text-lg font-bold flex items-center gap-2"><Command size={18} /> Configuration</h2>
          <button onClick={() => setIsSettingsOpen(false)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}><X size={18} /></button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Theme Section */}
          <section>
            <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4 block">Visual Protocol</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => !isDarkMode && toggleTheme()}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300
                ${isDarkMode 
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                  : 'border-gray-200 hover:bg-gray-100 text-gray-400'}`}
              >
                <Moon size={24} />
                <span className="text-xs">Dark Mode</span>
              </button>
              <button 
                onClick={() => isDarkMode && toggleTheme()}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300
                ${!isDarkMode 
                  ? 'bg-blue-500/10 border-blue-500 text-blue-600' 
                  : 'border-white/10 hover:bg-white/5 text-gray-400'}`}
              >
                <Sun size={24} />
                <span className="text-xs">Light Mode</span>
              </button>
            </div>
          </section>

          {/* Background Section */}
          <section>
            <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4 block">Environment Matrix</label>
            <div className="space-y-3">
              {[
                { id: 'cyber', label: 'Cyber Grid', icon: '🌐' },
                { id: 'nebula', label: 'Deep Nebula', icon: '🌌' },
                { id: 'minimal', label: 'Solid State', icon: '⏹' }
              ].map((bg) => (
                <button 
                  key={bg.id}
                  onClick={() => setBgType(bg.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all
                  ${bgType === bg.id 
                    ? (isDarkMode 
                      ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_15px_rgba(0,0,0,0.2)]' 
                      : 'bg-black/5 border-blue-500 shadow-sm')
                    : (isDarkMode 
                      ? 'border-white/5 hover:bg-white/5' 
                      : 'border-gray-200 hover:bg-gray-100')}`}
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span className="opacity-70">{bg.icon}</span> {bg.label}
                  </span>
                  {bgType === bg.id && (
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] ${isDarkMode ? 'bg-cyan-400' : 'bg-blue-500'}`}></div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {(isSettingsOpen || (isSidebarOpen && window.innerWidth < 768)) && (
        <div 
          onClick={() => { setIsSettingsOpen(false); setIsSidebarOpen(false); }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
        />
      )}
    </div>
  );
};

export default ChatInterface;