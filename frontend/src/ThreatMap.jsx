import React, { useRef, useState, useEffect } from 'react';
import Globe from 'react-globe.gl';

// Coordinate mapping for major currency hubs
const CURRENCY_HUBS = {
    'USD': { lat: 38.9072, lng: -77.0369, name: 'New York/DC' },
    'EUR': { lat: 50.1109, lng: 8.6821, name: 'Frankfurt' },
    'GBP': { lat: 51.5074, lng: -0.1278, name: 'London' },
    'INR': { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
    'JPY': { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
    'AED': { lat: 25.2048, lng: 55.2708, name: 'Dubai' },
    'NGN': { lat: 6.5244, lng: 3.3792, name: 'Lagos' }
};

const ThreatMap = ({ transactions }) => {
    const globeEl = useRef();
    const [arcsData, setArcsData] = useState([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);

    // Auto-resize globe
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initial globe setup
    useEffect(() => {
        if (globeEl.current) {
            // Auto rotate and center on Atlantic
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5;
            globeEl.current.pointOfView({ lat: 25, lng: -40, altitude: 2.5 });
        }
    }, []);

    // Process transactions into arcs
    useEffect(() => {
        if (!transactions || transactions.length === 0) return;

        const processedArcs = transactions.map(t => {
            const startLoc = CURRENCY_HUBS[t.base_currency] || CURRENCY_HUBS['USD'];
            const endLoc = CURRENCY_HUBS[t.target_currency] || CURRENCY_HUBS['EUR'];

            // If threat/blocked (risk > 60), make it red. Otherwise green.
            const isThreat = t.risk_score > 60 || t.status.includes('denied');
            const color = isThreat ? '#ef4444' : '#10b981'; // Tailwind Red-500 : Emerald-500

            return {
                startLat: startLoc.lat + (Math.random() - 0.5) * 2, // Slight jitter so lines don't perfectly overlap
                startLng: startLoc.lng + (Math.random() - 0.5) * 2,
                endLat: endLoc.lat + (Math.random() - 0.5) * 2,
                endLng: endLoc.lng + (Math.random() - 0.5) * 2,
                color: [color, color],
                stroke: isThreat ? 1.5 : 0.5,
                dashAnimateTime: isThreat ? 1000 : 2000,
                label: `TXN_${t.id} [${t.base_currency}→${t.target_currency}] Risk: ${t.risk_score}`
            };
        });

        // Limit to 50 active arcs to prevent overwhelming the browser
        setArcsData(processedArcs.slice(0, 50));
    }, [transactions]);

    return (
        <div ref={containerRef} className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden relative shadow-inner border border-slate-800">
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Global Surveillance
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Detecting cross-border anomalies via Orbital Nodes
                </p>
            </div>

            <div className="absolute bottom-4 right-4 z-10 pointer-events-none flex flex-col gap-1 items-end">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-slate-400 bg-slate-900/50 backdrop-blur px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Clean Routing
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-slate-400 bg-slate-900/50 backdrop-blur px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Threat Intercepted
                </div>
            </div>

            {/* Globe Canvas */}
            {dimensions.width > 0 && (
                <Globe
                    ref={globeEl}
                    width={dimensions.width}
                    height={dimensions.height}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                    arcsData={arcsData}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={0.2}
                    arcDashAnimateTime="dashAnimateTime"
                    arcStroke="stroke"
                    arcLabel="label"
                    backgroundColor="rgba(0,0,0,0)" // Transparent to show parent bg
                />
            )}
        </div>
    );
};

export default ThreatMap;
