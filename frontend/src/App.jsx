import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useBiometrics } from './hooks/useBiometrics';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Filler,
} from 'chart.js';
import {
    Shield, TrendingUp, Clock, DollarSign, Activity, Zap, MapPin, Globe,
    Building, BarChart3, ShieldCheck, FileWarning, Lock,
    Eye, Layers, Send, Cpu, History, Settings, MessageSquare,
    Keyboard, MousePointer, Smartphone, Info, Menu, X,
    Loader, Download, ArrowRight, Trash, Trash2
} from 'lucide-react';

const API = axios.create({
    baseURL: 'https://secure-payai.onrender.com',
    headers: { 'Bypass-Tunnel-Reminder': 'true' }
});

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

/* ─────────── MAIN APP ─────────── */
const App = () => {
    const [txnData, setTxnData] = useState({ amount: 25000, base_currency: 'USD', target_currency: 'EUR', priority: 'balanced' });
    const [currencies, setCurrencies] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fraudMode, setFraudMode] = useState(false);
    const [activeNav, setActiveNav] = useState('optimizer');
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [messages, setMessages] = useState([]);

    const [isExecuting, setIsExecuting] = useState(false);
    const [settlementReceipt, setSettlementReceipt] = useState(null);

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
        const host = API.defaults.baseURL.replace('http://', '').replace('https://', '');
        const ws = new WebSocket(`${protocol}//${host}/ws/${token}`);

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
            const userData = { role: resp.data.role, name: resp.data.name, id: resp.data.id, region: resp.data.region, preference: resp.data.preference };
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
            case 'admin_messages': return <AdminMessages user={user} token={token} messages={messages} setMessages={setMessages} />;
            case 'users': return <UserManagement token={token} user={user} />;
            case 'alerts': return <AlertList token={token} user={user} messages={messages} setMessages={setMessages} />;
            default: return renderOptimizer();
        }
    };

    const navSections = [
        { title: 'Engines', items: [{ id: 'optimizer', icon: <Cpu size={16} />, label: 'Optimizer' }, { id: 'risk', icon: <ShieldCheck size={16} />, label: 'Security' }, { id: 'rates', icon: <TrendingUp size={16} />, label: 'FX Intel' }] },
        { title: 'Analytics', items: [{ id: 'providers', icon: <BarChart3 size={16} />, label: 'Banks Directory' }, { id: 'corridors', icon: <Layers size={16} />, label: 'Protocols' }, { id: 'aml', icon: <FileWarning size={16} />, label: 'Compliance' }] },
        {
            title: 'Governance', items: [
                { id: 'admin_stats', icon: <Activity size={16} />, label: 'Admin Insight', adminOnly: true },
                { id: 'admin_messages', icon: <Send size={16} />, label: 'User Messages', adminOnly: true },
                { id: 'users', icon: <Settings size={16} />, label: 'User Management', adminOnly: true },
                { id: 'alerts', icon: <Zap size={16} />, label: 'Inbox & Broadcasts' }
            ]
        },
        { title: 'Audit Log', items: [{ id: 'history', icon: <History size={16} />, label: 'Audit Ledger' }, { id: 'bioprofile', icon: <Eye size={16} />, label: 'Identity' }, { id: 'security', icon: <Settings size={16} />, label: 'Policy' }] },
    ];
    const handleNav = (id) => {
        setActiveNav(id);
        setSidebarOpen(false);
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
                        <h2>{isRegistering ? 'Create Profile' : 'SecurePay AI v4.0'}</h2>
                        <p>{isRegistering ? 'Enroll in the Governance Portal' : 'Identity & Risk Governance Portal'}</p>
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
                        {authError && <div className="auth-error">{authError}</div>}
                        <button type="submit" className="login-btn mb-4" onClick={(e) => { e.preventDefault(); isRegistering ? handleRegister(e) : handleLogin(e); }}>
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
        return <DevConsole user={user} token={token} onLogout={handleLogout} />;
    }

    return (
        <div className="app-layout">
            <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon"><Shield size={20} /></div>
                    <h1>SecurePay AI</h1>
                </div>

                <div className="px-6 py-4 mb-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <div className="text-[10px] uppercase opacity-40 font-bold mb-1">Session ID</div>
                        <div className="text-xs font-mono opacity-60 truncate">{token.slice(0, 12)}...</div>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900">{user.name}</div>
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
                                // Admin only filter
                                if (n.adminOnly && user.role !== 'admin') return null;
                                return (
                                    <div key={n.id} className={`nav-item ${activeNav === n.id ? 'active' : ''}`} onClick={() => handleNav(n.id)}>
                                        {n.icon} {n.label}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                    <div className="mt-auto px-6 py-8 border-t border-[var(--border)]">
                        <div className="mb-4">
                            <div className="text-[10px] uppercase opacity-40 font-bold mb-2 tracking-widest">Architect</div>
                            <div className="text-sm font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Pramodh Raja(XI-B)</div>
                        </div>
                        <button className="flex items-center gap-2 text-xs opacity-40 hover:opacity-100 transition-all text-red-500" onClick={handleLogout}>
                            <X size={14} /> System Logout
                        </button>
                    </div>
                </nav>
            </aside>
            <main className="main-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <button type="button" className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={24} /></button>
                        <div>
                            <h2 className="text-3xl font-black">{meta.title}</h2>
                            <p className="font-semibold opacity-70">{meta.desc}</p>
                        </div>
                    </div>
                    <div className="header-actions">
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
            </main>
        </div>
    );
};

