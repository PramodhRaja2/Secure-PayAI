import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useBiometrics } from './hooks/useBiometrics';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Filler,
} from 'chart.js';
import {
    Activity, Shield, ShieldCheck, Zap, TrendingUp, BarChart3, History, Globe, Layers, FileWarning, Eye, Settings, Sun, Moon,
    Clock, Terminal, Search, Info, Send, Menu, X, ArrowRight, Download, ChevronRight, Lock, UserPlus, Loader,
    Keyboard, MousePointer, Smartphone, MapPin, DollarSign, Building, Trash, Trash2, ShieldAlert, MessageSquare, Cpu, Sparkles
} from 'lucide-react';

import AIAdvisor from './AIAdvisor';
import { GLOBAL_CITIES } from './citiesData';
import ThreatMap from './ThreatMap';
import API from './api';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);


const recommendationColorClass = (color) => {
    if (!color) return '';
    const c = String(color).toLowerCase().replace(/\s/g, '');
    return ['green', 'lightgreen', 'orange', 'red', 'darkred'].includes(c) ? `recommendation-${c}` : '';
};

const ICON_MAP = {
    'keyboard': Keyboard, 'mouse-pointer': MousePointer, 'smartphone': Smartphone,
    'map-pin': MapPin, 'dollar-sign': DollarSign, 'clock': Clock,
    'activity': Activity, 'zap': Zap, 'globe': Globe,
    'building': Building, 'bar-chart': BarChart3,
};
const getIcon = (name, size = 16) => { const I = ICON_MAP[name]; return I ? <I size={size} /> : <Activity size={size} />; };

/* ─────────── DECRYPTED TEXT COMPONENT ─────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
const DecryptedText = ({ text, speed = 50, className = '' }) => {
    const [displayed, setDisplayed] = useState('');
    const resolved = useRef(0);
    useEffect(() => {
        resolved.current = 0;
        setDisplayed(text.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join(''));
        const interval = setInterval(() => {
            resolved.current++;
            if (resolved.current >= text.length) { setDisplayed(text); clearInterval(interval); return; }
            setDisplayed(prev =>
                text.split('').map((ch, i) => i < resolved.current ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
            );
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed]);
    return <span className={className} style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.01em' }}>{displayed}</span>;
};

/* ─────────── SHINY TEXT COMPONENT ─────────── */
const ShinyText = ({ children, className = '', variant = 'default' }) => (
    <span className={`${variant === 'emerald' ? 'shiny-text-emerald' : 'shiny-text'} ${className}`}>{children}</span>
);

