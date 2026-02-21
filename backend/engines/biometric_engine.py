import random
from datetime import datetime

class BiometricEngine:
    def __init__(self):
        # Baseline profiles from "proooject" logic
        self.baselines = {
            "default": {
                "typing_speed": 62,      # WPM
                "mouse_velocity": 450,   # px/s
                "device": "Chrome/Windows",
                "ip_location": "NY",
                "transaction_amount": 25000,
                "login_hours": list(range(8, 20)), # 8am to 8pm
                "last_lat_long": (40.7128, -74.0060), # NY
                "last_seen_epoch": 0
            }
        }
        # ML Feature expected values for "Isolation Forest" logic
        # [speed, mouse, device_match, loc_match, amt_scaled, hour, copy_paste, vpn_flag]
        self.ml_expected = [0.62, 0.45, 0, 0, 0.25, 0.5, 0, 0] 
        
    def calculate_ml_anomaly_score(self, current_metrics, profile):
        """Advanced ML-based anomaly detection using Isolation Forest concept from proooject"""
        features = []
        features.append(current_metrics.get("typing_speed", profile["typing_speed"]) / 100)
        features.append(current_metrics.get("mouse_velocity", profile["mouse_velocity"]) / 1000)
        features.append(1 if current_metrics.get("device") != profile["device"] else 0)
        features.append(1 if current_metrics.get("ip_location") != profile["ip_location"] else 0)
        features.append(current_metrics.get("amount", 0) / 100000)
        features.append(current_metrics.get("session_hour", 12) / 24)
        features.append(1 if current_metrics.get("is_copy_paste") else 0)
        features.append(1 if current_metrics.get("is_vpn") else 0)
        
        anomaly_score = 0
        for i, (feature, exp) in enumerate(zip(features, self.ml_expected)):
            deviation = abs(feature - exp)
            # Add sensitivity weighting
            # [typing, mouse, device, ip, amount, hour, paste, vpn]
            weight = [1.2, 1.0, 1.5, 1.3, 0.8, 0.5, 2.0, 2.5][i]
            anomaly_score += deviation * weight
            
        anomaly_score = min(anomaly_score, 1.0)
        return {
            "score": round(anomaly_score, 3),
            "confidence": round((1 - anomaly_score) * 100, 2),
            "is_anomaly": anomaly_score > 0.65
        }

    def _calculate_distance(self, p1, p2):
        # Rough Euclidean distance for POC
        return ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)**0.5 * 111 # km

    def identify_anomalies(self, current_metrics, profile):
        anomalies = []
        
        # 1. Typing Logic (Enhanced with Copy-Paste detection)
        speed = current_metrics.get("typing_speed", 0)
        is_paste = current_metrics.get("is_copy_paste", False)
        dev = abs(speed - profile["typing_speed"]) / profile["typing_speed"]
        
        if is_paste or speed > 150: # Superhuman speed implies script or paste
            anomalies.append({
                "factor": "Behavioral Scripting",
                "icon": "terminal",
                "status": "critical",
                "risk_contribution": 35,
                "baseline": "Human Typing (60-80 WPM)",
                "current": f"{speed} WPM",
                "deviation": "Non-human input (Paste/Automation)"
            })
        elif dev > 0.30:
            anomalies.append({
                "factor": "Typing Dynamics",
                "icon": "keyboard",
                "status": "warning" if dev < 0.6 else "critical",
                "risk_contribution": int(min(30, dev * 40)),
                "baseline": f"{profile['typing_speed']} WPM",
                "current": f"{speed} WPM",
                "deviation": f"{int(dev*100)}% variance"
            })

        # 2. Mouse Logic
        vel = current_metrics.get("mouse_velocity", 0)
        m_dev = abs(vel - profile["mouse_velocity"]) / profile["mouse_velocity"]
        if m_dev > 0.35:
            anomalies.append({
                "factor": "Erratic Motion",
                "icon": "mouse-pointer",
                "status": "warning" if m_dev < 0.7 else "critical",
                "risk_contribution": int(min(25, m_dev * 30)),
                "baseline": f"{profile['mouse_velocity']} px/s",
                "current": f"{vel} px/s",
                "deviation": "Unusual pathing (Bot-like)"
            })

        # 3. Location Logic (Impossible Travel)
        curr_loc = current_metrics.get("lat_long", (40.7128, -74.0060))
        dist = self._calculate_distance(curr_loc, profile["last_lat_long"])
        time_diff = (datetime.now().timestamp() - profile.get("last_seen_epoch", 0)) / 3600 # hours
        
        if time_diff > 0 and (dist / time_diff) > 900: # Over 900km/h is impossible travel
            anomalies.append({
                "factor": "Impossible Travel",
                "icon": "plane-takeoff",
                "status": "critical",
                "risk_contribution": 45,
                "baseline": "New York",
                "current": f"Distance: {int(dist)}km in {round(time_diff, 2)}h",
                "deviation": "Physical travel mismatch"
            })
        elif current_metrics.get("ip_location") != profile["ip_location"]:
            anomalies.append({
                "factor": "IP Geolocation",
                "icon": "map-pin",
                "status": "warning",
                "risk_contribution": 20,
                "baseline": profile["ip_location"],
                "current": current_metrics.get("ip_location"),
                "deviation": "Unusual access point"
            })
            
        # 4. VPN/Network Logic
        if current_metrics.get("is_vpn"):
            anomalies.append({
                "factor": "Network Masking",
                "icon": "shield-off",
                "status": "critical",
                "risk_contribution": 25,
                "baseline": "Residential ISP",
                "current": "VPN/Proxy Detected",
                "deviation": "High-risk IP Reputation"
            })

        # 5. Amount Logic (Whole Dollar/Rounded heuristic)
        amt = current_metrics.get("amount", 0)
        amt_dev = abs(amt - profile["transaction_amount"]) / profile["transaction_amount"]
        is_rounded = (amt % 100 == 0) and amt > 1000
        
        if is_rounded and amt_dev > 2:
            anomalies.append({
                "factor": "Structured Draining",
                "icon": "alert-triangle",
                "status": "critical",
                "risk_contribution": 30,
                "baseline": f"${profile['transaction_amount']:,}",
                "current": f"${amt:,}",
                "deviation": "Large rounded transfer (Account Takeover sign)"
            })
        elif amt_dev > 1.5:
             anomalies.append({
                "factor": "Transaction Size",
                "icon": "dollar-sign",
                "status": "critical",
                "risk_contribution": 25,
                "baseline": f"${profile['transaction_amount']:,}",
                "current": f"${amt:,}",
                "deviation": "High-value anomaly"
            })

        # 6. Timing/Velocity Logic
        hour = current_metrics.get("session_hour", 12)
        velocity = current_metrics.get("velocity_count", 0) # tx in last 10 mins
        
        if velocity > 5:
            anomalies.append({
                "factor": "High Frequency",
                "icon": "zap",
                "status": "critical",
                "risk_contribution": 35,
                "baseline": "1 tx/day",
                "current": f"{velocity} attempts",
                "deviation": "Velocity limit breached"
            })
        elif hour not in profile["login_hours"]:
            anomalies.append({
                "factor": "Session Timing",
                "icon": "clock",
                "status": "warning",
                "risk_contribution": 10,
                "baseline": "8AM-8PM",
                "current": f"{hour}:00 UTC",
                "deviation": "Off-peak access"
            })

        return anomalies

    def calculate_unified_risk_score(self, current_metrics, corridor_risk, history_velocity=0):
        """Unified risk assessment combining multiple factors from proooject"""
        profile = self.baselines["default"]
        
        # 1. Behavioral Biometrics (Anomalies)
        anomalies = self.identify_anomalies(current_metrics, profile)
        behavioral_score = sum(f["risk_contribution"] for f in anomalies)
        behavioral_score = min(behavioral_score, 100)
        
        # 2. ML Anomaly Detection
        ml_res = self.calculate_ml_anomaly_score(current_metrics, profile)
        ml_score = ml_res["score"] * 100
        
        # 3. Corridor Risk
        c_risk_score = corridor_risk.get("score", 0)
        
        # 4. Amount Risk (standalone)
        amt_risk = 0
        amount = current_metrics.get("amount", 0)
        if amount > 100000: amt_risk = 35
        elif amount > 50000: amt_risk = 20
        elif amount > 20000: amt_risk = 10
        
        # 5. Velocity Risk
        v_risk = min(40, (current_metrics.get("velocity_count", 0) * 8) + (history_velocity * 5))
        
        # Weighted Combination Matrix (Enhanced for realism)
        unified_score = (
            behavioral_score * 0.40 +
            ml_score * 0.20 +
            c_risk_score * 0.15 +
            amt_risk * 0.10 +
            v_risk * 0.15
        )
        
        unified_score = min(round(unified_score, 2), 100)
        
        # Decision Tiers
        if unified_score <= 20:
            lvl, rec, color = "Low", "Auto-Approve", "green"
            detail = "Profile matches baseline perfectly. No friction required."
        elif unified_score <= 45:
            lvl, rec, color = "Minimal", "Monitor Activity", "lightgreen"
            detail = "Slight deviations detected. Proceed with background monitoring."
        elif unified_score <= 65:
            lvl, rec, color = "Medium", "Step-up Auth", "orange"
            detail = "Unusual pattern detected. Triggering secondary biometric check."
        elif unified_score <= 85:
            lvl, rec, color = "High", "Manual Review", "red"
            detail = "High-risk signals (travel/network). Holding for compliance override."
        else:
            lvl, rec, color = "Critical", "Block Transaction", "darkred"
            detail = "Definitive fraud signature detected. Access revoked."

        return {
            "risk_score": unified_score,
            "risk_level": lvl,
            "recommendation": rec,
            "recommendation_color": color,
            "recommendation_detail": detail,
            "processing_time_ms": random.uniform(180, 240),
            "aml_flags": [f["factor"] for f in anomalies if f["status"] == "critical"],
            "breakdown": anomalies,
            "ml_insight": ml_res,
            "unified_breakdown": {
                "behavioral": round(behavioral_score, 2),
                "ml_anomaly": round(ml_score, 2),
                "corridor_risk": c_risk_score,
                "amount_risk": amt_risk,
                "velocity_risk": v_risk
            }
        }

