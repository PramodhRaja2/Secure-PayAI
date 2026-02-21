import { useState, useEffect, useRef } from 'react';

export const useBiometrics = () => {
    const [metrics, setMetrics] = useState({
        typing_speed: 60,
        mouse_velocity: 0,
        last_key_time: Date.now(),
        key_intervals: [],
        mouse_positions: [],
        is_copy_paste: false,
    });

    const lastMousePos = useRef({ x: 0, y: 0 });
    const keyTimes = useRef([]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const now = Date.now();
            if (keyTimes.current.length > 0) {
                const interval = now - keyTimes.current[keyTimes.current.length - 1];
                setMetrics(prev => ({
                    ...prev,
                    key_intervals: [...prev.key_intervals, interval].slice(-20),
                }));
            }
            keyTimes.current.push(now);

            // Calculate WPM roughly
            if (keyTimes.current.length > 5) {
                const first = keyTimes.current[0];
                const last = keyTimes.current[keyTimes.current.length - 1];
                const minutes = (last - first) / 60000;
                const wpm = (keyTimes.current.length / 5) / (minutes || 1);
                setMetrics(prev => ({ ...prev, typing_speed: Math.round(wpm) }));
            }
        };

        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const velocity = Math.sqrt(
                Math.pow(clientX - lastMousePos.current.x, 2) +
                Math.pow(clientY - lastMousePos.current.y, 2)
            );
            lastMousePos.current = { x: clientX, y: clientY };

            setMetrics(prev => ({
                ...prev,
                mouse_velocity: Math.round(velocity),
                mouse_positions: [...prev.mouse_positions, { x: clientX, y: clientY }].slice(-50)
            }));
        };

        const handlePaste = () => {
            setMetrics(prev => ({ ...prev, is_copy_paste: true }));
            // Reset after 3 seconds so subsequent transactions aren't all flagged
            setTimeout(() => setMetrics(prev => ({ ...prev, is_copy_paste: false })), 3000);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('paste', handlePaste);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('paste', handlePaste);
        };
    }, []);

    return metrics;
};