const RiskGauge = ({ score, level }) => {
    const radius = 80;
    const circ = Math.PI * radius;
    const offset = circ - (score / 100) * circ;
    const color = score <= 25 ? '#10b981' : score <= 50 ? '#34d399' : score <= 70 ? '#f59e0b' : score <= 85 ? '#ef4444' : '#991b1b';
    return (
        <div className="risk-gauge-container" style={{ position: 'relative', width: 180, margin: '0 auto' }}>
            <svg width="180" height="110" viewBox="0 0 180 110" style={{ filter: `drop-shadow(0 0 10px ${color}15)`, display: 'block' }}>
                <path d="M 10 100 A 80 80 0 0 1 170 100" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="14" strokeLinecap="round" />
                <path d="M 10 100 A 80 80 0 0 1 170 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.19, 1, 0.22, 1), stroke 0.5s ease' }} />
            </svg>
            {/* Score and label centered over the arc bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{score}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 4 }}>{level} Risk Intensity</div>
            </div>
        </div>
    );
};



const PAGE_META = {
    optimizer: { title: 'Optimizer Engine', desc: 'Real-time multi-corridor bank routing' },
    risk: { title: 'Security Intelligence', desc: 'Integrated ML + Biometric fraud detection' },
    rates: { title: 'FX Intelligence', desc: 'Live market volatility & hedging advice' },
    providers: { title: 'Banks Directory', desc: 'Comparative analysis of all institutional routes' },
    corridors: { title: 'Corridor Analytics', desc: 'Geo-regulatory risk & compliance levels' },
    aml: { title: 'Compliance Hub', desc: 'AML flags & ISO 20022 message status' },
    bioprofile: { title: 'Digital Identity', desc: 'Historical behavioral baseline profile' },
    security: { title: 'Safety Protocols', desc: 'Threshold configuration & risk policies' },
    history: { title: 'Audit Ledger', desc: 'Immutable transaction history log' },
};

/* ─────────── ADMIN COMPONENTS ─────────── */
const AdminStats = ({ token }) => {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const resp = await API.get('/admin/stats', { headers: { Authorization: token } });
                setStats(resp.data);
            } catch (e) { console.error(e); }
        };
        fetchStats();
    }, [token]);

    if (!stats) return <div className="p-12 text-center opacity-40">Loading System Telemetry...</div>;

    return (
        <div className="space-y-6 animate-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card"><div className="card-body"><h3>{stats.active_users}</h3><p className="text-[10px] uppercase opacity-40">Active Sessions</p></div></div>
                <div className="card"><div className="card-body"><h3>${stats.total_volume.toLocaleString()}</h3><p className="text-[10px] uppercase opacity-40">Total Volume Approved</p></div></div>
                <div className="card"><div className="card-body"><h3 className="text-red-400">{stats.fraud_rate}</h3><p className="text-[10px] uppercase opacity-40">Blocked Fraud Rate</p></div></div>
            </div>
            <div className="card">
                <div className="card-header"><h3>Engine Telemetry</h3></div>
                <div className="card-body">
                    <div className="grid grid-cols-3 gap-8">
                        <div><div className="text-xs opacity-40 mb-1">FX LATENCY</div><div className="font-mono text-xl">{stats.engine_telemetry.fx_latency}</div></div>
                        <div><div className="text-xs opacity-40 mb-1">BIOMETRIC ACCURACY</div><div className="font-mono text-xl text-emerald-400">{stats.engine_telemetry.biometric_accuracy}</div></div>
                        <div><div className="text-xs opacity-40 mb-1">INFERENCE TIME</div><div className="font-mono text-xl">{stats.engine_telemetry.ml_inference_time}</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─────────── CACHE HEALTH INDICATOR ─────────── */
const CacheHealthIndicator = () => {
    const [cacheStatus, setCacheStatus] = useState(null);
    useEffect(() => {
        const check = async () => {
            try {
                const resp = await API.get('/');
                const entries = resp.data?.cache_status || [];
                setCacheStatus(entries.length === 0 ? 'empty' : entries.some(e => e.stale) ? 'stale' : 'fresh');
            } catch { setCacheStatus('error'); }
        };
        check();
        const interval = setInterval(check, 5 * 60 * 1000); // re-check every 5 min
        return () => clearInterval(interval);
    }, []);
    const label = cacheStatus === 'fresh' ? 'FX Rates Live' : cacheStatus === 'stale' ? 'Rates Stale' : cacheStatus === 'empty' ? 'No Cache' : 'Offline';
    const dotClass = cacheStatus === 'fresh' ? 'fresh' : cacheStatus === 'stale' || cacheStatus === 'empty' ? 'stale' : 'error';
    return (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200" style={{ fontSize: 10 }}>
            <span className={`cache-dot ${dotClass}`} />
            <span className="opacity-50 uppercase font-bold tracking-wider">{label}</span>
        </div>
    );
};

/* ─────────── QUANTUM CAPTCHA ─────────── */
const QuantumCaptcha = ({ onVerify, verified }) => {
    const [verifying, setVerifying] = useState(false);

    if (verified) {
        return (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-xs font-bold font-mono uppercase transition-all mb-4">
                <ShieldCheck size={16} /> Identity Fully Verified
            </div>
        );
    }

    const handleVerify = (e) => {
        e.preventDefault();
        setVerifying(true);
        setTimeout(() => {
            setVerifying(false);
            onVerify(true);
        }, 1500);
    };

    return (
        <div className="flex items-center justify-between p-3 bg-slate-900/5 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl mb-4 transition-all">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-6 h-6 rounded border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center hover:border-blue-500 transition-colors bg-white dark:bg-black"
                >
                    {verifying && <div className="w-3 h-3 bg-blue-500 rounded-sm animate-pulse" />}
                </button>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Verify Access Token</div>
            </div>
            <div className="flex items-center gap-1 opacity-50">
                <Sparkles size={12} className="text-blue-500" />
                <span className="text-[9px] uppercase tracking-widest font-black text-slate-800 dark:text-slate-200">Quantum</span>
            </div>
        </div>
    );
};

/* ─────────── MAIN APP ─────────── */
const App = () => {
    const [txnData, setTxnData] = useState({ amount: 25000, base_currency: 'USD', target_currency: 'EUR', priority: 'balanced', source_city: 'NYC', dest_city: 'LDN' });
    const [currencies, setCurrencies] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fraudMode, setFraudMode] = useState(false);
    const [activeNav, setActiveNav] = useState('optimizer');
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [messages, setMessages] = useState([]);

    const [isExecuting, setIsExecuting] = useState(false);
    const [settlementReceipt, setSettlementReceipt] = useState(null);
    const [securityBlock, setSecurityBlock] = useState(null); // { score, detail }

    // Theme State
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('securepay_theme');
        return saved ? saved === 'dark' : true;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
        localStorage.setItem('securepay_theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const toggleTheme = () => setDarkMode(!darkMode);

    // Auth State
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('securepay_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('securepay_token') || null);

    useEffect(() => {
        if (!user || !token) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws/${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => setWsConnected(true);
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            setMessages(prev => [msg, ...prev]);
        };
        ws.onclose = () => setWsConnected(false);

        return () => ws.close();
    }, [user, token]);

    const [loginUsername, setLoginUsername] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [authError, setAuthError] = useState('');
    const [captchaVerified, setCaptchaVerified] = useState(() => localStorage.getItem('quantum_verified') === 'true');

    const biometrics = useBiometrics();

    useEffect(() => {
        API.get('/currencies')
            .then((r) => setCurrencies(r.data))
            .catch(() =>
                setCurrencies([
                    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' }, { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
                    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' }, { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
                    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' }, { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
                    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
                ])
            );
        if (token) fetchHistory();
    }, [token]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            const resp = await API.post('/login', { username: loginUsername, password: loginPass });
            // Response includes { token, role, name, id, region, preference }
            const userData = {
                username: resp.data.name || resp.data.username || loginUsername,
                role: resp.data.role,
                name: resp.data.name,
                id: resp.data.id,
                region: resp.data.region,
                preference: resp.data.preference
            };
            setUser(userData);
            setTxnData(prev => ({ ...prev, priority: resp.data.preference || 'balanced' }));
            setToken(resp.data.token);
            localStorage.setItem('securepay_user', JSON.stringify(userData));
            localStorage.setItem('securepay_token', resp.data.token);
        } catch (err) {
            setAuthError(err.response?.data?.detail || 'Invalid credentials');
        }
    };

    const handleLogout = () => {
        setUser(null);
        setToken(null);
        setActiveNav('optimizer');
        setLoginUsername('');
        setLoginPass('');
        localStorage.removeItem('securepay_user');
        localStorage.removeItem('securepay_token');
    };

    const fetchHistory = async () => {
        try {
            const res = await API.get('/transaction-history', { headers: { Authorization: token } });
            setHistory(res.data);
        } catch (e) { console.error(e); }
    };

    const handleExecuteSettlement = () => {
        setIsExecuting(true);
        setTimeout(() => {
            setIsExecuting(false);
            setSettlementReceipt({
                hash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
                timestamp: new Date().toISOString(),
                amount: txnData.amount,
                base_currency: txnData.base_currency,
                target_currency: txnData.target_currency,
                provider: selectedProvider,
                risk: analysis.risk_report
            });
        }, 500);
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setApiError(null);
        try {
            const payload = {
                ...txnData,
                // Fraud simulation overrides — all signals maxed out
                amount: fraudMode ? 75000 : txnData.amount,
                typing_speed: fraudMode ? 180 : biometrics.typing_speed,
                mouse_velocity: fraudMode ? 1200 : biometrics.mouse_velocity,
                ip_location: fraudMode ? 'Lagos' : 'NY',
                lat_long: fraudMode ? [6.5244, 3.3792] : [40.7128, -74.0060],
                device: fraudMode ? 'Unknown/Linux' : 'Chrome/Windows',
                session_hour: fraudMode ? 3 : new Date().getHours(),
                is_copy_paste: fraudMode || biometrics.is_copy_paste,
                is_vpn: fraudMode,
            };
            const res = await API.post('/analyze', payload, { headers: { Authorization: token } });
            setAnalysis(res.data);
            setSelectedProvider(res.data.recommended_route);

            // SECURITY BLOCK TRIGGER
            if (res.data.risk_report.risk_score > 70) {
                setSecurityBlock({
                    score: res.data.risk_report.risk_score,
                    detail: res.data.risk_report.recommendation_detail,
                    aml_flags: res.data.risk_report.aml_flags
                });
            }

            fetchHistory();
        } catch (e) {
            setApiError(e.response?.data?.detail || e.message || 'Analysis failed. API gateway unreachable.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAlert = async (id, callback) => {
        if (!window.confirm("Delete this message permanently?")) return;
        try {
            await API.delete(`/alerts/${id}`, { headers: { Authorization: token } });
            if (callback) callback();
        } catch (e) {
            alert(e.response?.data?.detail || "Delete failed");
        }
    };

    const currentSymbol = currencies.find(c => c.code === txnData.base_currency)?.symbol || '$';

    const meta = PAGE_META[activeNav] || PAGE_META.optimizer;
    const noDataYet = (
        <div className="empty-state">
            <div className="icon"><Activity size={48} color="#4f7df9" /></div>
            <p>Configure a transaction and run the <strong>AI Optimizer</strong> to populate this view with real-time data.</p>
            <button className="btn-primary" style={{ marginTop: 24, width: 'auto' }} onClick={() => setActiveNav('optimizer')}>Open Optimizer</button>
        </div>
    );

    /* ─── VIEW: OPTIMIZER ─── */
    const renderOptimizer = () => (
        <div className="grid-main">
            <div className="animate-in-left">
                <div className="card">
                    <div className="card-header"><h3>Transfer Setup</h3></div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Amount</label>
                            <div className="form-input-icon">
                                <span style={{ fontSize: 20, color: '#4f7df9', fontWeight: 'bold' }}>{currentSymbol}</span>
                                <input type="number" min="0" className="form-input" value={txnData.amount} onChange={e => {
                                    const val = e.target.value;
                                    setTxnData({ ...txnData, amount: val === '' ? '' : Number(val) });
                                }} />
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Send From</label>
                                <select className="form-select" value={txnData.base_currency} onChange={e => setTxnData({ ...txnData, base_currency: e.target.value })}>
                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deliver To</label>
                                <select className="form-select" value={txnData.target_currency} onChange={e => setTxnData({ ...txnData, target_currency: e.target.value })}>
                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Origin City</label>
                                <select className="form-select" value={txnData.source_city} onChange={e => setTxnData({ ...txnData, source_city: e.target.value })}>
                                    {GLOBAL_CITIES.map(c => <option key={`src-${c.id}`} value={c.id}>{c.name}, {c.country}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Destination City</label>
                                <select className="form-select" value={txnData.dest_city} onChange={e => setTxnData({ ...txnData, dest_city: e.target.value })}>
                                    {GLOBAL_CITIES.map(c => <option key={`dst-${c.id}`} value={c.id}>{c.name}, {c.country}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Optimization Priority</label>
                            <div className="priority-tabs">
                                {['cost', 'speed', 'balanced', 'secure'].map(p => (
                                    <button key={p} className={`priority-tab ${txnData.priority === p ? 'active' : ''}`} onClick={() => {
                                        setTxnData({ ...txnData, priority: p });
                                        if (user && token) {
                                            API.patch('/user/preferences', { user_id: user.id, preference: p }, { headers: { Authorization: token } }).catch(console.error);
                                            setUser({ ...user, preference: p });
                                        }
                                    }}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
                                ))}
                            </div>
                        </div>
                        {apiError && (
                            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center gap-2">
                                <Info size={18} /> {apiError}
                            </div>
                        )}
                        <button className="btn-primary" onClick={handleAnalyze} disabled={loading}>{loading ? 'Optimizing Routes...' : 'Search Available Banks'}</button>
                    </div>
                </div>



                {analysis && (
                    <div className="card section-gap">
                        <div className="card-header"><h3>Banks Directory</h3></div>
                        <div className="card-body" style={{ padding: '20px' }}>
                            <div className="provider-list">
                                {analysis.fx_report.comparisons.map((p, i) => (
                                    <div
                                        key={i}
                                        className={`provider-item-compact ${selectedProvider?.provider === p.provider ? 'selected' : ''}`}
                                        onClick={() => setSelectedProvider(p)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="provider-icon-small" style={{ background: i === 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--glass)' }}>
                                                {getIcon(p.type === 'Bank' ? 'building' : p.type === 'Blockchain' ? 'zap' : 'activity', 12)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs" style={{ color: i === 0 ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>{p.provider} {i === 0 && '✦'}</div>
                                                <div className="text-[9px] opacity-40 uppercase tracking-widest">{p.type}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-xs">${p.total_cost_usd.toFixed(2)}</div>
                                            <div className="text-[9px] opacity-50">{p.eta_hours}h ETA</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="animate-in-up">
                {!analysis ? (
                    <div className="empty-state">
                        <div className="icon"><Zap size={48} color="#4f7df9" /></div>
                        <p><strong>SecurePay Fusion AI</strong> is ready. Please configure your transfer details on the left and start the analysis to see deep-market routing & security scoring.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid-4 mb-8">
                            <div className="stat-card"><div className="label">Interbank Mid-Rate</div><div className="value">{analysis.fx_report.mid_rate.toFixed(4)}</div></div>
                            <div className="stat-card"><div className="label">Route Net Cost</div><div className="value">${selectedProvider?.total_cost_usd.toFixed(2)}</div></div>
                            <div className="stat-card"><div className="label">AI Yield Savings</div><div className="value"><ShinyText variant="emerald">+${analysis.total_savings.toFixed(2)}</ShinyText></div></div>
                            <div className="stat-card"><div className="label">Unified Risk</div><div className={`value ${recommendationColorClass(analysis.risk_report.recommendation_color)}`}><ShinyText>{analysis.risk_report.risk_score}</ShinyText></div></div>
                        </div>

                        <div className="grid-2 mb-8">
                            <div className="card">
                                <div className="card-header"><h3>Security Status</h3></div>
                                <div className="card-body text-center" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <RiskGauge score={analysis.risk_report.risk_score} level={analysis.risk_report.risk_level} />
                                    <div className="decision-note mt-6">
                                        <p className="text-[11px] opacity-50 uppercase tracking-widest mb-1">Recommended Action</p>
                                        <strong className={`text-sm ${recommendationColorClass(analysis.risk_report.recommendation_color)}`}>{analysis.risk_report.recommendation}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-header"><h3>ML Anomaly Inference</h3></div>
                                <div className="card-body">
                                    <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] uppercase font-bold text-blue-400">Isolation Forest Confidence</span>
                                            <span className="text-lg font-bold">{analysis.risk_report.ml_insight.confidence}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${analysis.risk_report.ml_insight.confidence}%` }} />
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-4">Risk component vectors</h4>
                                        <div className="space-y-3">
                                            {Object.entries(analysis.risk_report.unified_breakdown).map(([k, v]) => (
                                                <div key={k} className="flex items-center gap-3 text-[11px]">
                                                    <span className="opacity-60 capitalize min-w-[90px]">{k.replace(/_/g, ' ')}</span>
                                                    <div className="h-1.5 bg-slate-100 flex-1 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(v, 100)}%` }} />
                                                    </div>
                                                    <span className="mono font-bold w-8 text-right shrink-0">+{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedProvider && (
                            <div className="card selected-route-box animate-in-up">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <div className="tag text-blue-100" style={{ border: '1px solid rgba(0,0,0,0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>Executive Order Summary</div>
                                        <h2 className="text-2xl font-extrabold mt-2">{selectedProvider.provider}</h2>
                                        <p className="text-xs opacity-50 mt-1">{selectedProvider.description}</p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-2xl min-w-[100px] border border-slate-200">
                                        <div className="text-3xl font-black text-blue-400">{selectedProvider.weighted_score}</div>
                                        <div className="text-[9px] opacity-40 uppercase font-black">Routing Rank</div>
                                    </div>
                                </div>
                                <div className="stats-grid-compact">
                                    <div className="stat-item"><label>Provider Rate</label><span>{selectedProvider.provider_rate.toFixed(4)}</span></div>
                                    <div className="stat-item"><label>Settlement Loss</label><span className="text-red-400">${selectedProvider.total_cost_usd.toFixed(2)}</span></div>
                                    <div className="stat-item"><label>Est. Arrival</label><span>{selectedProvider.eta_hours}h</span></div>
                                    <div className="stat-item"><label>Trust Score</label><span>{(selectedProvider.reliability * 100).toFixed(0)}%</span></div>
                                </div>
                                <button
                                    className={`execute-btn mt-2 ${analysis.risk_report.risk_score > 70 || isExecuting ? 'disabled' : ''}`}
                                    disabled={analysis.risk_report.risk_score > 70 || isExecuting}
                                    onClick={handleExecuteSettlement}
                                >
                                    {isExecuting ? <><Loader className="animate-spin" size={18} /> Executing Settlement...</> : (
                                        analysis.risk_report.risk_score > 70 ? <><Lock size={18} /> Protocol Locked by Security Engine</> : <><Send size={18} /> Execute Secure Settlement</>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    const renderView = () => {
        switch (activeNav) {
            case 'optimizer': return renderOptimizer();
            case 'risk': return (
                analysis ? (
                    <div className="grid-2 animate-in-up">
                        <div className="card"><div className="card-header"><h3>Unified Security Matrix</h3></div><div className="card-body text-center"><RiskGauge score={analysis.risk_report.risk_score} level={analysis.risk_report.risk_level} /></div></div>
                        <div className="card">
                            <div className="card-header"><h3>Behavioral Audit</h3></div>
                            <div className="card-body">
                                {analysis.risk_report.breakdown.map((f, i) => (
                                    <motion.div
                                        key={i}
                                        className="risk-factor"
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
                                    >
                                        <div className={`factor-icon ${f.status}`}>{getIcon(f.icon)}</div>
                                        <div className="factor-info">
                                            <div className="factor-name">{f.factor}</div>
                                            <div className="factor-detail">Baseline Ref: {f.baseline} → Capture: {f.current}</div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="h-1.5 bg-slate-100 flex-1 rounded-full overflow-hidden shimmer-bar">
                                                    <motion.div
                                                        className={`h-full rounded-full ${f.status === 'critical' ? 'bg-red-400' : f.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${f.risk_contribution === 0 ? 100 : Math.min(f.risk_contribution * 2, 100)}%` }}
                                                        transition={{ delay: i * 0.08 + 0.2, duration: 0.6, ease: 'easeOut' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`factor-score self-start pt-1 ${f.status === 'normal' ? 'text-emerald-500' : ''}`}>+{f.risk_contribution}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : noDataYet
            );
            case 'rates': return (
                analysis ? (
                    <div className="grid-2 animate-in-up">
                        <div className="card">
                            <div className="card-header"><h3>Market Intelligence</h3></div>
                            <div className="card-body">
                                <div className="stat-card mb-4"><div className="label">Mid-Market Source</div><div className="value">{analysis.fx_report.mid_rate.toFixed(6)}</div></div>
                                <div className="stat-card"><div className="label">24h Volatility Index</div><div className="value">{analysis.fx_report.volatility_pct}%</div></div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header"><h3>Hedging Strategy</h3></div>
                            <div className="card-body">
                                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                    <h4 className="font-bold text-blue-400 text-lg">{analysis.fx_report.hedging.strategy}</h4>
                                    <p className="text-xs opacity-60 mt-2 leading-relaxed">{analysis.fx_report.hedging.reason}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : noDataYet
            );
            case 'providers': return (
                analysis ? (
                    <div className="card animate-in-up">
                        <div className="card-header"><h3>Full Institutional Directory</h3></div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="provider-table w-full" style={{ minWidth: '600px' }}>
                                    <thead><tr><th>Financial Institution</th><th>Spot Rate</th><th>Order Cost</th><th>ETA</th><th>Score</th></tr></thead>
                                    <tbody>
                                        {analysis.fx_report.comparisons.map((p, i) => (
                                            <tr key={i} className={selectedProvider?.provider === p.provider ? 'selected' : ''} onClick={() => setSelectedProvider(p)}>
                                                <td className="font-bold">{p.provider}</td>
                                                <td className="mono text-blue-400">{p.provider_rate.toFixed(4)}</td>
                                                <td className="mono text-red-400">${p.total_cost_usd.toFixed(2)}</td>
                                                <td className="mono">{p.eta_hours}h</td>
                                                <td className="mono font-bold text-green-400">{p.weighted_score}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : noDataYet
            );
            case 'history': return (
                <div className="card animate-in-up">
                    <div className="card-header"><h3>Secure Audit Ledger</h3></div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="provider-table w-full" style={{ minWidth: '500px' }}>
                                <thead><tr><th>Sync Time</th><th>Transaction Value</th><th>Decision</th></tr></thead>
                                <tbody>
                                    {history.slice().reverse().map((h, i) => (
                                        <tr key={i}><td>{new Date(h.time).toLocaleString()}</td><td className="font-bold">${h.amount.toLocaleString()}</td><td><span className={`go-badge ${h.approved ? 'go' : 'nogo'}`}>{h.approved ? 'AUTHORIZED' : 'DENIED'}</span></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
            case 'corridors': return (
                analysis ? (() => {
                    const cr = analysis.fx_report.corridor_risk;
                    const riskColor = cr.risk === 'Low' ? 'emerald' : cr.risk === 'Medium' ? 'amber' : 'red';
                    return (
                        <div className="card animate-in-up">
                            <div className="card-header flex justify-between items-center">
                                <h3>Protocol Analytics ({analysis.fx_report.base} → {analysis.fx_report.target})</h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold bg-${riskColor}-500/15 text-${riskColor}-500`}>{cr.compliance} Compliance</span>
                            </div>
                            <div className="card-body space-y-6">
                                {/* Top stat cards */}
                                <div className="grid-2">
                                    <div className="stat-card">
                                        <div className="label">Corridor Risk Level</div>
                                        <div className={`value text-${riskColor}-500`} style={{ fontSize: 20 }}>{cr.risk}</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="label">KYC Requirement</div>
                                        <div className="value" style={{ fontSize: 13, lineHeight: 1.4 }}>{cr.kyc_level}</div>
                                    </div>
                                </div>
                                {/* Compliance detail grid */}
                                <div className="p-5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl space-y-4">
                                    <h5 className="font-bold text-[10px] uppercase tracking-widest opacity-40 mb-2">Regulatory Intelligence</h5>
                                    {[
                                        { label: 'FATF Status', value: cr.fatf_status, icon: '🌐' },
                                        { label: 'Settlement Rails', value: cr.settlement, icon: '🏦' },
                                        { label: 'Regulation', value: cr.regulation, icon: '⚖️' },
                                        { label: 'Sanctions Screening', value: cr.sanctions, icon: '🛡️' },
                                    ].map(row => (
                                        <div key={row.label} className="flex gap-3 text-xs">
                                            <span className="text-base shrink-0">{row.icon}</span>
                                            <div>
                                                <div className="font-bold opacity-40 uppercase text-[9px] mb-0.5">{row.label}</div>
                                                <div className="opacity-80 leading-relaxed">{row.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })() : noDataYet
            );
            case 'aml': return (
                analysis ? (
                    <div className="card animate-in-up">
                        <div className="card-header"><h3>Compliance Status Monitor</h3></div>
                        <div className="card-body">
                            {analysis.risk_report.aml_flags.length === 0 ? (
                                <div className="text-center py-12"><ShieldCheck size={48} color="#10b981" className="mx-auto mb-4" /><p className="font-bold">ALL CHECKS PASSED</p><p className="text-xs opacity-50 mt-1">No sanctions or pattern flags detected.</p></div>
                            ) : (
                                <div className="space-y-3">
                                    {analysis.risk_report.aml_flags.map((f, i) => <div key={i} className="aml-flag"><Info size={14} /> Compliance Deviation: {f} pattern detected.</div>)}
                                </div>
                            )}
                        </div>
                    </div>
                ) : noDataYet
            );
            case 'bioprofile': return (
                <div className="grid-2 animate-in-up">
                    <div className="card">
                        <div className="card-header"><h3>Trusted Behavioral Baseline</h3></div>
                        <div className="card-body">
                            <div className="p-6 bg-slate-900 rounded-2xl font-mono text-xs text-emerald-400">
                                [FINGERPRINT_HASH: 0x82...FA21]<br />
                                TYPING_SPEED_AVG: {analysis?.risk_report?.baseline_profile?.typing_speed || 62} WPM<br />
                                MOUSE_VELOCITY_MEAN: {analysis?.risk_report?.baseline_profile?.mouse_velocity || 450} PX/S<br />
                                DEVICE_TRUST_VER: v2.0.4-SIGNED<br />
                                PRIMARY_REGION: {analysis?.risk_report?.baseline_profile?.ip_location || user.region || 'NORTH_AMERICA_EAST'}
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header"><h3>Current Live Signature</h3></div>
                        <div className="card-body">
                            <div className="grid-2 gap-4">
                                <div className="stat-card"><div className="label">Active Typing</div><div className="value">{biometrics.typing_speed} WPM</div></div>
                                <div className="stat-card"><div className="label">Active Mouse</div><div className="value">{biometrics.mouse_velocity} px/s</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'security': return (
                <div className="card animate-in-up">
                    <div className="card-header"><h3>Policy Governance</h3></div>
                    <div className="card-body">
                        <div className="space-y-6">
                            <div><label className="text-[10px] font-bold opacity-30 uppercase block mb-2">Decision Thresholds</label><div className="flex justify-between items-center p-4 bg-[var(--glass)] border border-[var(--glass-border)] rounded-xl text-xs"><span>Critical Block Level</span><span className="font-bold text-red-500 text-right">&gt; 85 Score</span></div></div>
                            <div><label className="text-[10px] font-bold opacity-30 uppercase block mb-2">Engine Sensitivity</label><div className="flex justify-between items-center p-4 bg-[var(--glass)] border border-[var(--glass-border)] rounded-xl text-xs"><span>ML Anomaly Threshold</span><span className="font-bold text-blue-500 text-right">0.65 (Isolation Forest)</span></div></div>
                        </div>
                    </div>
                </div>
            );
            case 'admin_stats': return <AdminStats token={token} />;
            case 'users': return <UserManagement token={token} user={user} />;
            case 'alerts': return <ChatInterface token={token} user={user} messages={messages} setMessages={setMessages} />;
            case 'advisor': return <AIAdvisor user={user} token={token} />;
            case 'threatmap': return <div className="h-[650px] animate-in-up"><ThreatMap transactions={history} optimizerRoute={txnData} userRole={user?.role} token={token} /></div>;
            default: return renderOptimizer();
        }
    };

    const navSections = [
        { title: 'Engines', items: [{ id: 'optimizer', icon: <Cpu size={16} />, label: 'Optimizer' }, { id: 'risk', icon: <ShieldCheck size={16} />, label: 'Security' }, { id: 'rates', icon: <TrendingUp size={16} />, label: 'FX Intel' }] },
        { title: 'Analytics', items: [{ id: 'threatmap', icon: <Globe size={16} />, label: 'Live Threat Map' }, { id: 'providers', icon: <BarChart3 size={16} />, label: 'Banks Directory' }, { id: 'corridors', icon: <Layers size={16} />, label: 'Protocols' }, { id: 'aml', icon: <FileWarning size={16} />, label: 'Compliance' }] },
        {
            title: 'Governance', items: [
                { id: 'admin_stats', icon: <Activity size={16} />, label: 'Admin Insight', adminOnly: true },
                { id: 'users', icon: <Settings size={16} />, label: 'User Governance' },
                { id: 'alerts', icon: <Zap size={16} />, label: 'Inbox & Broadcasts' }
            ]
        },
        { title: 'Audit Log', items: [{ id: 'history', icon: <History size={16} />, label: 'Audit Ledger' }, { id: 'bioprofile', icon: <Eye size={16} />, label: 'Identity' }, { id: 'security', icon: <Settings size={16} />, label: 'Policy' }, { id: 'advisor', icon: <Zap size={16} />, label: 'AI Advisor' }] },
    ];
    const handleNav = (id) => {
        setActiveNav(id);
        setSidebarOpen(false);
        setIsMobileMenuOpen(false);
    };

    const [isRegistering, setIsRegistering] = useState(false);
    const [regRegion, setRegRegion] = useState('NORTH_AMERICA_EAST');

    const handleRegister = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            const resp = await API.post('/register', { username: loginUsername, password: loginPass, primary_location: regRegion });
            setUser({ role: resp.data.role, name: resp.data.name, id: resp.data.id, region: resp.data.region, preference: resp.data.preference });
            setTxnData(prev => ({ ...prev, priority: resp.data.preference || 'balanced' }));
            setToken(resp.data.token);
        } catch (err) {
            setAuthError(err.response?.data?.detail || 'Registration failed');
        }
    };

    if (!user) {
        return (
            <div className="login-view">
                <div className="login-card">
                    <div className="login-header">
                        <Activity color="#4f7df9" size={40} className="mx-auto" />
                        <h2>{isRegistering ? 'Create Profile' : 'SecurePay AI Quantum v4.5'}</h2>
                        <div className="text-3xl font-black text-blue-500 my-4 uppercase tracking-tighter">Built By Pramodh Raja</div>
                        <p className="text-[10px] opacity-70 mb-4">{isRegistering ? 'Enterprise Identity Enrollment' : 'Identity & Specialized Governance Portal'}</p>
                        <div className="text-[9px] font-bold text-slate-400 bg-slate-50 py-2 px-3 rounded-lg border border-slate-100 mb-4">
                            Developed at <a href="https://www.bapssathy.ac.in/index.php" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Bannari Amman Public School</a>
                        </div>
                    </div>
                    <form onSubmit={isRegistering ? handleRegister : handleLogin} className="login-form">
                        <div className="input-group">
                            <label>Username</label>
                            <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="Enter network ID" required />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="Authentication passphrase" required />
                        </div>
                        {isRegistering && (
                            <div className="input-group">
                                <label>Primary Region</label>
                                <select value={regRegion} onChange={(e) => setRegRegion(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono">
                                    <option value="NORTH_AMERICA_EAST">North America - East</option>
                                    <option value="NORTH_AMERICA_WEST">North America - West</option>
                                    <option value="EUROPE_CENTRAL">Europe - Central</option>
                                    <option value="ASIA_PACIFIC">Asia - Pacific</option>
                                    <option value="LATIN_AMERICA">Latin America</option>
                                </select>
                            </div>
                        )}
                        <QuantumCaptcha verified={captchaVerified} onVerify={(val) => {
                            setCaptchaVerified(val);
                            localStorage.setItem('quantum_verified', 'true');
                        }} />
                        {authError && <div className="auth-error">{authError}</div>}
                        <button type="submit" disabled={!captchaVerified} className={`login-btn mb-4 ${!captchaVerified ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={(e) => { e.preventDefault(); isRegistering ? handleRegister(e) : handleLogin(e); }}>
                            {isRegistering ? 'Initialize Account' : 'Secure Login'}
                        </button>
                        <div className="text-center text-xs opacity-50 cursor-pointer font-bold hover:text-blue-500 transition-colors" onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}>
                            {isRegistering ? 'Already have access? Proceed to login.' : 'New user? Request an access profile here.'}
                        </div>
                    </form>
                    <div className="login-footer mt-6">
                        <Lock size={12} /> Encrypted Session Management Active
                    </div>
                </div>
            </div>
        );
    }

    if (user.role === 'dev') {
        return <DevConsole user={user} token={token} onLogout={handleLogout} messages={messages} setMessages={setMessages} darkMode={darkMode} toggleTheme={toggleTheme} />;
    }

    return (
        <div className="app-layout">
            {(sidebarOpen || isMobileMenuOpen) && (
                <div className="mobile-overlay md:hidden" onClick={() => { setSidebarOpen(false); setIsMobileMenuOpen(false); }} aria-hidden="true" />
            )}
            <aside className={`sidebar ${(sidebarOpen || isMobileMenuOpen) ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon"><Shield size={20} /></div>
                    <h1>SecurePay AI</h1>
                    <div className="text-[13px] font-black text-blue-600 absolute top-[44px] left-[68px] uppercase tracking-widest bg-white/80 backdrop-blur-sm px-1 rounded-sm">Pramodh Raja</div>
                </div>

                <div className="px-6 py-4 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-colors">
                        <div className="text-[10px] uppercase opacity-40 font-bold mb-1">Session ID</div>
                        <div className="text-xs font-mono opacity-60 truncate">{token.slice(0, 12)}...</div>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs">
                                {user.name?.charAt(0) || user.username?.charAt(0)}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">{user.name || user.username}</div>
                                <div className="text-[9px] opacity-40 uppercase font-bold">{user.role}</div>
                            </div>
                        </div>
                        <CacheHealthIndicator />
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navSections.map((sec) => (
                        <React.Fragment key={sec.title}>
                            <div className="nav-section-title">{sec.title}</div>
                            {sec.items.map((n) => {
                                // Role-based filter
                                if (n.adminOnly && user.role !== 'admin' && user.role !== 'dev') return null;
                                return (
                                    <div key={n.id} className={`nav-item ${activeNav === n.id ? 'active' : ''}`} onClick={() => handleNav(n.id)}>
                                        {n.icon} {n.label}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                    <div className="mt-auto px-6 py-8 border-t border-[var(--border)] bg-slate-50/50">
                        <div className="mb-4">
                            <div className="text-[9px] uppercase opacity-40 font-black mb-2 tracking-[0.2em]">Project Architect</div>
                            <div className="text-sm font-black text-slate-900 mb-1">Pramodh Raja</div>
                            <div className="text-[10px] font-bold text-blue-600 mb-3 leading-tight">
                                <a href="https://www.bapssathy.ac.in/index.php" target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    Bannari Amman Public School
                                </a>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-[8px] font-black text-white bg-slate-900 px-2 py-1 rounded-sm uppercase text-center">Grade XI-B</div>
                                <div className="text-[8px] font-black text-white bg-blue-600 px-2 py-1 rounded-sm uppercase text-center">Senior Lead</div>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black opacity-40 hover:opacity-100 transition-all text-red-600 dark:text-red-400 uppercase tracking-widest" onClick={handleLogout}>
                            <X size={12} strokeWidth={3} /> Shutdown Session
                        </button>
                    </div>
                </nav>
            </aside>
            <main className="main-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <button type="button" className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mr-2 flex items-center justify-center" onClick={() => setIsMobileMenuOpen(true)} title="Open Menu"><Menu size={20} /></button>

                        <div>
                            <h2 className="text-3xl font-black">{meta.title}</h2>
                            <p className="font-semibold opacity-70">{meta.desc}</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button onClick={toggleTheme} className="theme-toggle-btn p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all z-[100]" title="Toggle Theme">
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button className={`fraud-toggle ${fraudMode ? 'active' : ''}`} onClick={() => setFraudMode(!fraudMode)}><span className="dot" />Fraud Simulation</button>
                        <span className="iso-badge">SECURE-V4.0-ID</span>
                    </div>
                </div>


                <AnimatePresence mode="wait" initial={false}>
                    {settlementReceipt ? (
                        <motion.div
                            key="receipt"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                            className="receipt-container"
                        >
                            <div className="receipt-card printable-receipt">
                                <div className="receipt-header text-center">
                                    <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-full inline-block mb-4">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black mb-2">Settlement Statement</h2>
                                    <p className="font-mono text-[10px] opacity-40">TXN_HASH: {settlementReceipt.hash}</p>
                                </div>
                                <div className="receipt-body space-y-6 mt-8 p-6 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)]">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[9px] uppercase opacity-40 font-bold tracking-widest mb-1">Execution Time</div>
                                            <div className="font-mono text-xs">{new Date(settlementReceipt.timestamp).toLocaleString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] uppercase opacity-40 font-bold tracking-widest mb-1">Status</div>
                                            <div className="text-xs font-bold text-emerald-400">SETTLED & VERIFIED</div>
                                        </div>
                                    </div>
                                    <div className="h-[1px] w-full bg-[var(--border)]" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[10px] uppercase opacity-40 font-bold tracking-widest mb-1">Origin Fund</div>
                                            <div className="text-2xl font-black">{settlementReceipt.amount.toLocaleString()} {settlementReceipt.base_currency}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase opacity-40 font-bold tracking-widest mb-1">Destination Fund</div>
                                            <div className="text-2xl font-black text-emerald-400">{(settlementReceipt.amount * settlementReceipt.provider.provider_rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {settlementReceipt.target_currency}</div>
                                        </div>
                                    </div>
                                    <div className="h-[1px] w-full bg-[var(--border)]" />
                                    <div className="space-y-3 pt-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-50">Liquidity Provider</span>
                                            <span className="font-bold">{settlementReceipt.provider.provider}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-50">Locked Exchange Rate</span>
                                            <span className="font-bold font-mono">{settlementReceipt.provider.provider_rate.toFixed(4)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-50">Settlement Cost</span>
                                            <span className="font-bold text-red-400">${settlementReceipt.provider.total_cost_usd.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="receipt-footer mt-6 flex justify-between gap-4 no-print">
                                    <button className="btn-secondary flex-1 flex justify-center items-center gap-2" onClick={() => window.print()}>
                                        <Download size={16} /> Download PDF
                                    </button>
                                    <button className="btn-primary flex-1 flex justify-center items-center gap-2 bg-slate-800 text-white" onClick={() => { setSettlementReceipt(null); setAnalysis(null); setSelectedProvider(null); }}>
                                        <ArrowRight size={16} /> Return to Optimizer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeNav}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: "circOut" }}
                        >
                            {renderView()}
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {securityBlock && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="max-w-md w-full bg-slate-900 border border-red-500/50 rounded-3xl overflow-hidden shadow-2xl shadow-red-500/20"
                            >
                                <div className="bg-red-600 p-8 flex flex-col items-center text-white text-center">
                                    <div className="bg-white/20 p-4 rounded-full mb-4 animate-pulse">
                                        <ShieldAlert size={48} />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Protocol Locked</h2>
                                    <div className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">
                                        Risk Magnitude: {securityBlock.score}%
                                    </div>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">Security Engine Result</div>
                                        <p className="text-slate-100 text-lg leading-snug font-medium italic text-center">"{securityBlock.detail}"</p>

                                        {securityBlock.aml_flags && securityBlock.aml_flags.length > 0 && (
                                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                                                <div className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2">Anomalies Detected</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {securityBlock.aml_flags.map((f, i) => (
                                                        <span key={i} className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-bold uppercase">{f}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-6">
                                        This transaction has been **DENIED** by the integrated Adaptive Guard Kernel.
                                        The incident has been broadcast to the **Security Terminal** for manual human review and compliance verification.
                                    </div>

                                    <div className="flex flex-col gap-3 pt-4">
                                        <button
                                            onClick={() => setSecurityBlock(null)}
                                            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700"
                                        >
                                            Acknowledge Block
                                        </button>
                                        <div className="text-center">
                                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest opacity-50">Status: Awaiting DevOps Override</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

/* ─────────── DEV CONSOLE ─────────── */
const DevConsole = ({ user, token, onLogout, messages, setMessages, darkMode, toggleTheme }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [pending, setPending] = useState([]);
    const [devMsg, setDevMsg] = useState('');
    const [targetUser, setTargetUser] = useState('0'); // 0 for all users (broadcast)
    const [users, setUsers] = useState([]); // For user list in broadcast

    const [refreshing, setRefreshing] = useState(false);
    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try { const r = await API.get('/dev/stats', { headers: { Authorization: token } }); setStats(r.data); } catch (e) { console.error("Stats fetch error:", e); }
        try { const r = await API.get('/dev/pending', { headers: { Authorization: token } }); setPending(r.data); } catch (e) { console.error("Pending fetch error:", e); }
        try { const r = await API.get('/dev/messages', { headers: { Authorization: token } }); setMessages(r.data); } catch (e) { console.error("Messages fetch error:", e); }
        try { const r = await API.get('/dev/users', { headers: { Authorization: token } }); setUsers(r.data); } catch (e) { console.error("Users fetch error:", e); }
        setTimeout(() => setRefreshing(false), 600);
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const review = async (id, action) => {
        try {
            await API.patch(`/dev/transactions/${id}/review`, { action }, { headers: { Authorization: token } });
            setPending(prev => prev.filter(t => t.id !== id));
        } catch (e) { alert(e.response?.data?.detail || "Review failed"); }
    };

    const riskBadge = (score) => {
        if (score > 80) return 'CRITICAL';
        if (score > 60) return 'HIGH';
        if (score > 40) return 'MEDIUM';
        return 'LOW';
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!devMsg.trim()) return;
        try {
            await API.post('/dev/message', { target_id: targetUser, message: devMsg }, { headers: { Authorization: token } });
            setDevMsg('');
        } catch (e) { alert(e.response?.data?.detail || "Send failed"); }
    };

    const handleWipeData = async () => {
        if (!window.confirm("Are you absolutely sure you want to wipe ALL transactional and alert data? This action is irreversible.")) return;
        try {
            await API.delete('/admin/clear-ledger', { headers: { Authorization: token } });
            alert("Data wipe initiated successfully.");
            if (typeof setStats === 'function') setStats(prev => ({ ...prev, total_transactions: 0, pending: 0 }));
            setPending([]);
            setHistory([]);
            setMessages([]);
        } catch (e) { alert(e.response?.data?.detail || "Data wipe failed"); }
    };

    const handleClearComms = async () => {
        if (!window.confirm("Broadcast wipe? This will clear your personal dev inbox.")) return;
        try {
            await API.delete('/dev/messages/clear', { headers: { Authorization: token } });
            setMessages([]);
        } catch (e) { alert(e.response?.data?.detail || "Clear failed"); }
    };

    const themeClass = darkMode ? 'terminal-dark' : 'terminal-light';
    const accentColor = darkMode ? '#10b981' : '#059669'; // Emerald 500 / 600

    return (
        <div className={`card rounded-3xl overflow-hidden border-none shadow-2xl transition-all duration-500 ${themeClass}`} style={{ boxShadow: darkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
            <div className={`flex justify-between items-center py-2 px-6 transition-colors ${darkMode ? 'bg-[#0f172a] border-b border-white/5' : 'bg-slate-200 border-b border-slate-300'}`}>
                <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="h-4 w-[1px] bg-slate-500/20 mx-1" />
                    <div className="flex items-center gap-2">
                        <div style={{ color: accentColor }} className="opacity-80"><Cpu size={14} /></div>
                        <h3 className={`font-mono font-bold uppercase tracking-[0.1em] text-[10px] ${darkMode ? 'text-emerald-400/80' : 'text-slate-600'}`}>DevOps::SecureShell_V4.5</h3>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className={`p-1.5 rounded-lg transition-all ${darkMode ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-600 hover:bg-slate-300'}`}
                        title="Toggle Console Theme"
                    >
                        {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    <button onClick={onLogout} className="text-red-500/80 hover:text-red-500 transition-colors p-1" title="Kill Session"><X size={16} /></button>
                </div>
            </div>

            <div className={`flex items-center px-4 transition-colors ${darkMode ? 'bg-black/20 border-b border-white/5' : 'bg-slate-50 border-b border-slate-200'}`}>
                {['overview', 'pending', 'comms', 'users', 'ai', 'wipe'].map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-6 py-3 text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all relative group ${activeTab === t ? (darkMode ? 'text-emerald-400' : 'text-slate-900') : (darkMode ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')}`}
                    >
                        {t}
                        {activeTab === t && (
                            <motion.div
                                layoutId="activeTab"
                                className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full ${darkMode ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-900'}`}
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className={`card-body min-h-[500px] p-6 font-mono text-xs relative transition-colors ${darkMode ? 'bg-black text-emerald-500' : 'bg-white text-slate-800'}`}>
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'border-emerald-500/10 bg-black/40 hover:border-emerald-500/30' : 'bg-slate-50 border-slate-200'}`}>
                                <span className="block text-[10px] opacity-40 uppercase font-black mb-1">Total_Transactions</span>
                                <span className={`text-2xl font-black ${darkMode ? 'text-emerald-400' : 'text-slate-900'}`}>{stats?.total_transactions || 0}</span>
                            </div>
                            <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'border-orange-500/10 bg-orange-950/10 hover:border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                                <span className={`block text-[10px] uppercase font-black mb-1 ${darkMode ? 'text-orange-500/70' : 'text-orange-600/70'}`}>Queue_Pending</span>
                                <span className={`text-2xl font-black ${darkMode ? 'text-orange-500' : 'text-orange-600'}`}>{stats?.pending || 0}</span>
                            </div>
                        </div>
                        <div className="space-y-2 py-4 border-t border-white/5 mt-4">
                            <div className="text-[9px] opacity-30 font-black uppercase tracking-[0.2em] mb-2">Systems_Status_Matrix</div>
                            {['Kernel', 'FX_Service', 'Biometrics', 'DB_Socket'].map(s => (
                                <div key={s} className="flex justify-between items-center text-[10px] font-mono group">
                                    <span className="opacity-40 group-hover:opacity-100 transition-opacity">{s}::CORE_LINK</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span style={{ color: accentColor }} className="font-bold">ACTIVE</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="space-y-3 animate-in-up">
                        {pending.length === 0 ? (
                            <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                                <Clock size={32} />
                                <div className="text-[10px] tracking-[0.4em] font-black uppercase">SYSTEM_IDLE::QUEUE_EMPTY</div>
                            </div>
                        ) : (
                            pending.map(t => (
                                <div key={t.id} className={`p-5 rounded-2xl border transition-all group relative overflow-hidden ${darkMode ? 'border-emerald-500/10 bg-black/40 hover:border-emerald-500/30' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -mr-12 -mt-12" />
                                    <div className="flex justify-between text-[8px] mb-4 font-black">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-sm ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-white'} uppercase tracking-widest`}>TXN_ID_{t.id}</span>
                                            <span className="opacity-40 uppercase">{t.location}</span>
                                        </div>
                                        <span className="opacity-40">{new Date(t.time).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.amount.toLocaleString()} {t.base_currency} <span className="opacity-20 mx-1">{'>'}</span> <span className="text-emerald-500">{t.target_currency}</span></div>
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${t.risk_score > 70 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{t.risk_level}</div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => review(t.id, 'approve')} className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-black' : 'border-slate-800 text-slate-800 hover:bg-slate-900 hover:text-white'}`}>Validate & Approve</button>
                                        <button onClick={() => review(t.id, 'deny')} className="flex-1 py-2.5 rounded-xl border border-red-500/50 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Deny Request</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'comms' && (
                    <div className="space-y-6 animate-in-up">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] opacity-40 uppercase font-black tracking-[0.2em]">Secure_Data_Packets</span>
                            </div>
                            <button onClick={handleClearComms} className="text-[9px] text-red-500/70 hover:text-red-500 font-bold uppercase underline tracking-tighter transition-colors">[ PURGE_ALL ]</button>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-emerald-500/20">
                            {messages.length === 0 ? (
                                <div className="text-center py-16 opacity-10 uppercase tracking-[0.3em] text-[9px] font-black italic">Passive_Listening_Node_Online</div>
                            ) : (
                                messages.map(m => (
                                    <div key={m.id} className={`p-4 rounded-xl border group relative transition-all ${m.type === 'security_incident' ? 'bg-red-950/20 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]' : (darkMode ? 'bg-black/40 border-white/5 hover:border-emerald-500/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}>
                                        <div className="flex justify-between text-[7px] mb-3 font-black">
                                            <span className={`${m.type === 'security_incident' ? 'text-red-500' : (darkMode ? 'text-emerald-500/80' : 'text-slate-600')} uppercase tracking-[0.2em]`}>
                                                {m.type === 'security_incident' ? 'Critical Security Fault' : `Packet_Src::UID_${m.from_username || 'SYSTEM_CORE'}`}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="opacity-30">{new Date(m.time).toLocaleTimeString()}</span>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm("Drop packet?")) {
                                                            API.delete(`/alerts/${m.id}`, { headers: { Authorization: token } })
                                                                .then(() => setMessages(prev => prev.filter(x => x.id !== m.id)))
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all font-mono scale-90"
                                                >
                                                    [PURGE]
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`text-[11px] leading-relaxed font-medium ${darkMode ? 'text-white/80' : 'text-slate-800'}`}>{m.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="h-[1px] bg-white/5 mt-6 mb-4" />
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div className="text-[9px] opacity-20 uppercase font-black tracking-widest">Global_Command_Broadcast</div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={targetUser}
                                    onChange={e => setTargetUser(e.target.value)}
                                    className={`border p-3 rounded-xl text-[10px] font-bold outline-none transition-all min-w-[140px] ${darkMode ? 'bg-black border-white/10 text-emerald-400 focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-800 focus:border-slate-900'}`}
                                >
                                    <option value="0">BROADCAST_ALL</option>
                                    {users.filter(u => u.role !== 'dev').map(u => (
                                        <option key={u.id} value={u.id}>UID_{u.id}: {u.username}</option>
                                    ))}
                                </select>
                                <div className="flex flex-1 gap-2">
                                    <input
                                        type="text"
                                        value={devMsg}
                                        onChange={e => setDevMsg(e.target.value)}
                                        placeholder="ENCODE_MESSAGE_FOR_TRANSMISSION..."
                                        className={`flex-1 border p-3 rounded-xl text-[10px] font-bold outline-none transition-all ${darkMode ? 'bg-black border-white/10 text-emerald-400 focus:border-emerald-500 placeholder:text-white/10' : 'bg-white border-slate-300 text-slate-800 focus:border-slate-900'}`}
                                    />
                                    <button type="submit" className={`px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${darkMode ? 'bg-emerald-500 text-black hover:bg-white shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>Push</button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-in-up space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] opacity-40 uppercase font-black tracking-[0.2em]">Identity_Registry</span>
                            </div>
                            <span className="text-[9px] opacity-20 font-mono">{users.length} accounts loaded</span>
                        </div>
                        {users.length === 0 ? (
                            <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                                <Eye size={32} />
                                <div className="text-[10px] tracking-[0.4em] font-black uppercase">LOADING_USER_REGISTRY...</div>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {users.map(u => (
                                    <div key={u.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${darkMode ? 'border-white/5 bg-black/40 hover:border-emerald-500/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase ${u.role === 'dev' ? 'bg-emerald-500/20 text-emerald-400' : u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {u.username?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>{u.username}</div>
                                                <div className="text-[9px] opacity-40 font-mono uppercase">{u.role} • UID_{u.id}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${u.is_blocked ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                                                {u.is_blocked ? 'LOCKED' : 'ACTIVE'}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => {
                                                    const msg = window.prompt("Direct message:");
                                                    if (msg) API.post('/admin/alerts', { user_id: u.id, message: msg, type: 'info' }, { headers: { Authorization: token } });
                                                }} className="p-1 hover:text-emerald-400 transition-colors" title="Message"><Send size={12} /></button>
                                                <button onClick={async () => {
                                                    try { await API.patch(`/admin/users/${u.id}/block`, {}, { headers: { Authorization: token } }); const resp = await API.get('/admin/users', { headers: { Authorization: token } }); setUsers(resp.data); } catch (e) { console.error(e); }
                                                }} className="p-1 hover:text-orange-400 transition-colors" title={u.is_blocked ? "Unblock" : "Block"}><Lock size={12} className={u.is_blocked ? "text-red-500" : ""} /></button>
                                                {u.role !== 'dev' && (
                                                    <button onClick={async () => {
                                                        if (!window.confirm(u.role === 'admin' ? "Demote?" : "Promote?")) return;
                                                        try { await API.patch(`/admin/users/${u.id}/role`, {}, { headers: { Authorization: token } }); const resp = await API.get('/admin/users', { headers: { Authorization: token } }); setUsers(resp.data); } catch (e) { alert(e.response?.data?.detail || "Failed"); }
                                                    }} className={`p-1 hover:text-purple-500 transition-colors ${u.role === 'admin' ? 'text-purple-400' : 'opacity-40'}`} title={u.role === 'admin' ? "Demote" : "Promote"}><Shield size={12} /></button>
                                                )}
                                                {u.role !== 'dev' && (
                                                    <button onClick={async () => {
                                                        if (!window.confirm("Delete account?")) return;
                                                        try { await API.delete(`/admin/users/${u.id}`, { headers: { Authorization: token } }); const resp = await API.get('/admin/users', { headers: { Authorization: token } }); setUsers(resp.data); } catch (e) { console.error(e); }
                                                    }} className="p-1 hover:text-red-500 transition-colors"><X size={12} /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'ai' && (
                    <div className="animate-in-up h-full overflow-y-auto" style={{ minHeight: '450px' }}>
                        <AIAdvisor user={user} token={token} forceDarkMode={true} />
                    </div>
                )}

                {activeTab === 'wipe' && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6 animate-in">
                        <div className="text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] bg-red-500/10 p-4 rounded-full"><Zap size={48} /></div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-[0.2em] mb-2 font-mono">NUCLEAR_PURGE_PROTOCOL</h4>
                            <p className="text-[10px] opacity-60 px-8 font-mono">This command will initiate a full database wipe for transactions and alerts. Proceed with extreme caution.</p>
                        </div>
                        <button onClick={handleWipeData} className="px-10 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] border border-red-400/30 transition-all hover:scale-105">EXECUTE_WIPE</button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─────────── WHATSAPP-STYLE CHAT INTERFACE ─────────── */
const ChatInterface = ({ user, token, messages, setMessages }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedPeer, setSelectedPeer] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const chatEndRef = useRef(null);

    const fetchConversations = async () => {
        try {
            const resp = await API.get('/chat/conversations', { headers: { Authorization: token } });
            setConversations(resp.data);
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async (peerId) => {
        try {
            const resp = await API.get(`/chat/history/${peerId}`, { headers: { Authorization: token } });
            setChatHistory(resp.data);
        } catch (e) { console.error(e); }
    };

    const fetchAllUsers = async () => {
        try {
            const resp = await API.get('/admin/users', { headers: { Authorization: token } });
            setAllUsers(resp.data.filter(u => u.id !== user.id));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchConversations();
        fetchAllUsers();
    }, []);

    useEffect(() => {
        if (selectedPeer) {
            fetchHistory(selectedPeer.id);
        }
    }, [selectedPeer]);

    // Handle incoming real-time messages
    useEffect(() => {
        const latest = messages[0];
        if (latest && latest.type === 'chat') {
            // If it's for the current chat, add to history
            if (selectedPeer && (latest.from_user_id === selectedPeer.id || latest.from_user_id === user.id)) {
                setChatHistory(prev => {
                    if (prev.find(m => m.id === latest.id)) return prev;
                    return [...prev, latest].sort((a, b) => new Date(a.time) - new Date(b.time));
                });
            }
            // Refresh conversation list
            fetchConversations();
        }
    }, [messages, selectedPeer]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedPeer || isSending) return;
        setIsSending(true);
        try {
            await API.post('/chat/send', { peer_id: selectedPeer.id, message: newMessage }, { headers: { Authorization: token } });
            setNewMessage('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[600px] md:h-[600px] h-[calc(100vh-150px)] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] animate-in-up">
            {/* Conversation List */}
            <div className={`md:w-1/3 border-r border-[var(--border)] flex-col bg-slate-50 dark:bg-black/20 ${selectedPeer ? 'hidden md:flex' : 'flex flex-1'}`}>
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-40">Conversations</h3>
                    <button onClick={() => setShowUserSearch(!showUserSearch)} className="p-2 hover:bg-white dark:hover:bg-white/5 rounded-lg transition-all text-blue-500">
                        <UserPlus size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {showUserSearch && (
                        <div className="p-2 bg-blue-500/5 animate-in">
                            <p className="text-[9px] uppercase font-bold opacity-30 px-2 mb-2">New Message</p>
                            {allUsers.map(u => (
                                <div key={u.id}
                                    onClick={() => { setSelectedPeer(u); setShowUserSearch(false); }}
                                    className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-white/5 rounded-xl cursor-pointer transition-all">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500">
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-[11px] font-bold">{u.username}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {conversations.length === 0 && !showUserSearch ? (
                        <div className="text-center py-12 opacity-20 text-[10px] uppercase font-bold italic">No active threads</div>
                    ) : (
                        conversations.map(c => (
                            <div key={c.id}
                                onClick={() => setSelectedPeer(c)}
                                className={`flex items-center gap-3 p-4 border-b border-[var(--border)] cursor-pointer transition-all ${selectedPeer?.id === c.id ? 'bg-white dark:bg-white/5 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-white/2'}`}>
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-500">
                                    {c.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-xs font-bold truncate">{c.username}</span>
                                        <span className="text-[8px] opacity-30 font-mono tracking-tighter uppercase">{c.role}</span>
                                    </div>
                                    <div className="text-[10px] opacity-40 truncate">Identity Verified_Secure</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Pane */}
            <div className={`md:flex-1 flex-col bg-[var(--bg-primary)] ${!selectedPeer ? 'hidden md:flex' : 'flex flex-1'}`}>
                {selectedPeer ? (
                    <>
                        <div className="p-4 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--glass)] backdrop-blur-md">
                            <button onClick={() => setSelectedPeer(null)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                                <ChevronRight className="rotate-180" size={16} />
                            </button>
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                                {selectedPeer.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-xs font-bold">{selectedPeer.username}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] opacity-50 uppercase font-black tracking-widest">Encrypted_Link_Active</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-blue-500/10">
                            {chatHistory.map((m, i) => {
                                const isMe = m.from_user_id === user.id;
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in`}>
                                        <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm border ${isMe ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-50 dark:bg-white/5 border-[var(--border)]'}`}>
                                            <p className="text-[11px] leading-relaxed mb-1">{m.message}</p>
                                            <div className={`text-[7px] text-right font-mono ${isMe ? 'text-blue-200' : 'opacity-30 uppercase'}`}>
                                                {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] bg-[var(--bg-primary)]">
                            <div className="flex gap-3 bg-slate-50 dark:bg-black/20 p-2 rounded-2xl border border-[var(--border)] focus-within:border-blue-500/50 transition-all">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none outline-none text-xs p-2 font-medium"
                                />
                                <button type="submit" disabled={!newMessage.trim() || isSending}
                                    className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30 gap-6">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                            <Shield size={40} className="text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-[0.3em] mb-2">Secure Message Gateway</h4>
                            <p className="text-[10px] max-w-xs mx-auto leading-relaxed">Select a contact or initiate a new secure bridge to exchange end-to-end encrypted packet data.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


/* ─────────── REPORT ISSUE COMPONENT ─────────── */
const ReportForm = ({ user, token }) => {
    const [reportText, setReportText] = useState('');
    const [status, setStatus] = useState('idle'); // idle, sending, success, error

    const handleReport = async (e) => {
        e.preventDefault();
        if (!reportText.trim()) return;
        setStatus('sending');

        try {
            await API.post('/user/message', { message: reportText }, { headers: { Authorization: token } });
            setStatus('success');
            setReportText('');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e) {
            console.error(e);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 mb-4">
                Use this secure channel to report bugs, anomalies, or compliance violations directly to the DevOps Kernel.
                Reports are encrypted and logged instantly.
            </p>
            <form onSubmit={handleReport} className="space-y-3">
                <textarea
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none resize-none h-24"
                    placeholder="Describe the issue in detail..."
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    disabled={status === 'sending' || status === 'success'}
                />
                <div className="flex justify-between items-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {status === 'success' && <span className="text-emerald-500">✔ Report Transmitted Successfully</span>}
                        {status === 'error' && <span className="text-red-500">❌ Transmission Failed</span>}
                        {status === 'sending' && <span className="text-blue-500 animate-pulse">Transmitting...</span>}
                    </div>
                    <button
                        type="submit"
                        disabled={!reportText.trim() || status === 'sending' || status === 'success'}
                        className="btn-primary flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                        {status === 'sending' ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
                        Submit Report
                    </button>
                </div>
            </form>
        </div>
    );
};

const UserManagement = ({ token, user }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            console.log("Synchronizing User Governance Registry...");
            const resp = await API.get('/admin/users', { headers: { Authorization: token } });
            setUsers(Array.isArray(resp.data) ? resp.data : []);
            setLoading(false);
        } catch (e) {
            console.error("Governance Sync Failure:", e);
            setLoading(false); // Release loading state even on error to prevent hang
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleBlock = async (id) => {
        try {
            await API.patch(`/admin/users/${id}/block`, {}, { headers: { Authorization: token } });
            fetchUsers();
        } catch (e) { console.error(e); }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Delete this user account permanently?")) return;
        try {
            await API.delete(`/admin/users/${id}`, { headers: { Authorization: token } });
            fetchUsers();
        } catch (e) { console.error(e); }
    };

    const toggleRole = async (id, role) => {
        if (role === 'admin' && !window.confirm("Demote this admin to user?")) return;
        if (role === 'user' && !window.confirm("Promote this user to admin?")) return;
        try {
            await API.patch(`/admin/users/${id}/role`, {}, { headers: { Authorization: token } });
            fetchUsers();
        } catch (e) { alert(e.response?.data?.detail || "Action failed"); }
    };

    if (loading) return <div className="p-12 text-center opacity-40">Accessing User Registry...</div>;

    return (
        <div className="animate-in-up">
            <div className="card">
                <div className="card-header flex justify-between items-center">
                    <h3>Account Governance</h3>
                    <div className="tag">Active Directory</div>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="provider-table w-full" style={{ minWidth: '800px' }}>
                            <thead><tr><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="font-bold">{u.username}</td>
                                        <td className="uppercase text-[10px] opacity-60 font-bold">{u.role}</td>
                                        <td>
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${u.is_blocked ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                {u.is_blocked ? 'LOCKED' : 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button onClick={() => {
                                                    const msg = window.prompt("Enter direct message to send to user:");
                                                    if (msg) API.post('/admin/alerts', { user_id: u.id, message: msg, type: 'info' }, { headers: { Authorization: token } });
                                                }} className="p-1 hover:text-emerald-400 transition-colors" title="Send Direct Message">
                                                    <Send size={14} />
                                                </button>
                                                <button onClick={() => {
                                                    const msg = window.prompt("Enter threat notification message:");
                                                    if (msg) API.post('/admin/alerts', { user_id: u.id, message: msg, type: 'threat' }, { headers: { Authorization: token } });
                                                }} className="p-1 hover:text-blue-400 transition-colors" title="Send Alert">
                                                    <Zap size={14} />
                                                </button>
                                                <button onClick={() => toggleBlock(u.id)} className="p-1 hover:text-orange-400 transition-colors" title={u.is_blocked ? "Unblock" : "Block"}>
                                                    <Lock size={14} className={u.is_blocked ? "text-red-500" : ""} />
                                                </button>
                                                {u.role !== 'dev' && (
                                                    <button onClick={() => toggleRole(u.id, u.role)} className={`p-1 hover:text-purple-500 transition-colors ${u.role === 'admin' ? 'text-purple-400' : 'opacity-40 hover:opacity-100'}`} title={u.role === 'admin' ? "Demote Admin" : "Promote to Admin"}>
                                                        <Shield size={14} />
                                                    </button>
                                                )}
                                                {u.role !== 'dev' && (
                                                    <button onClick={() => deleteUser(u.id)} className="p-1 hover:text-red-500 transition-colors" title="Delete Account">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default App;
