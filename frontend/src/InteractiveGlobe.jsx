import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

export default function InteractiveGlobe({ cities, source, dest, isRouting, globeColor, speed, locked, onCityClick }) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const dataRef = useRef(null);

    // Mutable state for the animation loop
    const stateRef = useRef({
        rotation: [0, -15, 0],
        routingActive: false,
        source: null,
        dest: null,
        pathProgress: 0,
        pulseRadius: 0,
        // Interaction state
        isDragging: false,
        dragStart: null,
        rotationStart: null,
        scale: 1,
        lastInteraction: 0, // timestamp of last user interaction
        idleTimeout: 3000,  // ms before auto-spin resumes
    });

    // Sync props to ref
    useEffect(() => {
        stateRef.current.routingActive = isRouting;
        stateRef.current.source = source;
        stateRef.current.dest = dest;
        stateRef.current.locked = locked;
        if (!isRouting) {
            stateRef.current.pathProgress = 0;
        }
    }, [isRouting, source, dest, locked]);

    useEffect(() => {
        // Load map data once
        if (!dataRef.current) {
            d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world) => {
                dataRef.current = {
                    land: topojson.feature(world, world.objects.land),
                    borders: topojson.mesh(world, world.objects.countries, (a, b) => a !== b)
                };
                startLoop();
            });
        }

        let frameId;
        let lastTime = performance.now();

        // ──── MOUSE / TOUCH INTERACTION ────
        const svgNode = svgRef.current;
        if (!svgNode) return;

        const onPointerDown = (e) => {
            const s = stateRef.current;
            s.isDragging = true;
            s.dragStart = { x: e.clientX, y: e.clientY };
            s.rotationStart = [...s.rotation];
            s.lastInteraction = performance.now();
            svgNode.style.cursor = 'grabbing';
        };

        const onPointerMove = (e) => {
            const s = stateRef.current;
            if (!s.isDragging || !s.dragStart) return;
            const dx = e.clientX - s.dragStart.x;
            const dy = e.clientY - s.dragStart.y;
            // Sensitivity: ~0.3 degrees per pixel
            s.rotation[0] = s.rotationStart[0] + dx * 0.3;
            s.rotation[1] = s.rotationStart[1] - dy * 0.3;
            // Clamp latitude
            s.rotation[1] = Math.max(-90, Math.min(90, s.rotation[1]));
            s.lastInteraction = performance.now();
        };

        const onPointerUp = () => {
            const s = stateRef.current;
            s.isDragging = false;
            s.dragStart = null;
            s.rotationStart = null;
            s.lastInteraction = performance.now();
            svgNode.style.cursor = 'grab';
        };

        const onWheel = (e) => {
            e.preventDefault();
            const s = stateRef.current;
            const zoomDelta = e.deltaY > 0 ? -0.08 : 0.08;
            s.scale = Math.max(0.5, Math.min(4, s.scale + zoomDelta));
            s.lastInteraction = performance.now();
        };

        svgNode.addEventListener('pointerdown', onPointerDown);
        svgNode.addEventListener('pointermove', onPointerMove);
        svgNode.addEventListener('pointerup', onPointerUp);
        svgNode.addEventListener('pointerleave', onPointerUp);
        svgNode.addEventListener('wheel', onWheel, { passive: false });
        svgNode.style.cursor = 'grab';
        svgNode.style.touchAction = 'none'; // prevent scroll on touch devices

        const startLoop = () => {
            const svg = d3.select(svgRef.current);
            if (svg.empty()) return;

            const width = containerRef.current?.clientWidth || 800;
            const height = containerRef.current?.clientHeight || 800;
            const baseRadius = Math.min(width, height) / 2.2;

            const projection = d3.geoOrthographic()
                .translate([width / 2, height / 2])
                .clipAngle(90);

            const path = d3.geoPath(projection);
            const sphere = { type: "Sphere" };

            // SVG Selections
            const globeOcean = svg.select(".globe-ocean");
            const globeOceanShadow = svg.select(".globe-ocean-shadow");
            const globeLand = svg.select(".globe-land");
            const globeBorders = svg.select(".globe-borders");
            const routeLine = svg.select(".route-line");
            const cityPins = svg.select(".city-pins");

            const render = (time) => {
                const dt = time - lastTime;
                lastTime = time;

                const s = stateRef.current;
                const isIdle = !s.isDragging && (time - s.lastInteraction > s.idleTimeout);

                // Apply zoom
                projection.scale(baseRadius * s.scale);

                // Update shadow circle size for zoom
                globeOceanShadow
                    .attr("cx", width / 2)
                    .attr("cy", height / 2)
                    .attr("r", baseRadius * s.scale + 4);

                if (!s.isDragging) {
                    if (s.locked && s.routingActive && s.source && s.dest) {
                        // LOCKED: smoothly orient to the route midpoint
                        const interpolate = d3.geoInterpolate(
                            [Number(s.source.lng), Number(s.source.lat)],
                            [Number(s.dest.lng), Number(s.dest.lat)]
                        );
                        const mid = interpolate(0.5);
                        const target = [-mid[0], -mid[1], 0];

                        s.rotation[0] += (target[0] - s.rotation[0]) * 0.05;
                        s.rotation[1] += (target[1] - s.rotation[1]) * 0.05;

                        // Animate path progress
                        if (s.pathProgress < 1) {
                            s.pathProgress += 0.015 * (dt / 16);
                            if (s.pathProgress > 1) s.pathProgress = 1;
                        }
                    } else if (isIdle) {
                        // FREE or no route: auto-spin when idle
                        s.rotation[0] += speed * (dt / 16);
                    }

                    // Always animate path progress even if unlocked
                    if (!s.locked && s.routingActive && s.pathProgress < 1) {
                        s.pathProgress += 0.015 * (dt / 16);
                        if (s.pathProgress > 1) s.pathProgress = 1;
                    }
                }

                projection.rotate(s.rotation);
                s.pulseRadius = (s.pulseRadius + 0.5 * (dt / 16)) % 20;

                // Draw Base Map
                if (dataRef.current) {
                    globeOcean.attr("d", path(sphere));
                    globeLand.attr("d", path(dataRef.current.land));
                    globeBorders.attr("d", path(dataRef.current.borders));
                }

                // Draw Route Line
                if (s.routingActive && s.source && s.dest) {
                    const routeGeo = {
                        type: "LineString",
                        coordinates: [
                            [Number(s.source.lng), Number(s.source.lat)],
                            [Number(s.dest.lng), Number(s.dest.lat)]
                        ]
                    };

                    const d = path(routeGeo);
                    routeLine.attr("d", d);

                    if (d) {
                        const length = routeLine.node()?.getTotalLength() || 0;
                        routeLine
                            .attr("stroke-dasharray", length)
                            .attr("stroke-dashoffset", length * (1 - s.pathProgress));
                    }
                } else {
                    routeLine.attr("d", "");
                }

                // Draw Pins
                const pinsData = (cities || []).map((c) => {
                    const coords = [Number(c.lng), Number(c.lat)];
                    const isVisible = path({ type: "Point", coordinates: coords }) !== null;
                    const pos = projection(coords);
                    return { ...c, pos, isVisible };
                });

                const circles = cityPins.selectAll("g.pin-group").data(pinsData, (d) => d.id);

                const enter = circles.enter().append("g")
                    .attr("class", "pin-group");

                enter.append("circle")
                    .attr("class", "pin-core")
                    .attr("r", 3)
                    .attr("fill", "#64748b");

                enter.append("circle")
                    .attr("class", "pin-pulse")
                    .attr("fill", "none")
                    .attr("stroke", "#64748b")
                    .attr("stroke-width", 1);

                const update = enter.merge(circles);

                update
                    .attr("transform", d => d.pos ? `translate(${d.pos[0]},${d.pos[1]})` : "translate(-100,-100)")
                    .style("opacity", d => d.isVisible ? 1 : 0);

                // Highlight active source/dest
                update.select(".pin-core")
                    .attr("fill", d => (s.routingActive && (d.id === s.source?.id || d.id === s.dest?.id)) ? globeColor : "#64748b")
                    .attr("r", d => (s.routingActive && (d.id === s.source?.id || d.id === s.dest?.id)) ? 5 : 3);

                update.select(".pin-pulse")
                    .attr("r", d => (s.routingActive && (d.id === s.source?.id || d.id === s.dest?.id)) ? s.pulseRadius : 0)
                    .attr("stroke", globeColor)
                    .style("opacity", d => (s.routingActive && (d.id === s.source?.id || d.id === s.dest?.id)) ? 1 - (s.pulseRadius / 20) : 0);

                update
                    .style("cursor", "pointer")
                    .on("click", (event, d) => {
                        if (onCityClick) onCityClick(d);
                    })
                    .on("mouseover", function () {
                        d3.select(this).select(".pin-core").attr("r", 7);
                    })
                    .on("mouseout", function (event, d) {
                        const isMain = s.routingActive && (d.id === s.source?.id || d.id === s.dest?.id);
                        d3.select(this).select(".pin-core").attr("r", isMain ? 5 : 3);
                    });

                frameId = requestAnimationFrame(render);
            };

            frameId = requestAnimationFrame(render);
        };

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            svgNode.removeEventListener('pointerdown', onPointerDown);
            svgNode.removeEventListener('pointermove', onPointerMove);
            svgNode.removeEventListener('pointerup', onPointerUp);
            svgNode.removeEventListener('pointerleave', onPointerUp);
            svgNode.removeEventListener('wheel', onWheel);
        };
    }, [cities, globeColor, speed]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <svg ref={svgRef} className="w-full h-full drop-shadow-2xl">
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <radialGradient id="oceanGradient" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#f1f5f9" />
                    </radialGradient>
                </defs>

                {/* Ocean Shadow */}
                <circle className="globe-ocean-shadow" fill="#e2e8f0" />
                <path className="globe-ocean" fill="url(#oceanGradient)" />

                {/* Land & Borders */}
                <path className="globe-land" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={0.5} />
                <path className="globe-borders" fill="none" stroke="#94a3b8" strokeWidth={0.5} />

                {/* Routes */}
                <path
                    className="route-line"
                    fill="none"
                    stroke={globeColor}
                    strokeWidth={4}
                    strokeLinecap="round"
                    filter="url(#glow)"
                />

                {/* Pins */}
                <g className="city-pins" />
            </svg>
        </div>
    );
}