/* ─────────── DEV CONSOLE ─────────── */
const DevConsole = ({ user, token, onLogout, messages, setMessages }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [pending, setPending] = useState([]);
    const [devMsg, setDevMsg] = useState('');
    const [targetUser, setTargetUser] = useState('0'); // 0 for all users (broadcast)
    const [users, setUsers] = useState([]); // For user list in broadcast

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsResp, pendingResp, messagesResp, usersResp] = await Promise.all([
                    API.get('/dev/stats', { headers: { Authorization: token } }),
                    API.get('/dev/pending', { headers: { Authorization: token } }),
                    API.get('/dev/messages', { headers: { Authorization: token } }),
                    API.get('/admin/users', { headers: { Authorization: token } }) // Fetch all users for broadcast
                ]);
                setStats(statsResp.data);
                setPending(pendingResp.data);
                setMessages(messagesResp.data);
                setUsers(usersResp.data);
            } catch (e) { console.error("Failed to fetch dev data:", e); }
        };
        fetchData();
    }, [token]);

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
            await API.delete('/dev/wipe', { headers: { Authorization: token } });
            alert("Data wipe initiated successfully.");
            setStats(prev => ({ ...prev, total_transactions: 0, pending: 0 }));
            setPending([]);
        } catch (e) { alert(e.response?.data?.detail || "Data wipe failed"); }
    };

    const handleClearComms = async () => {
        if (!window.confirm("Broadcast wipe? This will clear your personal dev inbox.")) return;
        try {
            await API.delete('/dev/messages/clear', { headers: { Authorization: token } });
            setMessages([]);
        } catch (e) { alert(e.response?.data?.detail || "Clear failed"); }
    };

    return (
        <div className="card border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-500/10">
            <div className="card-header bg-slate-900 border-b border-blue-500/20 flex justify-between items-center py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2 rounded-lg text-white shadow-lg shadow-blue-500/30"><Cpu size={18} /></div>
                    <div>
                        <h3 className="text-white font-black tracking-tight">Security Terminal</h3>
                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest opacity-70">DevOps Workspace</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">API V4.5_STABLE</span>
                    </div>
                    <button onClick={onLogout} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Kill Session"><X size={18} /></button>
                </div>
            </div>

            <div className="p-1 bg-slate-800/50 flex border-b border-blue-500/10">
                {['overview', 'pending', 'comms', 'wipe'].map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'text-white bg-blue-600 shadow-inner' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="card-body bg-slate-950 min-h-[500px] p-6 text-slate-300 font-mono text-sm relative">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="stats-mini border-slate-800 bg-slate-900/50">
                                <span className="label">Total TXNs</span>
                                <span className="value text-white">{stats?.total_transactions || 0}</span>
                            </div>
                            <div className="stats-mini border-slate-800 bg-slate-900/50">
                                <span className="label">Pending</span>
                                <span className="value text-amber-400">{stats?.pending || 0}</span>
                            </div>
                        </div>
                        <div className="space-y-2 border-l-2 border-slate-800 pl-4 py-1">
                            {['Kernel', 'FX Service', 'Biometrics', 'DB_Sync'].map(s => (
                                <div key={s} className="flex justify-between items-center text-[10px]">
                                    <span className="opacity-50">{s}::Status</span>
                                    <span className="text-emerald-500 font-bold">READY</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="space-y-4 animate-in">
                        {pending.length === 0 ? (
                            <div className="text-center py-20 opacity-20">NO PENDING_TXNS IN BUFFER</div>
                        ) : (
                            pending.map(t => (
                                <div key={t.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/30 transition-all">
                                    <div className="flex justify-between text-[11px] mb-3">
                                        <span className="text-blue-400">TXN_{t.id}</span>
                                        <span className="opacity-50">{new Date(t.time).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-xl font-bold text-white mb-2">{t.amount} {t.base_currency}</div>
                                    <div className="text-xs space-y-1 mb-4 opacity-70">
                                        <div>GEO: {t.location}</div>
                                        <div>LEVEL: {riskBadge(t.risk_score)} {t.risk_level} ({t.risk_score})</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => review(t.id, 'approve')} className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg">Approve</button>
                                        <button onClick={() => review(t.id, 'deny')} className="flex-1 py-2 bg-red-600 text-white text-[10px] font-bold uppercase rounded-lg">Deny</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'comms' && (
                    <div className="space-y-4 animate-in">
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                            <span className="text-[10px] opacity-40 uppercase font-black tracking-widest">Inbound Directives</span>
                            <button onClick={handleClearComms} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase underline">Clear Terminal</button>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                            {messages.length === 0 ? (
                                <div className="text-center py-10 opacity-20">NO_INBOUND_COMMS</div>
                            ) : (
                                messages.map(m => (
                                    <div key={m.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl group relative">
                                        <div className="flex justify-between text-[9px] mb-1">
                                            <span className="text-blue-400 font-bold uppercase tracking-tighter">Sender: {m.from_username || 'SYSTEM'}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="opacity-40">{new Date(m.time).toLocaleTimeString()}</span>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm("Delete this log entry?")) {
                                                            API.delete(`/alerts/${m.id}`, { headers: { Authorization: token } })
                                                                .then(() => setMessages(prev => prev.filter(x => x.id !== m.id)))
                                                                .catch(e => alert(e.response?.data?.detail || "Delete failed"));
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[11px] opacity-70 leading-tight">{m.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="h-[1px] bg-slate-800 mt-6 mb-4" />
                        <form onSubmit={handleSendMessage} className="space-y-3">
                            <div className="text-[10px] opacity-40 uppercase font-black tracking-widest">Transmit Protocol</div>
                            <div className="flex gap-2">
                                <select
                                    value={targetUser}
                                    onChange={e => setTargetUser(e.target.value)}
                                    className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs outline-none focus:border-blue-500"
                                >
                                    <option value="0">ALL_USERS (BROADCAST)</option>
                                    {users.filter(u => u.role !== 'dev').map(u => (
                                        <option key={u.id} value={u.id}>UID_{u.id}: {u.username}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={devMsg}
                                    onChange={e => setDevMsg(e.target.value)}
                                    placeholder="COMMAND_PACKET_STRING..."
                                    className="flex-1 bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs outline-none focus:border-blue-500"
                                />
                                <button type="submit" className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-500 transition-colors"><Send size={14} /></button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'wipe' && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6 animate-in">
                        <div className="text-red-500 animate-pulse"><Zap size={48} /></div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest mb-2">Nuclear Protocol</h4>
                            <p className="text-[10px] opacity-50 px-8">Executing this will wipe all Transactional and Alert logs from the primary DB cluster. Users and roles are preserved.</p>
                        </div>
                        <button onClick={handleWipeData} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-tighter rounded-full shadow-lg shadow-red-900/40 transition-all hover:scale-105 active:scale-95">Wipe Data Clusters</button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─────────── ALERT / INBOX SYSTEM ─────────── */
const AlertList = ({ user, token, messages, setMessages }) => {
    return (
        <div className="animate-in-up space-y-6">
            <div className="card">
                <div className="card-header flex justify-between items-center">
                    <h3>Secure Support Chat</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Live with Support
                    </div>
                </div>
                <div className="card-body">
                    <ChatInterface user={user} token={token} messages={messages} setMessages={setMessages} isAdmin={false} />
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>Security Broadcasts</h3></div>
                <div className="card-body">
                    {messages.filter(m => m.type === 'info').length === 0 ? (
                        <div className="text-center py-12 opacity-30"><Shield size={40} className="mx-auto mb-4" />No security alerts at this time.</div>
                    ) : (
                        <div className="space-y-4">
                            {messages.filter(m => m.type === 'info').map((m, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-slate-400">{new Date(m.time).toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm font-medium">{m.message}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─────────── ADMIN MESSAGE INBOX ─────────── */
const AdminMessages = ({ user, token, messages, setMessages }) => {
    return (
        <div className="animate-in-up">
            <div className="page-header">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-lg text-white shadow-lg shadow-emerald-500/30"><MessageSquare size={18} /></div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tight">Support Hub</h3>
                        <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest opacity-70">Real-time User Inquiries</div>
                    </div>
                </div>
            </div>
            <ChatInterface user={user} token={token} messages={messages} setMessages={setMessages} isAdmin={true} />
        </div>
    );
};
/* ─────────── CHAT INTERFACE ─────────── */
const ChatInterface = ({ user, token, messages, setMessages, isAdmin = false }) => {
    const [msgText, setMsgText] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isAdmin) {
            API.get('/dev/users', { headers: { Authorization: token } })
                .then(res => setAllUsers(res.data.filter(u => u.role !== 'admin')))
                .catch(console.error);
        }
    }, [isAdmin, token]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!msgText.trim()) return;
        if (isAdmin && !selectedUser) return;

        try {
            const payload = isAdmin
                ? { user_id: selectedUser.id, message: msgText }
                : { message: msgText };

            const endpoint = isAdmin ? '/admin/alerts' : '/user/message';
            await API.post(endpoint, payload, { headers: { Authorization: token } });

            // Add to local state immediately for better UX
            const newMsg = {
                id: Date.now(),
                from_username: user.username,
                message: msgText,
                time: new Date().toISOString(),
                user_id: isAdmin ? selectedUser.id : user.id,
                from_user_id: user.id
            };
            setMessages(prev => [newMsg, ...prev]);
            setMsgText('');
        } catch (e) { console.error(e); }
    };

    const filteredMessages = isAdmin
        ? messages.filter(m => m.user_id === selectedUser?.id || m.from_user_id === selectedUser?.id)
        : messages;

    return (
        <div className="chat-container">
            {isAdmin && (
                <div className="chat-sidebar">
                    <div className="p-4 font-bold border-bottom text-slate-500 text-[10px] uppercase tracking-wider">Conversations</div>
                    <div className="overflow-y-auto flex-1">
                        {allUsers.map(u => (
                            <div
                                key={u.id}
                                className={`chat-user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                                onClick={() => setSelectedUser(u)}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">
                                    {u.username[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-width-0">
                                    <div className="font-bold text-sm truncate">{u.username}</div>
                                    <div className="text-[10px] text-slate-400">Secure Line Active</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="chat-main">
                <div className="chat-messages">
                    {isAdmin && !selectedUser ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                            Select a user to begin transmission
                        </div>
                    ) : (
                        <>
                            {filteredMessages.slice().reverse().map((m, i) => (
                                <div key={m.id || i} className={`message-bubble ${m.from_username === user.username ? 'message-sent' : 'message-received'}`}>
                                    <div>{m.message}</div>
                                    <span className="message-time">{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {(!isAdmin || selectedUser) && (
                    <form onSubmit={handleSend} className="chat-input-area">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={msgText}
                            onChange={(e) => setMsgText(e.target.value)}
                        />
                        <button type="submit" className="chat-send-btn">
                            <Send size={18} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const UserManagement = ({ token, user }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const resp = await API.get('/admin/users', { headers: { Authorization: token } });
            setUsers(resp.data);
            setLoading(false);
        } catch (e) { console.error(e); }
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
                                                {u.role !== 'dev' && (user?.role === 'dev' || u.role === 'user' || user?.id === u.id) && (
                                                    <button onClick={() => deleteUser(u.id)} className="p-1 hover:text-red-500 transition-colors">
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
