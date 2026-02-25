import React, { useState, useEffect, useRef } from 'react';
import { Send, Activity, ShieldCheck, Sparkles, ChevronDown, Check } from 'lucide-react';
import API from './api';


const AIAdvisor = ({ user, token, forceDarkMode = false }) => {
    const username = user?.username || user?.name || 'Agent';
    const [messages, setMessages] = useState([
        { role: 'assistant', text: `Greetings, ${username}. I am the SecurePay AI Quantum Optimizer. I have synchronized with the global risk ledger. How can I assist you with your forensic financial analysis today?` }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [models, setModels] = useState([]);
    const [currentModel, setCurrentModel] = useState(null);
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [loadingModels, setLoadingModels] = useState(true);
    const messagesEndRef = useRef(null);
    const modelPickerRef = useRef(null);

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
                setCurrentModel(res.data.find(m => m.id === 'openai/gpt-oss-120b') || res.data[0]);
            } catch (err) {
                console.error("Failed to load models:", err);
            } finally {
                setLoadingModels(false);
            }
        };
        fetchModels();
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modelPickerRef.current && !modelPickerRef.current.contains(event.target)) {
                setShowModelPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                    model_id: currentModel?.id || 'openai/gpt-oss-120b'
                },
                { headers: { Authorization: token } }
            );

            setMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
        } catch (err) {
            console.error("AI Connect Error:", err);
            const errorMsg = err.response?.data?.detail || "The Neural Net is currently recalibrating its forensic cores. Please verify your connection status and try again.";
            setMessages(prev => [...prev, { role: 'assistant', text: `ERROR: ${errorMsg}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`animate-in-up flex flex-col h-[600px] border rounded-2xl overflow-hidden shadow-xl transition-all ${forceDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 dark:border-slate-800 dark:bg-slate-950'}`}>
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold tracking-tight">Financial Security Advisor</h3>
                        <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold font-mono">Neural Net Matrix Online</div>
                    </div>
                </div>
                {/* Model Selector */}
                <div className="relative" ref={modelPickerRef}>
                    <button
                        onClick={() => setShowModelPicker(!showModelPicker)}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-2 transition-all text-xs font-bold"
                    >
                        {loadingModels ? (
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="text-lg">{currentModel?.icon || '✦'}</span>
                                <span className="hidden sm:inline">{currentModel?.name || 'Select Model'}</span>
                            </>
                        )}
                        <ChevronDown size={14} className={`transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                    </button>

                    {showModelPicker && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in-fade animate-in-scale">
                            <div className="p-2 border-b border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4">Forensic Engines</div>
                            {models.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setCurrentModel(m);
                                        setShowModelPicker(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800 transition-colors ${currentModel?.id === m.id ? 'bg-slate-800/50 text-emerald-400' : 'text-slate-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{m.icon}</span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">{m.name}</span>
                                            <span className="text-[9px] opacity-50 uppercase">{m.provider}</span>
                                        </div>
                                    </div>
                                    {currentModel?.id === m.id && <Check size={14} className="text-emerald-500" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-500/10' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center h-10 w-16 justify-center shadow-sm">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
                <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Ask about your risk score, failed transactions..."
                    className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-800 dark:text-slate-200 font-mono"
                    disabled={isTyping}
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default AIAdvisor;
