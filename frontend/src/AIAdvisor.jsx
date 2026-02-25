import React, { useState, useEffect, useRef } from 'react';
import { Send, Activity, ShieldCheck, Sparkles, ChevronDown, Check, Image as ImageIcon, Maximize2, Terminal, Info } from 'lucide-react';
import API from './api';

const AIAdvisor = ({ user, token, forceDarkMode = false }) => {
    const username = user?.username || user?.name || 'Agent';
    const [messages, setMessages] = useState([
        { role: 'assistant', text: `Forensic handshake complete, ${username}. Quantum-Class Financial Intelligence is now online through the Groq Forensic Core (Llama 3.3 70B). How shall we optimize your security perimeter today?` }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [models, setModels] = useState([]);
    const [currentModel, setCurrentModel] = useState(null);
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [loadingModels, setLoadingModels] = useState(true);
    const messagesEndRef = useRef(null);
    const modelPickerRef = useRef(null);

    // V0 Aesthetic Features
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await API.get('/advisor/models', { headers: { Authorization: token } });
                setModels(res.data);
                // Default to GPT-OSS 120B
                setCurrentModel(res.data.find(m => m.id === 'openai/gpt-5') || res.data[0]);
            } catch (err) {
                console.error("Failed to load neural models:", err);
            } finally {
                setLoadingModels(false);
            }
        };
        fetchModels();
    }, [token]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = inputText.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputText('');
        setIsTyping(true);

        try {
            const res = await API.post('/advisor/chat',
                {
                    message: userMsg,
                    user_id: user.id,
                    model_id: currentModel?.id || 'openai/gpt-5'
                },
                { headers: { Authorization: token } }
            );

            setMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
        } catch (err) {
            console.error("Neural Sync Error:", err);
            const errorMsg = err.response?.data?.detail || "The AI Matrix is currently optimizing forensic cores. Synchronize your .env and try again.";
            setMessages(prev => [...prev, { role: 'assistant', text: `ERROR: ${errorMsg}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`relative transition-all duration-500 ease-in-out ${isExpanded ? 'fixed inset-4 z-50 h-auto' : 'h-[650px] w-full'} flex flex-col rounded-3xl overflow-hidden glass-morphism border ${forceDarkMode ? 'bg-slate-950/40 border-slate-700/50' : 'bg-white/40 border-slate-200/50 dark:bg-slate-950/40 dark:border-slate-800/50 shadow-2xl backdrop-blur-xl'}`}>

            {/* Header: V0 Premium Design */}
            <div className="bg-slate-900/90 backdrop-blur-md text-white p-5 flex justify-between items-center border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/30">
                            <Terminal size={22} className="animate-pulse" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-lg shadow-emerald-500/50" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">AI Forensic Matrix</h3>
                        <div className="flex items-center gap-2">
                            <span className="flex w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-black font-mono">Quantum Intelligence Active</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Model Picker */}
                    <div className="relative" ref={modelPickerRef}>
                        <button
                            onClick={() => setShowModelPicker(!showModelPicker)}
                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 transition-all text-xs font-bold ring-offset-2 focus:ring-2 focus:ring-emerald-500/50"
                        >
                            {loadingModels ? (
                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="text-lg grayscale-0">{currentModel?.icon || '✦'}</span>
                                    <span className="hidden md:inline text-slate-200 uppercase tracking-wider">{currentModel?.name || 'Loading Architecture...'}</span>
                                </>
                            )}
                            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${showModelPicker ? 'rotate-180' : ''}`} />
                        </button>

                        {showModelPicker && (
                            <div className="absolute top-full right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in-up">
                                <div className="p-3 border-b border-white/5 text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] px-5">Available Intelligence Cores</div>
                                {models.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            setCurrentModel(m);
                                            setShowModelPicker(false);
                                        }}
                                        className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-all group ${currentModel?.id === m.id ? 'bg-emerald-500/5 text-emerald-400' : 'text-slate-400'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`text-2xl transition-transform group-hover:scale-110 ${currentModel?.id === m.id ? 'grayscale-0' : 'grayscale'}`}>{m.icon}</span>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold tracking-tight">{m.name}</span>
                                                <span className="text-[9px] opacity-40 font-mono uppercase tracking-widest">{m.provider}</span>
                                            </div>
                                        </div>
                                        {currentModel?.id === m.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <Maximize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Chat Viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-[#f8fafc] dark:bg-[#020617]/40 ring-inset ring-1 ring-black/5">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in-fade`}>
                        <div className={`group relative max-w-[85%] p-4 rounded-[2rem] text-[15px] leading-relaxed shadow-sm transition-all hover:shadow-md ${m.role === 'user'
                            ? 'bg-slate-900 dark:bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-900/90 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none'
                            }`}>
                            {m.text}
                            <div className={`absolute -bottom-5 text-[9px] font-mono font-bold tracking-widest text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase ${m.role === 'user' ? 'right-2' : 'left-2'}`}>
                                {m.role === 'user' ? 'Transmission Sent' : `Intelligence: ${currentModel?.name || 'Core'}`}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-900/90 dark:border-white/5 border border-slate-200 p-4 rounded-[2rem] rounded-tl-none flex gap-1.5 items-center h-12 w-20 justify-center shadow-sm backdrop-blur-md">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer: Multimodal V0 Design */}
            <div className="p-5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 shrink-0 backdrop-blur-md">
                <form onSubmit={handleSend} className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                            type="button"
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all"
                            title="Attach Forensic Image (Multimodal)"
                        >
                            <ImageIcon size={20} />
                        </button>
                    </div>

                    <input
                        type="text"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Analyze system risk, query transaction IDs, or request forensic reports..."
                        className="w-full bg-slate-100 dark:bg-white/[0.03] border-2 border-transparent focus:border-emerald-500/30 rounded-2xl pl-14 pr-16 py-4 text-sm font-medium outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono shadow-inner"
                        disabled={isTyping}
                    />

                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <button
                            type="submit"
                            disabled={!inputText.trim() || isTyping}
                            className="bg-slate-900 dark:bg-emerald-500 text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>

                <div className="mt-4 flex items-center justify-between px-2">
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 uppercase font-black tracking-widest font-mono">
                        <div className="flex items-center gap-1.5">
                            <Activity size={12} className="text-emerald-500" />
                            <span>Latency: 142ms</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck size={12} className="text-blue-500" />
                            <span>Verified Architecture</span>
                        </div>
                    </div>
                    <div className="text-[9px] text-slate-500 italic">Powered by Groq · {currentModel?.name || 'Llama 3.3 70B'} · Ultra-low latency inference</div>
                </div>
            </div>
        </div>
    );
};

export default AIAdvisor;
