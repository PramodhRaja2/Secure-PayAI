import React, { useState, useEffect } from 'react';
import InteractiveGlobe from './InteractiveGlobe';
import { GLOBAL_CITIES } from './citiesData';

// Map currency codes to their main financial hub city IDs
const CURRENCY_TO_CITY = {
    'USD': 'NYC', 'EUR': 'FRA', 'GBP': 'LDN', 'INR': 'MUM',
    'JPY': 'TOK', 'AED': 'DXB', 'NGN': 'LOS'
};

const ThreatMap = ({ transactions, optimizerRoute, miniMode, userRole, token }) => {
    const [latest, setLatest] = useState(null);
    const [simMode, setSimMode] = useState(false);
    const [simSourceId, setSimSourceId] = useState('NYC');
    const [simDestId, setSimDestId] = useState('LDN');
    const [simRisk, setSimRisk] = useState(15);
    const [locked, setLocked] = useState(true);
    const [isClearing, setIsClearing] = useState(false);

    const handleClearLedger = async () => {
        if (!window.confirm("NUCLEAR PROTOCOL: This will PERMANENTLY WIPE the cloud ledger. Proceed?")) return;
        setIsClearing(true);
        try {
            const resp = await fetch('https://secure-payai.onrender.com/admin/clear-ledger', {
                method: 'DELETE',
                headers: { 'Authorization': token }
            });
            const data = await resp.json();
            if (resp.ok) {
                alert(`Ledger Purged. Deleted ${data.deleted_transactions} transactions.`);
                window.location.reload(); // Refresh to clear local state
            } else {
                alert(data.detail || "Purge failed");
            }
        } catch (e) { console.error(e); alert("Connection failed"); }
        setIsClearing(false);
    };

    useEffect(() => {
        if (transactions && transactions.length > 0) {
            setLatest(transactions[0]);
        }
    }, [transactions]);

    let source = null;
    let dest = null;
    let isRouting = false;
    let globeColor = '#10b981';

    // Priority: 1. Simulator Mode  2. Optimizer Route  3. Live Feed
    if (simMode && !miniMode) {
        source = GLOBAL_CITIES.find(c => c.id === simSourceId) || GLOBAL_CITIES[0];
        dest = GLOBAL_CITIES.find(c => c.id === simDestId) || GLOBAL_CITIES[1];
        isRouting = true;
        const isThreat = simRisk > 60;
        globeColor = isThreat ? '#ef4444' : '#10b981';
    } else if (optimizerRoute && optimizerRoute.source_city && optimizerRoute.dest_city) {
        source = GLOBAL_CITIES.find(c => c.id === optimizerRoute.source_city) || GLOBAL_CITIES[0];
        dest = GLOBAL_CITIES.find(c => c.id === optimizerRoute.dest_city) || GLOBAL_CITIES[1];
        isRouting = true;
        globeColor = '#3b82f6'; // Blue for optimizer preview
    } else if (latest) {
        source = GLOBAL_CITIES.find(c => c.id === CURRENCY_TO_CITY[latest.base_currency]) || GLOBAL_CITIES.find(c => c.country.includes('USA'));
        dest = GLOBAL_CITIES.find(c => c.id === CURRENCY_TO_CITY[latest.target_currency]) || GLOBAL_CITIES.find(c => c.country.includes('UK'));
        isRouting = true;
        const isThreat = latest.risk_score > 60 || (latest.status && latest.status.includes('denied'));
        globeColor = isThreat ? '#ef4444' : '#10b981';
    }

    // Mini mode: render just the globe with no overlay UI
    if (miniMode) {
        return (
            <div className="w-full h-full bg-slate-50 rounded-b-2xl overflow-hidden relative">
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {source?.name || '—'} → {dest?.name || '—'}
                    </div>
                </div>
                <div className="absolute inset-0">
                    <InteractiveGlobe
                        cities={GLOBAL_CITIES}
                        source={source}
                        dest={dest}
                        isRouting={isRouting}
                        globeColor={globeColor}
                        speed={0.5}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-slate-50 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200">
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 z-10 pointer-events-auto drop-shadow-md max-w-sm">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-slate-800 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Live Global Surveillance
                    </h3>
                    <div className="flex gap-2 bg-white rounded-lg p-1 border border-slate-200 shadow-sm ml-4">
                        <button
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${!simMode ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                            onClick={() => setSimMode(false)}
                        >Live Feed</button>
                        <button
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${simMode ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                            onClick={() => setSimMode(true)}
                        >Simulator</button>
                    </div>
                </div>

                <p className="text-[10px] text-slate-500 font-mono mt-1 font-bold">
                    SecurePay AI Routing Topology
                </p>

                {(userRole === 'admin' || userRole === 'dev') && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <button
                            onClick={handleClearLedger}
                            disabled={isClearing}
                            className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isClearing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20 active:scale-95'}`}
                        >
                            {isClearing ? 'Purging Ledger...' : '☢ Purge Cloud Ledger'}
                        </button>
                    </div>
                )}

                {simMode ? (
                    <div className="mt-4 bg-white/95 backdrop-blur rounded-xl p-4 border border-slate-200 shadow-xl space-y-3">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Route Simulator</div>
                        <div className="flex justify-between items-center gap-2">
                            <select
                                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={simSourceId}
                                onChange={(e) => setSimSourceId(e.target.value)}
                            >
                                {GLOBAL_CITIES.map(c => <option key={`src-${c.id}`} value={c.id}>{c.name}, {c.country}</option>)}
                            </select>
                            <span className="text-slate-400 text-xs">→</span>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={simDestId}
                                onChange={(e) => setSimDestId(e.target.value)}
                            >
                                {GLOBAL_CITIES.map(c => <option key={`dst-${c.id}`} value={c.id}>{c.name}, {c.country}</option>)}
                            </select>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                            <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase flex justify-between">
                                Simulated Risk Score <span className={simRisk > 60 ? 'text-red-500' : 'text-emerald-500'}>{simRisk}</span>
                            </label>
                            <input
                                type="range"
                                min="0" max="100"
                                value={simRisk}
                                onChange={(e) => setSimRisk(Number(e.target.value))}
                                className="w-full accent-blue-600"
                            />
                        </div>
                    </div>
                ) : (
                    latest && (
                        <div className="mt-4 bg-white/80 backdrop-blur rounded-lg p-3 border border-slate-200 shadow-md inline-block">
                            <div className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1">Latest Transaction</div>
                            <div className="flex gap-2 items-center text-xs font-bold text-slate-700">
                                {source?.name || latest.base_currency} <span className="opacity-50 text-slate-400">→</span> {dest?.name || latest.target_currency}
                            </div>
                            <div className={`text-[10px] font-bold mt-1 uppercase ${latest.risk_score > 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                                Risk Score: {latest.risk_score}
                            </div>
                        </div>
                    )
                )}
            </div>

            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 items-end drop-shadow-sm">
                <button
                    onClick={() => setLocked(!locked)}
                    className={`pointer-events-auto flex items-center gap-2 text-[9px] font-bold uppercase px-3 py-1.5 rounded-full border transition-all cursor-pointer mb-1 ${locked ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/80 backdrop-blur text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                    {locked ? '🔒 Locked to Route' : '🌐 Free Explore'}
                </button>
                <div className="pointer-events-none flex items-center gap-2 text-[9px] font-bold uppercase text-emerald-600 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Clean Routing
                </div>
                <div className="pointer-events-none flex items-center gap-2 text-[9px] font-bold uppercase text-red-600 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-red-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Threat Intercepted
                </div>
            </div>

            {/* D3 Interactive Globe */}
            <div className="absolute inset-0 z-0">
                <InteractiveGlobe
                    cities={GLOBAL_CITIES}
                    source={source}
                    dest={dest}
                    isRouting={isRouting}
                    globeColor={globeColor}
                    speed={1}
                    locked={locked}
                />
            </div>
        </div>
    );
};

export default ThreatMap;
