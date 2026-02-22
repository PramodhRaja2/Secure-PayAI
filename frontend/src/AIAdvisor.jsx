import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Activity, ShieldCheck, Sparkles } from 'lucide-react';

const API = axios.create({
    baseURL: 'https://secure-payai.onrender.com', // Force match main App config
    headers: { 'Bypass-Tunnel-Reminder': 'true' }
});

const AIAdvisor = ({ user, token }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: `Greetings, ${user.username}. I am the SecurePay AI Quantum Optimizer. I have synchronized with the global risk ledger. How can I assist you with your forensic financial analysis today?` }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = inputText.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputText('');
        setIsTyping(true);

        try {
            const res = await API.post('/advisor/chat',
                { message: userMsg, user_id: user.id },
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
        <div className="animate-in-up flex flex-col h-[600px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xl">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold tracking-tight">Financial Security Advisor</h3>
                        <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Secure AI Neural Net Online</div>
                    </div>
                </div>
                <ShieldCheck className="text-slate-600" size={24} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
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

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Ask about your risk score, failed transactions..."
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
                    disabled={isTyping}
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default AIAdvisor;
