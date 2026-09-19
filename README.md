# CardioPulse AI: Institutional-Grade Multi-Modal Cardiology Copilot & Translational Research Engine

CardioPulse AI is an advanced, closed-loop multi-modal digital twin simulation platform engineered specifically for medical doctors, PhD researchers, cardiology fellows, and medical students. It bridges separate clinical data silos into a single, interactive patient simulation, translating static international guidelines into active, responsive bedside digital therapeutics.

## 🫀 Core Platform Architecture

### 1. AI Clinical Cardiology Copilot (`AICopilotView`)
* **Dynamic Patient Profiling:** Ingests dynamic vitals, high-sensitivity troponin kinetics (hs-cTnI), natriuretic peptides (BNP), serum potassium, and renal clearance (eGFR) profiles.
* **Autonomous Multimodal Synthesis:** Formulates immediate emergency red flags, prioritized multi-tiered differentials with pre-test probabilities, diagnostic testing algorithms, and emergency pharmacotherapy loading guidelines grounded in 2024–2026 ACC/AHA and ESC Class I recommendations.

### 2. 12-Lead Electrophysiology Canvas & Caliper Engine (`ECGAnalyzerView`)
* **Anatomic Spatial Vector Simulator:** A 60 FPS HTML5 canvas engine running on a `requestAnimationFrame` loop that models realistic, lead-specific electrical vector deflections across Einthoven's limb leads and precordial progression (V1–V6). 
* **Dynamic Pathology Projections:** Renders true ischemic configurations (e.g., massive precordial "tombstoning" ST-elevation in acute proximal LAD occlusion alongside inferior reciprocal depressions in leads II, III, and aVF).
* **Live Caliper-to-QTc HUD:** Draggable crosshair calipers that calculate horizontal millisecond intervals to dynamically feed synchronized **Bazett** and **Fridericia** QTc calculators.

### 3. Dual-Window Echocardiogram Simulator (`EchoSimulatorView`)
* **Tissue Mechanics Loop:** Animates synchronized Apical 4-Chamber (A4C) and Parasternal Long Axis (PLAX) ultrasound profiles modeling structural contractility and cardiac cycle valve states.
* **Regional Wall Motion Abnormality (WMA) Engine:** Maps the ASE 17-segment criteria to dynamically execute regional wall akinesis based on a custom **Ischemia Duration Timeline Slider**, establishing an interactive model for the **Electro-Mechanical Ischemic Lag Gap**.
* **Color Doppler Fluid Paths:** Maps semi-transparent velocity streams representing turbulent outflow tracts and eccentric valvular regurgitant jets (tailored for HOCM, Stanford Type A Dissection, and Papillary Muscle Leaflet Ruptures).

### 4. Invasive Coronary Angiography & Primary PCI Engine (`CathLabInterventionPanel`)
* **Fluoroscopy Cine Simulator:** Simulates catheterization cine-fluoroscopy with calibrated radiopaque grid lines and active contrast bolus flow matching vascular distributions (LAD vs. RCA).
* **Interactive Endovascular Deployment:** Animates metallic stent expansion over coronary blockages, dynamically upgrading local perfusion status from **TIMI Grade 0 (No Flow)** to **TIMI Grade 3 (Normal Antegrade Flow)** with a recorded 72-minute Door-to-Balloon time.

### 5. HF 4-Pillar GDMT Titration & Safety Matrix (`GDMTView`)
* **Quadruple Therapy Sequencing:** Standardizes rapid sequencing pathways across ARNIs, Beta-Blockers, MRAs, and SGLT2 inhibitors.
* **Biophysical Safety Interlocks:** Features reactive safety overrides that automatically lock out or flash warnings across drug columns based on live hemodynamic and biochemical boundaries (e.g., SBP < 100 mmHg hypotension overrides, HR < 60 bpm bradycardia blocks, Potassium > 5.5 mEq/L hyperkalemia contraindications, and a strict 36-hour ACEi washout gate to mitigate angioedema).

### 6. Biostatistical Trial Power Dashboard (`ResearchLabView`)
* **Sample Size Calculator:** Runs a two-sample parallel proportions sample size logic loop utilizing a continuity-preserving Fleiss/Normal Approximation script to support automated randomized trial protocols (*CardioPulse-1*).
* **60 FPS Power Curve Canvas:** Automatically draws a continuous statistical power tracing (Sample Size vs. Power), highlighting the exact intersection where your cohort size satisfies target power thresholds (e.g., Alpha: 0.05, Power: 0.90) with an automatic 10% attrition buffer.

---

## 🔬 In Scientific Peer-Review (High-IF / Q1 Journal Manuscript Criteria)

To reproduce the clinical validation datasets required for publication in high-impact factor journals (**IF 10–15**), implement the following localized human-in-the-loop study framework within your institution:
1. **Cohort Stratification:** Randomize 40 clinical residents or fellows into two symmetric groups (Intervention Arm vs. Control Arm).
2. **Simulation Vignettes:** Deploy complex raw patient text narratives (e.g., a 34-year-old female presenting with exertional syncope / suspected Spontaneous Coronary Artery Dissection [SCAD], or an oliguric heart failure patient with borderline hyperkalemia).
3. **Primary Endpoints:** Track and extract diagnostic time-to-treatment speed, diagnostic accuracy percentages, and guideline titration adherence errors. Researchers can leverage the **Single-Click JSON Data Export** buttons across the viewports to compile structured datasets for direct CSV statistical mapping and replication packages.

---

## 🛠️ Local Installation & Setup

```bash
# Clone the verified repository
git clone https://github.com

# Install institutional dependencies
npm install

# Launch the high-performance local dev server
npm run dev
```

---
*Disclaimer: CardioPulse AI is a simulated decision-support tool created exclusively for educational and clinical research validation purposes, and does not constitute direct patient medical advice, clinical diagnosis, or individualized treatment planning.*
