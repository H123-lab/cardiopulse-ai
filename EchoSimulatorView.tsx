import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Heart, 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Sliders, 
  Sparkles, 
  Layers, 
  Gauge, 
  Compass, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Volume2, 
  Maximize2, 
  Crosshair, 
  Waves, 
  FileText,
  ScanLine,
  Stethoscope,
  RefreshCw,
  Cpu,
  Zap,
  Target,
  Clock,
  Timer,
  TrendingUp,
  BarChart2,
  Flame,
  Check,
  GraduationCap,
  Pin,
  Columns,
  Square,
  Monitor
} from 'lucide-react';
import { usePatientContext } from '../context/PatientContext';
import { TroponinKineticGrapher } from './TroponinKineticGrapher';
import { WmsiVisualMatrix } from './WmsiVisualMatrix';
import { AcademicGrantModal } from './AcademicGrantModal';
import { drawPLAXAnatomy } from './echoSimPlax';
import { QuantitativeValidationHud } from './QuantitativeValidationHud';

export type EchoPresetId = 
  | 'normal-sinus'
  | 'stemi-anterior-lad'
  | 'stemi-inferior-rca'
  | 'hfref-dilated'
  | 'severe-as-lvh'
  | 'takotsubo'
  | 'rv-strain-pe'
  | 'hocm'
  | 'pericardial-tamponade'
  | 'aortic-dissection-type-a'
  | 'papillary-muscle-rupture';

export interface MyocardialSegment {
  id: string;
  name: string;
  coronaryTerritory: 'LAD' | 'RCA' | 'LCx' | 'Global' | 'RV';
  score: 1 | 2 | 3 | 4 | 5; // 1=Normal, 2=Hypokinetic, 3=Akinetic, 4=Dyskinetic, 5=Aneurysmal
  scoreLabel: string;
  radialExcursion: number; // 1.0 = normal, 0.0 = akinetic, >1.3 = hyperdynamic
  wallThickening: number;  // 1.0 = normal, 0.0 = none, >1.3 = hyperdynamic
}

export interface EchoPreset {
  id: EchoPresetId;
  name: string;
  category: string;
  heartRate: number;
  expectedLVEF: number; // %
  edv: number; // End-diastolic volume in mL
  esv: number; // End-systolic volume in mL
  lvedd: number; // mm
  wmsi: number; // Wall motion score index
  wmaSummary: string;
  valvularFindings: string;
  clinicalSignificance: string;
  coronaryArtery: string;
  segments: {
    basalSeptal: MyocardialSegment;
    midSeptal: MyocardialSegment;
    apicalSeptal: MyocardialSegment;
    apex: MyocardialSegment;
    apicalLateral: MyocardialSegment;
    midLateral: MyocardialSegment;
    basalLateral: MyocardialSegment;
    rvFreeWall: MyocardialSegment;
  };
  hasMitralRegurgitation: boolean;
  mrSeverity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  isConcentricLVH: boolean;
  isDilatedChambers: boolean;
}

export const ECHO_PRESETS: EchoPreset[] = [
  {
    id: 'normal-sinus',
    name: 'Normal Healthy Baseline (A4C)',
    category: 'Normal Reference',
    heartRate: 72,
    expectedLVEF: 62,
    edv: 120,
    esv: 46,
    lvedd: 46,
    wmsi: 1.0,
    wmaSummary: 'Normal biventricular size and systolic function. Synchronous radial excursion and symmetric myocardial thickening (>35%) in all visualized walls.',
    valvularFindings: 'Normal mitral and tricuspid valve leaflet mobility without regurgitation or stenosis.',
    clinicalSignificance: 'Normal cardiovascular hemodynamics. Textbook baseline reference for chamber dimensions and contractility.',
    coronaryArtery: 'Patent epicardial coronaries without flow-limiting stenosis',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'RCA', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Normal', radialExcursion: 1.05, wallThickening: 1.05 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RCA', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
    },
    hasMitralRegurgitation: false,
    mrSeverity: 'None',
    isConcentricLVH: false,
    isDilatedChambers: false,
  },
  {
    id: 'stemi-anterior-lad',
    name: 'Acute Anterior STEMI (Proximal LAD Occlusion)',
    category: 'Acute Ischemic ACS',
    heartRate: 96,
    expectedLVEF: 36,
    edv: 132,
    esv: 84,
    lvedd: 54,
    wmsi: 1.9,
    wmaSummary: 'Profound akinesis/hypokinesis of the LV apex, apical-septum, and mid-septum. Marked compensatory hyperkinesis of the basal lateral wall.',
    valvularFindings: 'Trace ischemic mitral regurgitation; normal tricuspid leaflet coaptation.',
    clinicalSignificance: 'High-risk anterior myocardial infarction. Loss of apical cap twist and severe anterior wall necrosis; immediate primary PCI indicated.',
    coronaryArtery: 'Acute 100% thrombotic occlusion of Proximal Left Anterior Descending (LAD)',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'RCA', score: 2, scoreLabel: 'Hypokinetic', radialExcursion: 0.50, wallThickening: 0.50 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'LAD', score: 3, scoreLabel: 'Akinetic', radialExcursion: 0.05, wallThickening: 0.05 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'LAD', score: 3, scoreLabel: 'Akinetic', radialExcursion: 0.02, wallThickening: 0.02 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'LAD', score: 3, scoreLabel: 'Akinetic', radialExcursion: 0.0, wallThickening: 0.0 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'LAD', score: 3, scoreLabel: 'Akinetic', radialExcursion: 0.10, wallThickening: 0.10 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal/Compensatory', radialExcursion: 1.15, wallThickening: 1.20 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Hyperdynamic (Compensatory)', radialExcursion: 1.60, wallThickening: 1.55 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RCA', score: 1, scoreLabel: 'Preserved', radialExcursion: 1.0, wallThickening: 1.0 },
    },
    hasMitralRegurgitation: true,
    mrSeverity: 'Mild',
    isConcentricLVH: false,
    isDilatedChambers: false,
  },
  {
    id: 'stemi-inferior-rca',
    name: 'Acute Inferior STEMI (Dominant RCA Occlusion)',
    category: 'Acute Ischemic ACS',
    heartRate: 64,
    expectedLVEF: 44,
    edv: 125,
    esv: 70,
    lvedd: 50,
    wmsi: 1.6,
    wmaSummary: 'Akinesis of the basal and mid inferoseptal walls with coexisting RV free wall hypokinesis. Anterior and apical segments remain preserved.',
    valvularFindings: 'Posteromedial papillary muscle dysfunction causing mild-to-moderate mitral regurgitation.',
    clinicalSignificance: 'Right coronary artery ischemia with elevated risk of complete heart block and RV involvement; avoid nitrates if RV infarction suspected.',
    coronaryArtery: 'Acute thrombotic occlusion of the Right Coronary Artery (RCA)',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'RCA', score: 3, scoreLabel: 'Akinetic', radialExcursion: 0.05, wallThickening: 0.05 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'RCA', score: 2, scoreLabel: 'Hypokinetic', radialExcursion: 0.30, wallThickening: 0.30 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Normal', radialExcursion: 0.95, wallThickening: 1.0 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Preserved', radialExcursion: 1.0, wallThickening: 1.0 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal', radialExcursion: 1.10, wallThickening: 1.10 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RCA', score: 2, scoreLabel: 'Hypokinetic (RV Infarction)', radialExcursion: 0.40, wallThickening: 0.40 },
    },
    hasMitralRegurgitation: true,
    mrSeverity: 'Moderate',
    isConcentricLVH: false,
    isDilatedChambers: false,
  },
  {
    id: 'hfref-dilated',
    name: 'Decompensated HFrEF / Dilated Cardiomyopathy',
    category: 'Heart Failure',
    heartRate: 88,
    expectedLVEF: 24,
    edv: 185,
    esv: 140,
    lvedd: 66,
    wmsi: 2.2,
    wmaSummary: 'Severely dilated, spherical LV cavity with diffuse global hypokinesis. Intraventricular mechanical dyssynchrony and mitral annular dilation.',
    valvularFindings: 'Moderate-to-severe functional mitral regurgitation with leaflet tethering (tenting area >1.5 cm²).',
    clinicalSignificance: 'Severe systolic heart failure with low cardiac output and elevated filling pressures (E/e\' 18.2). Requires 4-pillar GDMT optimization and CRT-D evaluation.',
    coronaryArtery: 'Non-ischemic dilated cardiomyopathy or chronic multi-vessel CAD',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'Global', score: 2, scoreLabel: 'Severe Hypokinesis', radialExcursion: 0.25, wallThickening: 0.20 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'Global', score: 2, scoreLabel: 'Severe Hypokinesis', radialExcursion: 0.25, wallThickening: 0.20 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'Global', score: 2, scoreLabel: 'Severe Hypokinesis', radialExcursion: 0.25, wallThickening: 0.20 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'Global', score: 2, scoreLabel: 'Severe Hypokinesis', radialExcursion: 0.20, wallThickening: 0.15 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'Global', score: 2, scoreLabel: 'Severe Hypokinesis', radialExcursion: 0.25, wallThickening: 0.20 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'Global', score: 2, scoreLabel: 'Severe Hypokinesis', radialExcursion: 0.30, wallThickening: 0.25 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'Global', score: 2, scoreLabel: 'Severe Hypokinesis', radialExcursion: 0.30, wallThickening: 0.25 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RV', score: 2, scoreLabel: 'Moderate Hypokinesis', radialExcursion: 0.45, wallThickening: 0.40 },
    },
    hasMitralRegurgitation: true,
    mrSeverity: 'Severe',
    isConcentricLVH: false,
    isDilatedChambers: true,
  },
  {
    id: 'severe-as-lvh',
    name: 'Severe Aortic Stenosis & Concentric LVH',
    category: 'Valvular Disease',
    heartRate: 70,
    expectedLVEF: 68,
    edv: 98,
    esv: 31,
    lvedd: 44,
    wmsi: 1.0,
    wmaSummary: 'Concentric left ventricular hypertrophy with small cavity dimension. Hyperdynamic radial contractility with preserved-to-elevated ejection fraction.',
    valvularFindings: 'Heavily calcified, restricted trileaflet aortic valve with peak jet velocity >4.0 m/s; trace mitral regurgitation.',
    clinicalSignificance: 'Severe left ventricular outflow obstruction leading to diastolic stiffness and elevated filling pressures despite normal systolic EF.',
    coronaryArtery: 'Concentric pressure-overload remodeling; evaluate coronaries prior to TAVR/SAVR',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Concentric Hypertrophy', radialExcursion: 1.10, wallThickening: 1.25 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Concentric Hypertrophy', radialExcursion: 1.15, wallThickening: 1.30 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Concentric Hypertrophy', radialExcursion: 1.15, wallThickening: 1.30 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Hyperdynamic', radialExcursion: 1.25, wallThickening: 1.35 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Concentric Hypertrophy', radialExcursion: 1.15, wallThickening: 1.30 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Concentric Hypertrophy', radialExcursion: 1.15, wallThickening: 1.25 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Concentric Hypertrophy', radialExcursion: 1.10, wallThickening: 1.20 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RV', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
    },
    hasMitralRegurgitation: false,
    mrSeverity: 'None',
    isConcentricLVH: true,
    isDilatedChambers: false,
  },
  {
    id: 'takotsubo',
    name: 'Takotsubo Stress Cardiomyopathy (Apical Ballooning)',
    category: 'Acute Cardiomyopathy',
    heartRate: 92,
    expectedLVEF: 32,
    edv: 140,
    esv: 95,
    lvedd: 52,
    wmsi: 2.1,
    wmaSummary: 'Classic apical and mid-ventricular ballooning with severe akinesis/dyskinesis. Basal segments are vigorously hyperdynamic (LVOTO risk).',
    valvularFindings: 'Dynamic systolic anterior motion (SAM) of the anterior mitral leaflet with late-systolic mitral regurgitation jet.',
    clinicalSignificance: 'Catecholamine-induced transient myocardial stunning extending across multiple coronary distributions; spontaneous recovery in 4–8 weeks.',
    coronaryArtery: 'Absence of obstructive epicardial coronary artery disease on urgent angiography',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Hyperdynamic (SAM Risk)', radialExcursion: 1.65, wallThickening: 1.55 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'Global', score: 3, scoreLabel: 'Akinetic Ballooning', radialExcursion: -0.05, wallThickening: 0.0 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'Global', score: 4, scoreLabel: 'Dyskinetic Ballooning', radialExcursion: -0.15, wallThickening: 0.0 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'Global', score: 4, scoreLabel: 'Dyskinetic Apex Ballooning', radialExcursion: -0.20, wallThickening: 0.0 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'Global', score: 4, scoreLabel: 'Dyskinetic Ballooning', radialExcursion: -0.15, wallThickening: 0.0 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'Global', score: 3, scoreLabel: 'Akinetic Ballooning', radialExcursion: -0.05, wallThickening: 0.0 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Hyperdynamic (Compensatory)', radialExcursion: 1.70, wallThickening: 1.60 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RV', score: 1, scoreLabel: 'Preserved/Hyperdynamic', radialExcursion: 1.15, wallThickening: 1.10 },
    },
    hasMitralRegurgitation: true,
    mrSeverity: 'Moderate',
    isConcentricLVH: false,
    isDilatedChambers: false,
  },
  {
    id: 'rv-strain-pe',
    name: 'Acute RV Pressure Strain (Massive Pulmonary Embolism)',
    category: 'Acute Hemodynamic Emergency',
    heartRate: 118,
    expectedLVEF: 52,
    edv: 110,
    esv: 52,
    lvedd: 42,
    wmsi: 1.4,
    wmaSummary: 'Severe RV chamber dilation with RV > LV end-diastolic ratio. McConnell\'s sign: akinesis of the mid RV free wall with hyperdynamic apical RV sparing.',
    valvularFindings: 'Severe tricuspid regurgitation with elevated systolic pulmonary pressure gradient (>50 mmHg); RV fractional area change <30%.',
    clinicalSignificance: 'Acute pulmonary vascular obstruction causing acute cor pulmonale and interventricular septal flattening ("D-shaped" LV in short axis).',
    coronaryArtery: 'Patent coronaries; acute massive pulmonary arterial thromboembolism',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'RCA', score: 2, scoreLabel: 'Septal Flattening Shift', radialExcursion: 0.65, wallThickening: 0.70 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'LAD', score: 2, scoreLabel: 'Septal Flattening Shift', radialExcursion: 0.65, wallThickening: 0.70 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Normal', radialExcursion: 0.95, wallThickening: 0.95 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal', radialExcursion: 1.05, wallThickening: 1.05 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal', radialExcursion: 1.05, wallThickening: 1.05 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal', radialExcursion: 1.05, wallThickening: 1.05 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RV', score: 3, scoreLabel: 'McConnell\'s Sign (Mid Akinesis)', radialExcursion: 0.15, wallThickening: 0.10 },
    },
    hasMitralRegurgitation: false,
    mrSeverity: 'None',
    isConcentricLVH: false,
    isDilatedChambers: false,
  },
  {
    id: 'hocm',
    name: 'Hypertrophic Obstructive Cardiomyopathy (HOCM)',
    category: 'Structural / Genetic Cardiomyopathy',
    heartRate: 74,
    expectedLVEF: 80,
    edv: 84,
    esv: 16,
    lvedd: 38,
    wmsi: 1.0,
    wmaSummary: 'Massive asymmetric septal hypertrophy (IVSd ≥ 18 mm). Severe systolic anterior motion (SAM) of the anterior mitral leaflet with dynamic LVOT obstruction and cavity obliteration during end-systole.',
    valvularFindings: 'Systolic anterior motion (SAM) with septal-leaflet contact; dynamic mid-to-late systolic LVOT pressure gradient and eccentric late-systolic mitral regurgitation.',
    clinicalSignificance: 'Dynamic subaortic obstruction with high risk of exertional syncope, lethal ventricular tachyarrhythmias (VT/VF), and sudden cardiac death (SCD). Avoid vasodilators and inotropes.',
    coronaryArtery: 'No epicardial stenosis; dynamic intramyocardial microvascular ischemia secondary to severe septal hypertrophy',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Asymmetric Septal Hypertrophy (SAM)', radialExcursion: 1.45, wallThickening: 1.95 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Severe Asymmetric Hypertrophy', radialExcursion: 1.50, wallThickening: 2.10 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Hypertrophied', radialExcursion: 1.35, wallThickening: 1.60 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Cavity Obliteration', radialExcursion: 1.55, wallThickening: 1.65 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Hyperdynamic', radialExcursion: 1.35, wallThickening: 1.30 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal Caliber', radialExcursion: 1.30, wallThickening: 1.25 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Normal Caliber', radialExcursion: 1.30, wallThickening: 1.20 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RV', score: 1, scoreLabel: 'Normal', radialExcursion: 1.10, wallThickening: 1.05 },
    },
    hasMitralRegurgitation: true,
    mrSeverity: 'Moderate',
    isConcentricLVH: false,
    isDilatedChambers: false,
  },
  {
    id: 'pericardial-tamponade',
    name: 'Acute Pericardial Tamponade & Hemodynamic Collapse',
    category: 'Pericardial Emergency',
    heartRate: 126,
    expectedLVEF: 54,
    edv: 60,
    esv: 34,
    lvedd: 36,
    wmsi: 1.45,
    wmaSummary: 'Circumferential echo-free anechoic pericardial effusion wrapper. Classic late-diastolic right atrial collapse (>1/3 cardiac cycle) and early-diastolic right ventricular free wall compression loops. Swinging heart syndrome.',
    valvularFindings: 'Marked exaggerated respiratory variation in transvalvular inflow (>25% inspiratory drop in mitral E velocity, reciprocal tricuspid increase; echocardiographic pulsus paradoxus).',
    clinicalSignificance: 'CRITICAL EMERGENCY: Hemodynamic collapse with elevated intrapericardial pressures exceeding intracardiac chamber filling pressures. Cardiogenic obstructive shock requiring STAT bedside pericardiocentesis.',
    coronaryArtery: 'Patent coronaries; extrinsic diastolic compression of epicardial coronary vessels and chambers',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Extrinsic Constraint', radialExcursion: 0.70, wallThickening: 0.90 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Extrinsic Constraint', radialExcursion: 0.75, wallThickening: 0.90 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Extrinsic Constraint', radialExcursion: 0.80, wallThickening: 0.90 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Swinging Motion', radialExcursion: 0.90, wallThickening: 0.95 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Extrinsic Constraint', radialExcursion: 0.75, wallThickening: 0.90 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Extrinsic Constraint', radialExcursion: 0.70, wallThickening: 0.90 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Extrinsic Constraint', radialExcursion: 0.70, wallThickening: 0.90 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RV', score: 3, scoreLabel: 'Diastolic Collapse / Inversion', radialExcursion: -0.25, wallThickening: 0.40 },
    },
    hasMitralRegurgitation: false,
    mrSeverity: 'None',
    isConcentricLVH: false,
    isDilatedChambers: false,
  },
  {
    id: 'aortic-dissection-type-a',
    name: 'Acute Stanford Type A Aortic Dissection',
    category: 'Aortic & Surgical Emergency',
    heartRate: 104,
    expectedLVEF: 49,
    edv: 154,
    esv: 78,
    lvedd: 56,
    wmsi: 1.25,
    wmaSummary: 'Profound dilation of the proximal aortic root silhouette (>48 mm) with an active, high-frequency undulating linear intimal flap traversing the aortic lumen. Acute regurgitant volume overload response.',
    valvularFindings: 'Severe, wide central diastolic aortic regurgitation jet back-flowing into the LV with rapid deceleration and premature closure of the mitral valve in diastole.',
    clinicalSignificance: 'SURGICAL DISASTER: Stanford Type A ascending aortic dissection extending to root and coronary ostia. Immediate emergent cardiothoracic surgical consultation for ascending aorta / hemiarch replacement.',
    coronaryArtery: 'Proximal dissection flap compromising right and/or left main coronary ostia; immediate CTA / TEE confirmation',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Volume Overload Strain', radialExcursion: 1.15, wallThickening: 1.05 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Volume Overload Strain', radialExcursion: 1.15, wallThickening: 1.05 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Preserved', radialExcursion: 1.10, wallThickening: 1.0 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Preserved', radialExcursion: 1.15, wallThickening: 1.05 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Preserved', radialExcursion: 1.10, wallThickening: 1.0 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Volume Overload Strain', radialExcursion: 1.15, wallThickening: 1.05 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'Global', score: 1, scoreLabel: 'Volume Overload Strain', radialExcursion: 1.15, wallThickening: 1.05 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RV', score: 1, scoreLabel: 'Preserved', radialExcursion: 1.0, wallThickening: 1.0 },
    },
    hasMitralRegurgitation: false,
    mrSeverity: 'None',
    isConcentricLVH: false,
    isDilatedChambers: true,
  },
  {
    id: 'papillary-muscle-rupture',
    name: 'Acute Papillary Muscle Rupture (Flail Mitral Leaflet)',
    category: 'Mechanical Infarct Complication',
    heartRate: 112,
    expectedLVEF: 50,
    edv: 142,
    esv: 74,
    lvedd: 52,
    wmsi: 1.65,
    wmaSummary: 'Complete transection/rupture of posteromedial papillary muscle head. Flail anterior/posterior mitral valve leaflet whipping violently into the left atrium during systole with complete coaptation failure.',
    valvularFindings: 'Catastrophic, torrential eccentric mitral regurgitant mosaic jet filling >80% of the dilated left atrial cavity with systolic pulmonary venous flow reversal.',
    clinicalSignificance: 'LIFE-THREATENING MECHANICAL COMPLICATION: Acute severe ischemic mitral regurgitation with torrential volume overload, flash pulmonary edema, and sudden cardiogenic shock. Emergent surgical valve repair/replacement required.',
    coronaryArtery: 'Infarction/ischemia in RCA or LCx territory supplying posteromedial papillary muscle (single blood supply)',
    segments: {
      basalSeptal: { id: 'bs', name: 'Basal Septal', coronaryTerritory: 'RCA', score: 2, scoreLabel: 'Inferoseptal Hypokinesis', radialExcursion: 0.45, wallThickening: 0.50 },
      midSeptal: { id: 'ms', name: 'Mid Septal', coronaryTerritory: 'RCA', score: 2, scoreLabel: 'Hypokinetic', radialExcursion: 0.50, wallThickening: 0.50 },
      apicalSeptal: { id: 'as', name: 'Apical Septal', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Preserved', radialExcursion: 1.0, wallThickening: 1.0 },
      apex: { id: 'ap', name: 'LV Apex', coronaryTerritory: 'LAD', score: 1, scoreLabel: 'Hyperdynamic', radialExcursion: 1.20, wallThickening: 1.15 },
      apicalLateral: { id: 'al', name: 'Apical Lateral', coronaryTerritory: 'LCx', score: 1, scoreLabel: 'Preserved', radialExcursion: 1.05, wallThickening: 1.0 },
      midLateral: { id: 'ml', name: 'Mid Lateral', coronaryTerritory: 'LCx', score: 2, scoreLabel: 'Posterolateral Hypokinesis', radialExcursion: 0.45, wallThickening: 0.45 },
      basalLateral: { id: 'bl', name: 'Basal Lateral', coronaryTerritory: 'LCx', score: 2, scoreLabel: 'Posterolateral Hypokinesis', radialExcursion: 0.45, wallThickening: 0.45 },
      rvFreeWall: { id: 'rv', name: 'RV Free Wall', coronaryTerritory: 'RV', score: 1, scoreLabel: 'Normal', radialExcursion: 1.0, wallThickening: 1.0 },
    },
    hasMitralRegurgitation: true,
    mrSeverity: 'Severe',
    isConcentricLVH: false,
    isDilatedChambers: true,
  }
];

export const EchoSimulatorView: React.FC = () => {
  const { patient, selectedCaseId } = usePatientContext();

  // State
  const [selectedPreset, setSelectedPreset] = useState<EchoPreset>(ECHO_PRESETS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [heartRate, setHeartRate] = useState<number>(selectedPreset.heartRate);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isColorDoppler, setIsColorDoppler] = useState<boolean>(true);
  const [showWmaHeatmap, setShowWmaHeatmap] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isApexTop, setIsApexTop] = useState<boolean>(true); // Standard TTE sector orientation
  const [showCalipers, setShowCalipers] = useState<boolean>(false);
  const [caliperDistMm, setCaliperDistMm] = useState<number>(46);
  const [caliperP1, setCaliperP1] = useState<{ x: number; y: number }>({ x: 380, y: 160 });
  const [caliperP2, setCaliperP2] = useState<{ x: number; y: number }>({ x: 440, y: 160 });
  const [activeDragCaliper, setActiveDragCaliper] = useState<'P1' | 'P2' | null>(null);

  // AI Consultation modal & report state
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [activeTab, setActiveInfoTab] = useState<'wma' | 'hemodynamics' | 'report' | 'troponin'>('wma');

  // Electro-Mechanical Ischemic Lag State (Minutes: 0 to 120)
  const [ischemiaDurationMinutes, setIschemiaDurationMinutes] = useState<number>(35);
  const [showTroponinGraph, setShowTroponinGraph] = useState<boolean>(false);
  const [inspectedSegmentKey, setInspectedSegmentKey] = useState<string | null>(null);
  const [hoveredSegmentKey, setHoveredSegmentKey] = useState<string | null>(null);
  const [showGrantModal, setShowGrantModal] = useState<boolean>(false);

  // Transducer View Mode: Dual Window (A4C + PLAX) or focused viewports
  const [transducerView, setTransducerView] = useState<'dual' | 'a4c' | 'plax'>('dual');

  // Animation cycle refs & dual canvas handles
  const a4cCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const plaxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = a4cCanvasRef; // Backward-compatible alias for caliper/touch handlers
  const animFrameRef = useRef<number | null>(null);
  const cyclePhaseRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Automatically sync preset when active patient or case changes in context
  useEffect(() => {
    if (patient) {
      let targetPresetId: EchoPresetId = 'normal-sinus';
      if (patient.id === 'pt-001' || selectedCaseId === 'stemi-anterior') {
        targetPresetId = 'stemi-anterior-lad';
      } else if (patient.id === 'pt-002' || selectedCaseId === 'hfref-decompensation') {
        targetPresetId = 'hfref-dilated';
      } else if (patient.id === 'pt-004' || selectedCaseId === 'severe-as-tavr') {
        targetPresetId = 'severe-as-lvh';
      }

      const match = ECHO_PRESETS.find(p => p.id === targetPresetId);
      if (match) {
        setSelectedPreset(match);
        setHeartRate(patient.vitals.heartRate || match.heartRate);
        if (targetPresetId === 'stemi-anterior-lad') {
          setIschemiaDurationMinutes(35);
        } else if (targetPresetId === 'normal-sinus') {
          setIschemiaDurationMinutes(0);
        }
      }
    }
  }, [patient, selectedCaseId]);

  // Synchronize heart rate with preset on switch
  useEffect(() => {
    setHeartRate(selectedPreset.heartRate);
    setAiReport(null);
  }, [selectedPreset.id]);

  // Dynamic Preset State derived from selectedPreset & ischemiaDurationMinutes
  const dynamicPresetState = useMemo(() => {
    const isAnteriorSTEMI = selectedPreset.id === 'stemi-anterior-lad';
    const isInferiorSTEMI = selectedPreset.id === 'stemi-inferior-rca';
    const isIschemic = isAnteriorSTEMI || isInferiorSTEMI;

    const segs = { ...selectedPreset.segments };
    let ischemicWarpFactor = 0; // 0 = normal slate, 0.5 = early, 1.0+ = severe stippled cyan
    let isElectroMechanicalLag = false;
    let effectiveEF = selectedPreset.expectedLVEF;
    let effectiveESV = selectedPreset.esv;

    if (isAnteriorSTEMI) {
      if (ischemiaDurationMinutes <= 10) {
        // ELECTRO-MECHANICAL LAG PHASE
        // ECG manifests ST elevation within seconds, but macroscopic wall motion remains normal
        isElectroMechanicalLag = true;
        ischemicWarpFactor = 0;
        effectiveEF = 60;
        effectiveESV = 48;

        segs.apex = { ...segs.apex, score: 1, scoreLabel: 'Normal (Lag Phase)', radialExcursion: 1.0, wallThickening: 1.0 };
        segs.apicalSeptal = { ...segs.apicalSeptal, score: 1, scoreLabel: 'Normal (Lag Phase)', radialExcursion: 1.0, wallThickening: 1.0 };
        segs.midSeptal = { ...segs.midSeptal, score: 1, scoreLabel: 'Normal (Lag Phase)', radialExcursion: 1.0, wallThickening: 1.0 };
        segs.apicalLateral = { ...segs.apicalLateral, score: 1, scoreLabel: 'Normal (Lag Phase)', radialExcursion: 1.0, wallThickening: 1.0 };
        segs.basalLateral = { ...segs.basalLateral, score: 1, scoreLabel: 'Normal', radialExcursion: 1.05, wallThickening: 1.05 };
      } else if (ischemiaDurationMinutes <= 20) {
        // TRANSITION: Subendocardial ischemia, ATP depletion, early hypokinesis
        const p = (ischemiaDurationMinutes - 10) / 10;
        isElectroMechanicalLag = false;
        ischemicWarpFactor = p * 0.55;
        effectiveEF = Math.round(60 - p * 18);
        effectiveESV = Math.round(48 + p * 30);

        const exc = 1.0 - p * 0.65;
        const thick = 1.0 - p * 0.65;
        segs.apex = { ...segs.apex, score: 2, scoreLabel: 'Hypokinetic (Transition)', radialExcursion: exc, wallThickening: thick };
        segs.apicalSeptal = { ...segs.apicalSeptal, score: 2, scoreLabel: 'Hypokinetic (Transition)', radialExcursion: exc, wallThickening: thick };
        segs.midSeptal = { ...segs.midSeptal, score: 2, scoreLabel: 'Hypokinetic (Transition)', radialExcursion: exc + 0.05, wallThickening: thick + 0.05 };
        segs.basalLateral = { ...segs.basalLateral, score: 1, scoreLabel: 'Early Compensatory', radialExcursion: 1.05 + p * 0.35, wallThickening: 1.05 + p * 0.3 };
      } else {
        // ESTABLISHED TRANSMURAL AKINESIS & ISCHEMIC FREEZING (>20 mins)
        isElectroMechanicalLag = false;
        ischemicWarpFactor = Math.min(1.0 + (ischemiaDurationMinutes - 20) / 60, 1.45);
        effectiveEF = Math.max(28, 36 - Math.round((ischemiaDurationMinutes - 20) / 30));
        effectiveESV = Math.min(96, 84 + Math.round((ischemiaDurationMinutes - 20) / 25));

        segs.apex = { ...segs.apex, score: 3, scoreLabel: 'Akinetic (Frozen)', radialExcursion: 0.0, wallThickening: 0.0 };
        segs.apicalSeptal = { ...segs.apicalSeptal, score: 3, scoreLabel: 'Akinetic (Frozen)', radialExcursion: 0.0, wallThickening: 0.0 };
        segs.midSeptal = { ...segs.midSeptal, score: 3, scoreLabel: 'Akinetic', radialExcursion: 0.04, wallThickening: 0.04 };
        segs.apicalLateral = { ...segs.apicalLateral, score: 3, scoreLabel: 'Akinetic', radialExcursion: 0.08, wallThickening: 0.08 };
        segs.basalLateral = { ...segs.basalLateral, score: 1, scoreLabel: 'Compensatory Hyperdynamic', radialExcursion: 1.60, wallThickening: 1.55 };
      }
    } else if (isInferiorSTEMI) {
      if (ischemiaDurationMinutes <= 10) {
        isElectroMechanicalLag = true;
        effectiveEF = 58;
        segs.basalSeptal = { ...segs.basalSeptal, score: 1, scoreLabel: 'Normal (Lag Phase)', radialExcursion: 1.0, wallThickening: 1.0 };
        segs.midSeptal = { ...segs.midSeptal, score: 1, scoreLabel: 'Normal (Lag Phase)', radialExcursion: 1.0, wallThickening: 1.0 };
      } else if (ischemiaDurationMinutes <= 20) {
        const p = (ischemiaDurationMinutes - 10) / 10;
        segs.basalSeptal = { ...segs.basalSeptal, score: 2, scoreLabel: 'Hypokinetic', radialExcursion: 1.0 - p * 0.6, wallThickening: 1.0 - p * 0.6 };
      } else {
        segs.basalSeptal = { ...segs.basalSeptal, score: 3, scoreLabel: 'Akinetic', radialExcursion: 0.05, wallThickening: 0.05 };
      }
    }

    // 4 Key Visible Segments for WMSI Matrix (Basal Septal, Mid Septal, Apical Septal, Lateral)
    const fourSegments = {
      basalSeptal: {
        id: 'bs',
        name: 'Basal Septal',
        shortName: 'Basal Septum',
        score: (segs.basalSeptal.score as 1 | 2 | 3 | 4),
        label: segs.basalSeptal.scoreLabel,
        territory: segs.basalSeptal.coronaryTerritory,
        excursion: segs.basalSeptal.radialExcursion,
        thickening: segs.basalSeptal.wallThickening,
      },
      midSeptal: {
        id: 'ms',
        name: 'Mid Septal',
        shortName: 'Mid Septum',
        score: (segs.midSeptal.score as 1 | 2 | 3 | 4),
        label: segs.midSeptal.scoreLabel,
        territory: segs.midSeptal.coronaryTerritory,
        excursion: segs.midSeptal.radialExcursion,
        thickening: segs.midSeptal.wallThickening,
      },
      apicalSeptal: {
        id: 'as',
        name: 'Apical Septal',
        shortName: 'Apical Septum & Apex',
        score: ((segs.apicalSeptal.score === 3 || segs.apex.score === 3) ? 3 : (segs.apicalSeptal.score === 2 || segs.apex.score === 2) ? 2 : 1) as 1 | 2 | 3 | 4,
        label: (segs.apicalSeptal.score === 3 || segs.apex.score === 3) ? 'Akinetic (Frozen)' : (segs.apicalSeptal.score === 2 || segs.apex.score === 2) ? 'Hypokinetic' : 'Normal',
        territory: 'LAD',
        excursion: Math.min(segs.apicalSeptal.radialExcursion, segs.apex.radialExcursion),
        thickening: Math.min(segs.apicalSeptal.wallThickening, segs.apex.wallThickening),
      },
      lateral: {
        id: 'lat',
        name: 'Lateral Wall',
        shortName: 'Mid & Basal Lateral',
        score: ((segs.midLateral.score === 3 || segs.basalLateral.score === 3) ? 3 : (segs.midLateral.score === 2 || segs.basalLateral.score === 2) ? 2 : 1) as 1 | 2 | 3 | 4,
        label: segs.basalLateral.radialExcursion > 1.35 ? 'Hyperdynamic (>1.5x)' : segs.basalLateral.scoreLabel,
        territory: segs.basalLateral.coronaryTerritory,
        excursion: Math.max(segs.midLateral.radialExcursion, segs.basalLateral.radialExcursion),
        thickening: Math.max(segs.midLateral.wallThickening, segs.basalLateral.wallThickening),
      }
    };

    const sumScores = fourSegments.basalSeptal.score + fourSegments.midSeptal.score + fourSegments.apicalSeptal.score + fourSegments.lateral.score;
    const dynamicWmsi = Number((sumScores / 4).toFixed(2));

    const effectivePreset: EchoPreset = {
      ...selectedPreset,
      segments: segs,
      expectedLVEF: effectiveEF,
      esv: effectiveESV,
      wmsi: dynamicWmsi,
    };

    return {
      effectivePreset,
      isIschemic,
      isAnteriorSTEMI,
      isElectroMechanicalLag,
      ischemicWarpFactor,
      fourSegments,
      dynamicWmsi,
      sumScores,
      effectiveEF,
    };
  }, [selectedPreset, ischemiaDurationMinutes]);

  // Real-time instantaneous hemodynamic calculations derived from physical cycle
  // Systole state S(t) in [0, 1] where 0 = diastole (EDV) and 1 = peak systole (ESV)
  const currentCardiacCycle = useMemo(() => {
    // Current cycle length in seconds = 60 / HR
    const cycleDurationSec = 60 / Math.max(heartRate, 30);
    // Systole takes approx 36% of the cycle, diastole 64%
    const systoleDurationSec = Math.round(cycleDurationSec * 0.36 * 1000);
    const diastoleDurationSec = Math.round(cycleDurationSec * 0.64 * 1000);

    // Derived dynamic EF
    const preset = dynamicPresetState.effectivePreset;
    const calculatedEF = Math.round(((preset.edv - preset.esv) / preset.edv) * 100);
    const strokeVolumeMl = preset.edv - preset.esv;
    const cardiacOutputLMin = Number(((strokeVolumeMl * heartRate) / 1000).toFixed(2));
    const cardiacIndex = Number((cardiacOutputLMin / 1.9).toFixed(2)); // normalized for 1.9 m² BSA

    return {
      cycleDurationSec: Number(cycleDurationSec.toFixed(2)),
      systoleDurationSec,
      diastoleDurationSec,
      calculatedEF,
      strokeVolumeMl,
      cardiacOutputLMin,
      cardiacIndex,
    };
  }, [heartRate, dynamicPresetState.effectivePreset]);

  // Calculate live phase status
  const currentPhaseStatus = useMemo(() => {
    const t = cyclePhaseRef.current % 1.0;
    // t in [0.00, 0.36] = Systole
    if (t < 0.08) return { label: 'Isovolumetric Contraction', color: 'text-amber-400', isSystole: true };
    if (t < 0.28) return { label: 'Rapid Ventricular Ejection (Peak Systole)', color: 'text-rose-400', isSystole: true };
    if (t < 0.36) return { label: 'Reduced Ejection / End-Systole', color: 'text-pink-400', isSystole: true };
    if (t < 0.44) return { label: 'Isovolumetric Relaxation', color: 'text-sky-400', isSystole: false };
    if (t < 0.72) return { label: 'Rapid Passive Filling (E-Wave)', color: 'text-emerald-400', isSystole: false };
    if (t < 0.86) return { label: 'Diastasis (Slow Filling)', color: 'text-teal-300', isSystole: false };
    return { label: 'Atrial Contraction Kick (A-Wave)', color: 'text-indigo-300', isSystole: false };
  }, [cyclePhaseRef.current]);

  // Real-time Canvas Rendering Loop (Synchronized 60 FPS Dual-Window Simulator)
  useEffect(() => {
    let isSubscribed = true;

    const resizeTarget = (cv: HTMLCanvasElement | null, heightPx: number = 460) => {
      if (!cv || !cv.parentElement) return;
      const rect = cv.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      cv.width = w * dpr;
      cv.height = heightPx * dpr;
      cv.style.width = `${w}px`;
      cv.style.height = `${heightPx}px`;
      const c = cv.getContext('2d');
      if (c) {
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    const handleResize = () => {
      const targetH = transducerView === 'dual' ? 440 : 480;
      if (transducerView === 'dual') {
        resizeTarget(a4cCanvasRef.current, targetH);
        resizeTarget(plaxCanvasRef.current, targetH);
      } else if (transducerView === 'a4c') {
        resizeTarget(a4cCanvasRef.current, targetH);
      } else if (transducerView === 'plax') {
        resizeTarget(plaxCanvasRef.current, targetH);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (time: number) => {
      if (!isSubscribed) return;

      const deltaMs = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (isPlaying) {
        // Frequency in Hz = heartRate / 60
        const freqHz = heartRate / 60;
        const phaseIncrement = freqHz * (deltaMs / 1000) * playbackSpeed;
        cyclePhaseRef.current = (cyclePhaseRef.current + phaseIncrement) % 1.0;
      }

      // Phase parameter t in [0, 1)
      const t = cyclePhaseRef.current;

      // Compute systolic contraction function S(t) in [0, 1]
      let systoleFactor = 0;
      if (t < 0.36) {
        const systoleNorm = t / 0.36;
        systoleFactor = Math.sin(systoleNorm * Math.PI);
      } else {
        systoleFactor = 0;
      }

      // Valve leaflet opening parameter V(t)
      let valveOpenFactor = 0;
      if (t >= 0.36) {
        const diastoleNorm = (t - 0.36) / 0.64;
        if (diastoleNorm < 0.55) {
          valveOpenFactor = Math.sin((diastoleNorm / 0.55) * Math.PI) * 0.95;
        } else if (diastoleNorm < 0.70) {
          valveOpenFactor = 0.15;
        } else {
          valveOpenFactor = Math.sin(((diastoleNorm - 0.70) / 0.30) * Math.PI) * 0.75;
        }
      }

      // 1. Render Apical 4-Chamber (A4C) Viewport
      if (transducerView === 'dual' || transducerView === 'a4c') {
        const a4cCanvas = a4cCanvasRef.current;
        if (a4cCanvas) {
          const ctx = a4cCanvas.getContext('2d');
          if (ctx) {
            const dpr = window.devicePixelRatio || 1;
            const w = a4cCanvas.width / dpr;
            const h = a4cCanvas.height / dpr;

            ctx.fillStyle = '#030712';
            ctx.fillRect(0, 0, w, h);

            if (showGrid) {
              drawUltrasoundSector(ctx, w, h, isApexTop);
            }

            drawA4CAnatomy(
              ctx,
              w,
              h,
              systoleFactor,
              valveOpenFactor,
              dynamicPresetState.effectivePreset,
              isColorDoppler,
              showWmaHeatmap,
              showLabels,
              isApexTop,
              dynamicPresetState.ischemicWarpFactor,
              inspectedSegmentKey || hoveredSegmentKey,
              t,
              time
            );

            drawSynchronizedECGStrip(ctx, w, h, t);

            if (showCalipers) {
              drawCalipers(ctx, caliperP1, caliperP2, caliperDistMm);
            }
          }
        }
      }

      // 2. Render Parasternal Long Axis (PLAX) Viewport
      if (transducerView === 'dual' || transducerView === 'plax') {
        const plaxCanvas = plaxCanvasRef.current;
        if (plaxCanvas) {
          const ctx = plaxCanvas.getContext('2d');
          if (ctx) {
            const dpr = window.devicePixelRatio || 1;
            const w = plaxCanvas.width / dpr;
            const h = plaxCanvas.height / dpr;

            ctx.fillStyle = '#030712';
            ctx.fillRect(0, 0, w, h);

            drawPLAXAnatomy(
              ctx,
              w,
              h,
              systoleFactor,
              valveOpenFactor,
              dynamicPresetState.effectivePreset,
              isColorDoppler,
              showWmaHeatmap,
              showLabels,
              dynamicPresetState.ischemicWarpFactor,
              inspectedSegmentKey || hoveredSegmentKey,
              t,
              time
            );

            drawSynchronizedECGStrip(ctx, w, h, t);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isSubscribed = false;
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    isPlaying,
    heartRate,
    playbackSpeed,
    selectedPreset,
    dynamicPresetState,
    inspectedSegmentKey,
    hoveredSegmentKey,
    isColorDoppler,
    showWmaHeatmap,
    showLabels,
    showGrid,
    isApexTop,
    showCalipers,
    caliperP1,
    caliperP2,
    caliperDistMm,
    transducerView
  ]);

  // Ultrasound Sector Beam Geometry & Depth Scale
  const drawUltrasoundSector = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    apexTop: boolean
  ) => {
    ctx.save();
    const cx = w / 2;
    const originY = apexTop ? 28 : h - 28;
    const sectorAngleRad = (74 * Math.PI) / 180;
    const maxRadius = Math.min(380, h - 80);

    ctx.save();
    ctx.beginPath();
    const startAngle = apexTop ? (Math.PI / 2) - (sectorAngleRad / 2) : (3 * Math.PI / 2) - (sectorAngleRad / 2);
    const endAngle = apexTop ? (Math.PI / 2) + (sectorAngleRad / 2) : (3 * Math.PI / 2) + (sectorAngleRad / 2);
    ctx.moveTo(cx, originY);
    ctx.arc(cx, originY, maxRadius, startAngle, endAngle, false);
    ctx.closePath();

    // Deep ultrasound field background gradient
    const grad = ctx.createRadialGradient(cx, originY, 30, cx, originY, maxRadius);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
    grad.addColorStop(0.7, 'rgba(8, 14, 26, 0.65)');
    grad.addColorStop(1, 'rgba(3, 7, 18, 0.85)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle sector boundary rays
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.stroke();

    // Concentric depth arcs (every 4cm equivalent)
    const arcSteps = [0.25, 0.50, 0.75, 1.0];
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.setLineDash([3, 4]);

    arcSteps.forEach((step, idx) => {
      const r = maxRadius * step;
      ctx.beginPath();
      ctx.arc(cx, originY, r, startAngle, endAngle, false);
      ctx.stroke();

      // Depth tick labels in cm
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '9px monospace';
      const labelDepth = (idx + 1) * 4; // 4, 8, 12, 16 cm
      const labelX = cx + r * Math.sin(sectorAngleRad / 2) + 4;
      const labelY = apexTop ? originY + r * Math.cos(sectorAngleRad / 2) : originY - r * Math.cos(sectorAngleRad / 2);
      ctx.fillText(`${labelDepth}cm`, labelX, labelY);
    });

    ctx.setLineDash([]);

    // Transducer Probe Icon at Origin
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, originY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Orientation Indicator Dot (Marker Dot convention on right/left)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx + 24, originY + (apexTop ? 8 : -8), 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('R', cx + 29, originY + (apexTop ? 11 : -5));

    ctx.restore();
    ctx.restore();
  };

  // Primary Apical 4-Chamber Cardiac Anatomy Engine
  // Transforms coordinates between diastole and systole based on dynamic WMA profiles
  const drawA4CAnatomy = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    systoleFactor: number,
    valveOpenFactor: number,
    preset: EchoPreset,
    doppler: boolean,
    heatmap: boolean,
    labels: boolean,
    apexTop: boolean,
    ischemicWarpFactor: number = 0,
    inspectedKey: string | null = null,
    cyclePhase: number = 0,
    time: number = 0
  ) => {
    ctx.save();

    const isHOCM = preset.id === 'hocm';
    const isTamponade = preset.id === 'pericardial-tamponade';
    const isDissection = preset.id === 'aortic-dissection-type-a';
    const isFlail = preset.id === 'papillary-muscle-rupture';

    // Tamponade cardiac swing and respiratory modulation
    const swingOffsetX = isTamponade ? Math.sin(time * 0.0035) * 6 : 0;
    const isEarlyDiastole = cyclePhase >= 0.38 && cyclePhase <= 0.68;
    const isLateDiastole = cyclePhase >= 0.76 || cyclePhase <= 0.08;

    const cx = w / 2 + swingOffsetX;
    // Vertical placement
    const apexY = apexTop ? 65 : h - 75;
    const baseSign = apexTop ? 1 : -1;

    // Chamber scaling modifiers
    const isDilated = preset.isDilatedChambers;
    const isLVH = preset.isConcentricLVH;

    // Base Dimensions at End-Diastole
    const lvWidthDiastole = (isHOCM ? 64 : isDilated ? 104 : isLVH ? 72 : 84);
    const rvWidthDiastole = (preset.id === 'rv-strain-pe' ? 98 : isDilated ? 80 : 66);
    const lvLengthDiastole = (isDilated ? 185 : 170);
    const rvLengthDiastole = 135;

    // Baseline Wall Thickness in mm (converted to px)
    const baseWallThickness = isHOCM ? 12 : isLVH ? 19 : 11;

    // Retrieve active Segment Factors
    const segs = preset.segments;
    const eApex = segs.apex.radialExcursion;
    const eApicalSept = segs.apicalSeptal.radialExcursion;
    const eMidSept = segs.midSeptal.radialExcursion;
    const eBasalSept = segs.basalSeptal.radialExcursion;
    const eApicalLat = segs.apicalLateral.radialExcursion;
    const eMidLat = segs.midLateral.radialExcursion;
    const eBasalLat = segs.basalLateral.radialExcursion;
    const eRvFree = segs.rvFreeWall.radialExcursion;

    const tApex = segs.apex.wallThickening;
    const tSept = (segs.midSeptal.wallThickening + segs.apicalSeptal.wallThickening) / 2;
    const tLat = (segs.midLateral.wallThickening + segs.basalLateral.wallThickening) / 2;

    // Inward excursions modulated by systoleFactor
    // Positive excursion means moving towards LV centroid (contraction)
    // Negative excursion means dyskinetic bulging outwards!
    const dyApex = baseSign * (systoleFactor * (isHOCM ? 1.4 : eApex) * 18);
    // In HOCM, mid-septum dramatically bulges rightward into LVOT
    const dxSeptMid = (isHOCM ? 16 : 0) + systoleFactor * eMidSept * 12;
    const dxSeptBasal = systoleFactor * eBasalSept * 10;
    const dxLatMid = -systoleFactor * (isHOCM ? 1.55 : eMidLat) * 16;
    const dxLatBasal = -systoleFactor * eBasalLat * 22; // Compensatory hyperkinesis can reach 32px
    // In Tamponade, early-diastolic collapse pushes RV free wall inward toward septum
    const dxRvFree = (isTamponade && isEarlyDiastole) ? 18 : (systoleFactor * eRvFree * 12);

    // Wall Thickening calculation
    const currentApexThickness = baseWallThickness + (systoleFactor * tApex * 7);
    const currentSeptThickness = isHOCM ? (22 + systoleFactor * 8) : (baseWallThickness + (systoleFactor * tSept * 6));
    const currentLatThickness = isHOCM ? 10 : (baseWallThickness + (systoleFactor * tLat * 7));

    // Anatomical Coordinates
    // Apex of LV (top-center, slightly to right of true center in standard A4C)
    const lvApexX = cx + 8;
    const lvApexY = apexY + dyApex;

    // RV Apex (inserts slightly lower into septum than LV apex)
    const rvApexX = cx - 14;
    const rvApexY = lvApexY + baseSign * 18;

    // Interventricular Septum (IVS) key points
    const septMidX = cx - 2 + dxSeptMid;
    const septMidY = apexY + baseSign * (lvLengthDiastole * 0.48);

    const septBasalX = cx - 4 + dxSeptBasal;
    const septBasalY = apexY + baseSign * (lvLengthDiastole * 0.94);

    // LV Lateral Wall key points
    const latApicalX = lvApexX + (lvWidthDiastole * 0.42) + (systoleFactor * eApicalLat * -8);
    const latApicalY = apexY + baseSign * (lvLengthDiastole * 0.28);

    const latMidX = cx + (lvWidthDiastole * 0.82) + dxLatMid;
    const latMidY = apexY + baseSign * (lvLengthDiastole * 0.54);

    const latBasalX = cx + (lvWidthDiastole * 0.88) + dxLatBasal;
    const latBasalY = apexY + baseSign * (lvLengthDiastole * 0.94);

    // RV Free Wall key points
    const rvMidX = cx - (rvWidthDiastole * 0.92) + dxRvFree;
    const rvMidY = apexY + baseSign * (rvLengthDiastole * 0.52);

    const rvBasalX = cx - (rvWidthDiastole * 0.90) + (systoleFactor * eRvFree * 8);
    const rvBasalY = apexY + baseSign * (rvLengthDiastole * 0.92);

    // Annulus Planes
    // Mitral Annulus (between septBasal and latBasal)
    const maSeptX = septBasalX + 3;
    const maSeptY = septBasalY;
    const maLatX = latBasalX - 2;
    const maLatY = latBasalY;

    // Tricuspid Annulus (between rvBasal and septBasal - shifted slightly more apically)
    const taRvX = rvBasalX + 3;
    const taRvY = rvBasalY;
    const taSeptX = septBasalX - 6;
    const taSeptY = septBasalY - baseSign * 8; // Normal physiological apical displacement of TV

    // Atria Basal Boundaries
    const laLength = 65;
    const raLength = 60;
    const laApexY = maLatY + baseSign * laLength;
    const raApexY = taRvY + baseSign * raLength;

    // ----------------------------------------------------
    // LAYER 0: PERICARDIAL EFFUSION & TAMPONADE ANECHOIC SPACE
    // ----------------------------------------------------
    if (isTamponade) {
      ctx.save();
      const effusionRim = 24;
      // Draw outer parietal pericardium halo enclosing the entire heart
      ctx.beginPath();
      ctx.moveTo(lvApexX, lvApexY - baseSign * (currentApexThickness + effusionRim));
      ctx.bezierCurveTo(
        latApicalX + currentLatThickness + effusionRim, latApicalY,
        latMidX + currentLatThickness + effusionRim, latMidY,
        latBasalX + currentLatThickness + effusionRim, latBasalY + baseSign * (effusionRim * 0.5)
      );
      ctx.lineTo(cx + 60, laApexY + baseSign * effusionRim);
      ctx.lineTo(cx - 65, raApexY + baseSign * effusionRim);
      ctx.lineTo(rvBasalX - (effusionRim + 8), rvBasalY + baseSign * (effusionRim * 0.5));
      ctx.bezierCurveTo(
        rvMidX - (effusionRim + 12), rvMidY,
        rvApexX - effusionRim, rvApexY,
        rvApexX - effusionRim, rvApexY - baseSign * (effusionRim * 0.5)
      );
      ctx.closePath();
      // Fluid is completely anechoic (pitch black ultrasound appearance)
      ctx.fillStyle = '#020617';
      ctx.fill();

      // Bright hyperechoic parietal pericardium reflection
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 6;
      ctx.stroke();

      // Fluid label badges
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('ANECHOIC EFFUSION (24mm)', latMidX + currentLatThickness + 6, latMidY);
      ctx.fillText('PARIETAL PERICARDIUM', rvMidX - effusionRim - 20, rvMidY);
      ctx.restore();
    }

    // ----------------------------------------------------
    // LAYER A: MYOCARDIAL MUSCLE WALLS (Backdrop Fill)
    // ----------------------------------------------------
    ctx.save();
    ctx.fillStyle = isHOCM ? '#1e1b4b' : '#1e293b'; // Dense myocardium
    ctx.strokeStyle = isHOCM ? '#4338ca' : '#334155';
    ctx.lineWidth = 1.5;

    // Draw LV Epicardium / Outer Muscle Envelope
    ctx.beginPath();
    ctx.moveTo(lvApexX, lvApexY - baseSign * currentApexThickness);
    // Outer lateral
    ctx.bezierCurveTo(
      latApicalX + currentLatThickness, latApicalY,
      latMidX + currentLatThickness, latMidY,
      latBasalX + currentLatThickness, latBasalY
    );
    // Outer basal rim
    ctx.lineTo(latBasalX, latBasalY);
    // Inner endocardium
    ctx.bezierCurveTo(
      latMidX, latMidY,
      latApicalX, latApicalY,
      lvApexX, lvApexY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw Interventricular Septum (IVS) Outer Muscle Envelope
    ctx.beginPath();
    ctx.moveTo(lvApexX, lvApexY);
    ctx.bezierCurveTo(
      cx - 2, apexY + baseSign * 45,
      septMidX, septMidY,
      septBasalX, septBasalY
    );
    ctx.lineTo(septBasalX - currentSeptThickness, septBasalY);
    ctx.bezierCurveTo(
      septMidX - currentSeptThickness, septMidY,
      cx - 2 - currentSeptThickness, apexY + baseSign * 45,
      rvApexX, rvApexY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw RV Free Wall Outer Muscle
    ctx.beginPath();
    ctx.moveTo(rvApexX, rvApexY);
    ctx.bezierCurveTo(
      rvMidX - 9, rvMidY,
      rvBasalX - 8, rvBasalY,
      rvBasalX, rvBasalY
    );
    ctx.lineTo(rvBasalX + 6, rvBasalY);
    ctx.bezierCurveTo(
      rvMidX, rvMidY,
      rvApexX + 4, rvApexY + baseSign * 8,
      rvApexX, rvApexY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // ----------------------------------------------------
    // LAYER B: ANECHOIC CHAMBER CAVITIES (Blood Pool)
    // ----------------------------------------------------
    // Left Ventricle (LV) Chamber Cavity
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lvApexX, lvApexY);
    ctx.bezierCurveTo(
      latApicalX, latApicalY,
      latMidX, latMidY,
      maLatX, maLatY
    );
    ctx.lineTo(maSeptX, maSeptY);
    ctx.bezierCurveTo(
      septBasalX, septBasalY,
      septMidX, septMidY,
      lvApexX, lvApexY
    );
    ctx.closePath();

    // Gradient filling for authentic echo cavity anechoic tone
    const lvGrad = ctx.createLinearGradient(lvApexX, lvApexY, cx + 40, maLatY);
    lvGrad.addColorStop(0, '#020617');
    lvGrad.addColorStop(1, '#050a18');
    ctx.fillStyle = lvGrad;
    ctx.fill();
    ctx.strokeStyle = '#38bdf8'; // Crisp endocardial border
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.restore();

    // ----------------------------------------------------
    // STIPPLED CYAN/BLUE ISCHEMIC ACCENT (ISCHEMIC WARPING)
    // ----------------------------------------------------
    if (ischemicWarpFactor > 0.05) {
      ctx.save();
      const warpAlpha = Math.min(ischemicWarpFactor, 1.0);

      // 1. Ischemic tissue tint (Deep cyan gradient over apex & anteroseptum)
      const ischGrad = ctx.createRadialGradient(lvApexX, lvApexY, 4, lvApexX, lvApexY + baseSign * 60, 85);
      ischGrad.addColorStop(0, `rgba(6, 182, 212, ${0.45 * warpAlpha})`);
      ischGrad.addColorStop(0.5, `rgba(14, 116, 144, ${0.35 * warpAlpha})`);
      ischGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      ctx.fillStyle = ischGrad;
      ctx.beginPath();
      ctx.moveTo(lvApexX, lvApexY - baseSign * (currentApexThickness + 3));
      ctx.bezierCurveTo(
        latApicalX + currentLatThickness, latApicalY,
        latMidX, latMidY,
        cx + 4, apexY + baseSign * (lvLengthDiastole * 0.48)
      );
      ctx.bezierCurveTo(
        septMidX - currentSeptThickness, septMidY,
        cx - 2 - currentSeptThickness, apexY + baseSign * 45,
        rvApexX, rvApexY
      );
      ctx.closePath();
      ctx.fill();

      // 2. Procedural Stippled Acoustic Speckle Pattern (Cyan & Ice-Blue dots)
      // Simulates ultrasound tissue acoustic reflectivity changes in acute ischemic myocardium
      const stippleCount = Math.round(52 * warpAlpha);
      for (let i = 0; i < stippleCount; i++) {
        const angle = ((i * 43) % 180) * (Math.PI / 180);
        const radius = 5 + ((i * 17) % 55);
        const sx = lvApexX + Math.sin(angle) * (i % 2 === 0 ? 1 : -1) * (radius * 0.65);
        const sy = lvApexY + baseSign * (Math.cos(angle) * radius);
        const dotSize = ((i % 3) + 1) * 0.95;
        const dotAlpha = (0.35 + ((i % 4) * 0.15)) * warpAlpha;

        ctx.fillStyle = i % 2 === 0 ? `rgba(6, 182, 212, ${dotAlpha})` : `rgba(56, 189, 248, ${dotAlpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Frozen Endocardial Border in Ischemic Zone (Cyan border with glow)
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.95 * warpAlpha})`;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(septMidX, septMidY);
      ctx.bezierCurveTo(
        (septMidX + lvApexX) / 2, (septMidY + lvApexY) / 2,
        lvApexX - 3, lvApexY,
        lvApexX, lvApexY
      );
      ctx.bezierCurveTo(
        lvApexX + 3, lvApexY,
        (latApicalX + lvApexX) / 2, (latApicalY + lvApexY) / 2,
        latApicalX, latApicalY
      );
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. On-screen Callout Tag for Akinesis Threshold
      if (warpAlpha >= 0.7) {
        const badgeX = lvApexX - 85;
        const badgeY = lvApexY - baseSign * 24;

        ctx.fillStyle = 'rgba(8, 47, 73, 0.92)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY - 10, 170, 20, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('⚡ LAD ISCHEMIC AKINESIS (0mm)', badgeX + 8, badgeY + 4);

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.beginPath();
        ctx.moveTo(badgeX + 85, badgeY + 10);
        ctx.lineTo(lvApexX, lvApexY - baseSign * 3);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Right Ventricle (RV) Chamber Cavity
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rvApexX, rvApexY);
    ctx.bezierCurveTo(
      rvMidX, rvMidY,
      rvBasalX, rvBasalY,
      taRvX, taRvY
    );
    ctx.lineTo(taSeptX, taSeptY);
    ctx.bezierCurveTo(
      septMidX - currentSeptThickness, septMidY,
      cx - 2 - currentSeptThickness, apexY + baseSign * 45,
      rvApexX, rvApexY
    );
    ctx.closePath();
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    // Left Atrium (LA) Cavity
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(maSeptX, maSeptY);
    ctx.lineTo(maLatX, maLatY);
    ctx.bezierCurveTo(
      maLatX + 16, maLatY + baseSign * (laLength * 0.45),
      cx + 45, laApexY,
      cx + 12, laApexY
    );
    ctx.bezierCurveTo(
      cx - 4, laApexY,
      maSeptX, maSeptY + baseSign * (laLength * 0.55),
      maSeptX, maSeptY
    );
    ctx.closePath();
    ctx.fillStyle = '#030712';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Right Atrium (RA) Cavity
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(taSeptX, taSeptY);
    ctx.lineTo(taRvX, taRvY);
    ctx.bezierCurveTo(
      taRvX - 18, taRvY + baseSign * (raLength * 0.45),
      cx - 55, raApexY,
      cx - 12, raApexY
    );
    ctx.bezierCurveTo(
      cx - 4, raApexY,
      taSeptX, taSeptY + baseSign * (raLength * 0.55),
      taSeptX, taSeptY
    );
    ctx.closePath();
    ctx.fillStyle = '#030712';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Interatrial Septum (IAS)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(maSeptX, maSeptY);
    ctx.lineTo(cx + 4, laApexY);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    // Fossa Ovalis central thinning
    ctx.beginPath();
    ctx.arc(cx + 4, (maSeptY + laApexY) / 2, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.restore();

    // ----------------------------------------------------
    // LAYER C: COLOR DOPPLER FLOW VECTOR MAPPING
    // ----------------------------------------------------
    if (doppler) {
      ctx.save();

      // Mitral diastolic inflow (modulated by respiratory cycle in Tamponade)
      const respFactor = isTamponade ? (0.65 + Math.sin(time * 0.002) * 0.38) : 1.0;
      if (valveOpenFactor > 0.10) {
        const mInflowY1 = maLatY + baseSign * 6;
        const mInflowY2 = apexY + baseSign * (lvLengthDiastole * 0.55 * respFactor);
        const mInflowX = (maSeptX + maLatX) / 2;

        const mJetGrad = ctx.createLinearGradient(mInflowX, mInflowY1, mInflowX, mInflowY2);
        mJetGrad.addColorStop(0, `rgba(239, 68, 68, ${0.75 * respFactor})`);
        mJetGrad.addColorStop(0.5, `rgba(249, 115, 22, ${0.65 * respFactor})`);
        mJetGrad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

        ctx.fillStyle = mJetGrad;
        ctx.beginPath();
        ctx.moveTo(maSeptX + 8, mInflowY1);
        ctx.lineTo(maLatX - 8, mInflowY1);
        ctx.bezierCurveTo(
          mInflowX + 26 * respFactor, mInflowY2 - baseSign * 15,
          mInflowX + 16 * respFactor, mInflowY2,
          mInflowX, mInflowY2
        );
        ctx.bezierCurveTo(
          mInflowX - 16 * respFactor, mInflowY2,
          mInflowX - 26 * respFactor, mInflowY2 - baseSign * 15,
          maSeptX + 8, mInflowY1
        );
        ctx.closePath();
        ctx.fill();

        // Tricuspid diastolic inflow
        const tInflowX = (taSeptX + taRvX) / 2;
        const tInflowY1 = taRvY + baseSign * 6;
        const tInflowY2 = apexY + baseSign * (rvLengthDiastole * 0.50);

        const tJetGrad = ctx.createLinearGradient(tInflowX, tInflowY1, tInflowX, tInflowY2);
        tJetGrad.addColorStop(0, 'rgba(239, 68, 68, 0.65)');
        tJetGrad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
        ctx.fillStyle = tJetGrad;
        ctx.beginPath();
        ctx.moveTo(taSeptX - 4, tInflowY1);
        ctx.lineTo(taRvX + 4, tInflowY1);
        ctx.lineTo(tInflowX, tInflowY2);
        ctx.closePath();
        ctx.fill();
      }

      // Dynamic subaortic LVOT mosaic jet in HOCM during systole alongside late-systolic MR stream
      if (isHOCM && systoleFactor > 0.18) {
        // High-velocity mosaic jet crowding the LVOT during rapid ejection
        const lvotStartX = septMidX + 8;
        const lvotStartY = septMidY;
        const lvotEndX = maSeptX - 2;
        const lvotEndY = maSeptY - baseSign * 35;

        const lvotGrad = ctx.createLinearGradient(lvotStartX, lvotStartY, lvotEndX, lvotEndY);
        lvotGrad.addColorStop(0, 'rgba(234, 179, 8, 0.95)'); // Turbulent yellow
        lvotGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.9)'); // Cyan
        lvotGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.9)'); // Red
        lvotGrad.addColorStop(0.85, 'rgba(168, 85, 247, 0.85)'); // Mosaic purple
        lvotGrad.addColorStop(1, 'rgba(255, 255, 255, 0.98)'); // Peak velocity white

        ctx.fillStyle = lvotGrad;
        ctx.beginPath();
        ctx.moveTo(lvotStartX - 6, lvotStartY);
        ctx.lineTo(lvotStartX + 6, lvotStartY);
        ctx.lineTo(lvotEndX + 12, lvotEndY);
        ctx.lineTo(lvotEndX - 12, lvotEndY);
        ctx.closePath();
        ctx.fill();

        // Late-systolic mitral regurgitation stream directed posteriorly into the LA
        const hocmMrLength = 54;
        const hocmMrWidth = 22;
        const hocmMrOriginX = (maSeptX + maLatX) / 2 + 6;
        const hocmMrOriginY = maSeptY;

        const hocmMrGrad = ctx.createLinearGradient(
          hocmMrOriginX,
          hocmMrOriginY,
          hocmMrOriginX + 10,
          hocmMrOriginY + baseSign * hocmMrLength
        );
        hocmMrGrad.addColorStop(0, 'rgba(56, 189, 248, 0.92)'); // Blue/cyan away
        hocmMrGrad.addColorStop(0.35, 'rgba(234, 179, 8, 0.88)'); // Turbulent mosaic yellow
        hocmMrGrad.addColorStop(0.70, 'rgba(239, 68, 68, 0.82)'); // Red
        hocmMrGrad.addColorStop(1, 'rgba(168, 85, 247, 0.10)'); // Purple tail

        ctx.fillStyle = hocmMrGrad;
        ctx.beginPath();
        ctx.moveTo(hocmMrOriginX - hocmMrWidth / 2, hocmMrOriginY);
        ctx.lineTo(hocmMrOriginX + hocmMrWidth / 2, hocmMrOriginY);
        ctx.bezierCurveTo(
          hocmMrOriginX + hocmMrWidth * 1.2,
          hocmMrOriginY + baseSign * (hocmMrLength * 0.5),
          hocmMrOriginX + 12,
          hocmMrOriginY + baseSign * hocmMrLength,
          hocmMrOriginX,
          hocmMrOriginY + baseSign * hocmMrLength
        );
        ctx.bezierCurveTo(
          hocmMrOriginX - 10,
          hocmMrOriginY + baseSign * hocmMrLength,
          hocmMrOriginX - hocmMrWidth * 0.9,
          hocmMrOriginY + baseSign * (hocmMrLength * 0.5),
          hocmMrOriginX - hocmMrWidth / 2,
          hocmMrOriginY
        );
        ctx.closePath();
        ctx.fill();
      }

      // Diastolic Aortic Regurgitation (AR) Jet in Stanford Type A Dissection
      if (isDissection && valveOpenFactor > 0.08) {
        const arOriginX = (maSeptX + taSeptX) / 2;
        const arOriginY = maSeptY;
        const arLength = 72;
        const arWidth = 28;

        const arGrad = ctx.createLinearGradient(arOriginX, arOriginY, arOriginX, arOriginY - baseSign * arLength);
        arGrad.addColorStop(0, 'rgba(234, 179, 8, 0.9)');
        arGrad.addColorStop(0.35, 'rgba(6, 182, 212, 0.85)');
        arGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.8)');
        arGrad.addColorStop(1, 'rgba(168, 85, 247, 0.05)');

        ctx.fillStyle = arGrad;
        ctx.beginPath();
        ctx.moveTo(arOriginX - arWidth / 2, arOriginY);
        ctx.lineTo(arOriginX + arWidth / 2, arOriginY);
        ctx.bezierCurveTo(
          arOriginX + arWidth * 1.3, arOriginY - baseSign * (arLength * 0.6),
          arOriginX + arWidth * 0.7, arOriginY - baseSign * arLength,
          arOriginX, arOriginY - baseSign * arLength
        );
        ctx.bezierCurveTo(
          arOriginX - arWidth * 0.7, arOriginY - baseSign * arLength,
          arOriginX - arWidth * 1.3, arOriginY - baseSign * (arLength * 0.6),
          arOriginX - arWidth / 2, arOriginY
        );
        ctx.closePath();
        ctx.fill();
      }

      // Catastrophic torrential MR jet in Papillary Muscle Rupture
      if (isFlail && systoleFactor > 0.20) {
        const mrLength = 74;
        const mrWidth = 46;
        const mrOriginX = (maSeptX + maLatX) / 2;
        const mrOriginY = maLatY;

        const mrGrad = ctx.createLinearGradient(mrOriginX, mrOriginY, mrOriginX + 14, mrOriginY + baseSign * mrLength);
        mrGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)'); // Peak velocity core
        mrGrad.addColorStop(0.2, 'rgba(6, 182, 212, 0.95)');
        mrGrad.addColorStop(0.45, 'rgba(234, 179, 8, 0.9)');
        mrGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.85)');
        mrGrad.addColorStop(0.9, 'rgba(168, 85, 247, 0.75)');
        mrGrad.addColorStop(1, 'rgba(56, 189, 248, 0.1)');

        ctx.fillStyle = mrGrad;
        ctx.beginPath();
        ctx.moveTo(mrOriginX - 12, mrOriginY);
        ctx.lineTo(mrOriginX + 12, mrOriginY);
        ctx.bezierCurveTo(
          mrOriginX + mrWidth, mrOriginY + baseSign * (mrLength * 0.5),
          mrOriginX + mrWidth * 0.9, mrOriginY + baseSign * mrLength,
          mrOriginX + 8, mrOriginY + baseSign * mrLength
        );
        ctx.bezierCurveTo(
          mrOriginX - mrWidth * 0.7, mrOriginY + baseSign * mrLength,
          mrOriginX - mrWidth * 0.8, mrOriginY + baseSign * (mrLength * 0.5),
          mrOriginX - 12, mrOriginY
        );
        ctx.closePath();
        ctx.fill();
      } else if (preset.hasMitralRegurgitation && systoleFactor > 0.35) {
        // Standard Systolic Mitral Regurgitation Jet
        const mrSeverity = preset.mrSeverity;
        const mrLength = mrSeverity === 'Severe' ? 52 : mrSeverity === 'Moderate' ? 38 : 22;
        const mrWidth = mrSeverity === 'Severe' ? 24 : mrSeverity === 'Moderate' ? 16 : 10;
        const mrOriginX = (maSeptX + maLatX) / 2;
        const mrOriginY = maSeptY;

        const mrGrad = ctx.createLinearGradient(mrOriginX, mrOriginY, mrOriginX, mrOriginY + baseSign * mrLength);
        mrGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)'); // Cyan/Blue away
        mrGrad.addColorStop(0.4, 'rgba(234, 179, 8, 0.75)'); // Turbulent mosaic yellow
        mrGrad.addColorStop(0.8, 'rgba(168, 85, 247, 0.65)'); // Mosaic purple
        mrGrad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');

        ctx.fillStyle = mrGrad;
        ctx.beginPath();
        ctx.moveTo(mrOriginX - mrWidth / 2, mrOriginY);
        ctx.lineTo(mrOriginX + mrWidth / 2, mrOriginY);
        ctx.bezierCurveTo(
          mrOriginX + mrWidth * 1.3, mrOriginY + baseSign * (mrLength * 0.6),
          mrOriginX + mrWidth * 0.8, mrOriginY + baseSign * mrLength,
          mrOriginX, mrOriginY + baseSign * mrLength
        );
        ctx.bezierCurveTo(
          mrOriginX - mrWidth * 0.8, mrOriginY + baseSign * mrLength,
          mrOriginX - mrWidth * 1.3, mrOriginY + baseSign * (mrLength * 0.6),
          mrOriginX - mrWidth / 2, mrOriginY
        );
        ctx.closePath();
        ctx.fill();
      }

      // Doppler Nyquist Velocity Bar (+64 to -64 cm/s)
      const barX = w - 42;
      const barY = isApexTop ? 55 : 85;
      const barW = 10;
      const barH = 100;

      const nyquistGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
      nyquistGrad.addColorStop(0, '#f59e0b'); // +64 (Yellow/Orange)
      nyquistGrad.addColorStop(0.25, '#ef4444'); // Red
      nyquistGrad.addColorStop(0.5, '#020617'); // 0 baseline
      nyquistGrad.addColorStop(0.75, '#2563eb'); // Blue
      nyquistGrad.addColorStop(1, '#06b6d4'); // -64 (Cyan)

      ctx.fillStyle = nyquistGrad;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText('+64', barX - 18, barY + 8);
      ctx.fillText('0', barX - 12, barY + barH / 2 + 3);
      ctx.fillText('-64', barX - 18, barY + barH);
      ctx.fillText('cm/s', barX - 22, barY + barH + 12);

      ctx.restore();
    }

    // ----------------------------------------------------
    // LAYER D: VALVULAR APPARATUS & CHORDAE
    // ----------------------------------------------------
    ctx.save();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#f8fafc'; // Echogenic bright white leaflet tissue

    // Mitral Valve Leaflets
    const mvCenterMidX = (maSeptX + maLatX) / 2;
    const mvCenterMidY = (maSeptY + maLatY) / 2;
    // Leaflet opening distance into the LV cavity
    const mvLeafletSwing = -baseSign * (valveOpenFactor * 26);
    const mvLeafletSpread = valveOpenFactor * 14;

    // Anterior Mitral Leaflet (AML, attached to septal annulus)
    // In HOCM, SAM pulls the anterior leaflet anteriorly toward the septum during systole
    const isSam = isHOCM && systoleFactor > 0.15;
    const amlTipX = isSam
      ? septMidX + 4
      : mvCenterMidX - (valveOpenFactor > 0.1 ? mvLeafletSpread * 0.9 : 0);
    const amlTipY = isSam
      ? septMidY - baseSign * 4
      : mvCenterMidY + mvLeafletSwing * 0.8;

    ctx.beginPath();
    ctx.moveTo(maSeptX, maSeptY);
    ctx.quadraticCurveTo(
      isSam ? (maSeptX + amlTipX) / 2 : mvCenterMidX - mvLeafletSpread,
      isSam ? (maSeptY + amlTipY) / 2 : mvCenterMidY + mvLeafletSwing,
      amlTipX,
      amlTipY
    );
    ctx.stroke();

    // Posterior Mitral Leaflet (PML, attached to lateral annulus)
    // In Papillary Muscle Rupture, the leaflet flails into the LA during systole
    const isPmlFlail = isFlail && systoleFactor > 0.15;
    const pmlTipX = isPmlFlail
      ? mvCenterMidX + Math.sin(time * 0.03) * 12
      : mvCenterMidX + (valveOpenFactor > 0.1 ? mvLeafletSpread * 0.7 : 0);
    const pmlTipY = isPmlFlail
      ? maLatY + baseSign * (26 + Math.sin(time * 0.025) * 8)
      : mvCenterMidY + mvLeafletSwing * 0.6;

    ctx.beginPath();
    ctx.moveTo(maLatX, maLatY);
    ctx.quadraticCurveTo(
      isPmlFlail ? (maLatX + pmlTipX) / 2 : mvCenterMidX + mvLeafletSpread,
      isPmlFlail ? (maLatY + pmlTipY) / 2 : mvCenterMidY + mvLeafletSwing * 0.7,
      pmlTipX,
      pmlTipY
    );
    ctx.stroke();

    // Papillary Muscles & Chordae Tendineae
    const papAnterolateralX = latMidX - 14;
    const papAnterolateralY = latMidY - baseSign * 8;
    const papPosteromedialX = isFlail 
      ? septMidX + 14 + Math.sin(time * 0.025) * 6 
      : septMidX + 16;
    const papPosteromedialY = isFlail 
      ? septMidY + baseSign * (systoleFactor * 16) 
      : septMidY - baseSign * 6;

    ctx.fillStyle = isFlail ? '#f43f5e' : '#334155';
    ctx.beginPath();
    ctx.arc(papAnterolateralX, papAnterolateralY, 4, 0, Math.PI * 2);
    ctx.arc(papPosteromedialX, papPosteromedialY, isFlail ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();

    // Delicate chordae tendineae
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.4)';
    ctx.beginPath();
    ctx.moveTo(papAnterolateralX, papAnterolateralY);
    ctx.lineTo(mvCenterMidX + 4, mvCenterMidY + mvLeafletSwing * 0.5);
    if (!isFlail) {
      ctx.moveTo(papPosteromedialX, papPosteromedialY);
      ctx.lineTo(mvCenterMidX - 4, mvCenterMidY + mvLeafletSwing * 0.5);
    } else {
      // Snapped chordae curling
      ctx.moveTo(papPosteromedialX, papPosteromedialY);
      ctx.lineTo(papPosteromedialX - 6, papPosteromedialY - baseSign * 6);
    }
    ctx.stroke();

    // Stanford Type A Aortic Root & Intimal Flap
    if (isDissection) {
      const aortaRootLeftX = septBasalX - 18;
      const aortaRootRightX = maSeptX + 18;
      const aortaRootY1 = septBasalY;
      const aortaRootY2 = septBasalY + baseSign * 46;

      // Dilated Aortic Root Silhouette
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(aortaRootLeftX, aortaRootY1);
      ctx.lineTo(aortaRootLeftX - 6, aortaRootY2);
      ctx.moveTo(aortaRootRightX, aortaRootY1);
      ctx.lineTo(aortaRootRightX + 6, aortaRootY2);
      ctx.stroke();

      // High frequency fluttering intimal flap
      const flapWave = Math.sin(time * 0.038 + cyclePhase * 22) * 8;
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo((aortaRootLeftX + aortaRootRightX) / 2 + flapWave * 0.4, aortaRootY1);
      ctx.bezierCurveTo(
        (aortaRootLeftX + aortaRootRightX) / 2 + flapWave,
        aortaRootY1 + baseSign * 16,
        (aortaRootLeftX + aortaRootRightX) / 2 - flapWave,
        aortaRootY1 + baseSign * 30,
        (aortaRootLeftX + aortaRootRightX) / 2 + flapWave * 0.6,
        aortaRootY2
      );
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('INTIMAL FLAP', (aortaRootLeftX + aortaRootRightX) / 2 + 10, aortaRootY1 + baseSign * 22);
    }

    // Tricuspid Valve Leaflets
    const tvCenterMidX = (taSeptX + taRvX) / 2;
    const tvCenterMidY = (taSeptY + taRvY) / 2;
    const tvLeafletSwing = -baseSign * (valveOpenFactor * 22);
    const tvLeafletSpread = valveOpenFactor * 12;

    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#f8fafc';
    // Septal leaflet
    ctx.beginPath();
    ctx.moveTo(taSeptX, taSeptY);
    ctx.lineTo(tvCenterMidX - (valveOpenFactor > 0.1 ? tvLeafletSpread : 0), tvCenterMidY + tvLeafletSwing * 0.7);
    ctx.stroke();
    // Anterior leaflet
    ctx.beginPath();
    ctx.moveTo(taRvX, taRvY);
    ctx.lineTo(tvCenterMidX + (valveOpenFactor > 0.1 ? tvLeafletSpread : 0), tvCenterMidY + tvLeafletSwing * 0.7);
    ctx.stroke();

    ctx.restore();

    // ----------------------------------------------------
    // LAYER E: SEGMENTAL WALL MOTION ABNORMALITY HEATMAP
    // ----------------------------------------------------
    if (heatmap) {
      ctx.save();
      const getSegmentColor = (score: number, excursion: number) => {
        if (excursion > 1.35) return 'rgba(56, 189, 248, 0.9)'; // Cyan/Blue = Hyperdynamic compensatory
        if (score === 1) return 'rgba(34, 197, 94, 0.85)'; // Green = Normal
        if (score === 2) return 'rgba(234, 179, 8, 0.9)';   // Yellow/Amber = Hypokinetic
        if (score === 3) return 'rgba(239, 68, 68, 0.95)';  // Crimson = Akinetic
        if (score >= 4) return 'rgba(168, 85, 247, 0.95)'; // Purple = Dyskinetic / Aneurysmal
        return 'rgba(34, 197, 94, 0.85)';
      };

      const segmentPills = [
        { name: 'Apex', x: lvApexX, y: lvApexY - baseSign * 8, seg: segs.apex },
        { name: 'Apical Sept', x: cx + 2, y: apexY + baseSign * (lvLengthDiastole * 0.26), seg: segs.apicalSeptal },
        { name: 'Mid Sept', x: septMidX, y: septMidY, seg: segs.midSeptal },
        { name: 'Basal Sept', x: septBasalX, y: septBasalY, seg: segs.basalSeptal },
        { name: 'Apical Lat', x: latApicalX, y: latApicalY, seg: segs.apicalLateral },
        { name: 'Mid Lat', x: latMidX, y: latMidY, seg: segs.midLateral },
        { name: 'Basal Lat', x: latBasalX, y: latBasalY, seg: segs.basalLateral },
        { name: 'RV Free', x: rvMidX, y: rvMidY, seg: segs.rvFreeWall },
      ];

      segmentPills.forEach(p => {
        const color = getSegmentColor(p.seg.score, p.seg.radialExcursion);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing glow ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7.5, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.restore();
    }

    // ----------------------------------------------------
    // LAYER F: CLINICAL ANATOMICAL LABELS
    // ----------------------------------------------------
    if (labels) {
      ctx.save();
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';

      // Left Ventricle (LV)
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('LV', cx + 36, apexY + baseSign * (lvLengthDiastole * 0.44));

      // Right Ventricle (RV)
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('RV', cx - 44, apexY + baseSign * (rvLengthDiastole * 0.44));

      // Left Atrium (LA)
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('LA', cx + 34, maLatY + baseSign * 32);

      // Right Atrium (RA)
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('RA', cx - 38, taRvY + baseSign * 30);

      // Valve Annotations
      ctx.font = '9px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('MV', mvCenterMidX + 18, mvCenterMidY + baseSign * 6);
      ctx.fillText('TV', tvCenterMidX - 18, tvCenterMidY + baseSign * 6);

      ctx.restore();
    }

    // Pulsing target ring for user-inspected segment from WmsiVisualMatrix
    if (inspectedKey) {
      ctx.save();
      let targetX = lvApexX;
      let targetY = lvApexY;
      let targetLabel = '';
      if (inspectedKey === 'basalSeptal') {
        targetX = septBasalX;
        targetY = septBasalY;
        targetLabel = 'Basal Septum (ASE 1)';
      } else if (inspectedKey === 'midSeptal') {
        targetX = septMidX;
        targetY = septMidY;
        targetLabel = 'Mid Septum (ASE 2)';
      } else if (inspectedKey === 'apicalSeptal') {
        targetX = lvApexX;
        targetY = lvApexY;
        targetLabel = 'Apical Septum & Apex (ASE 3)';
      } else if (inspectedKey === 'lateral') {
        targetX = latBasalX;
        targetY = latBasalY;
        targetLabel = 'Lateral Wall (ASE 4)';
      }

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(targetLabel, targetX, targetY - baseSign * 18);
      ctx.restore();
    }

    ctx.restore();
  };

  // Synchronized Dynamic ECG Rhythm Strip at Canvas Bottom
  const drawSynchronizedECGStrip = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number
  ) => {
    ctx.save();
    const stripH = 46;
    const stripY = h - stripH;

    // Background banner
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(0, stripY, w, stripH);
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, stripY, w, stripH);

    // Title label
    ctx.fillStyle = '#22c55e';
    ctx.font = '9px monospace';
    ctx.fillText('LEAD II (SYNCHRONIZED)', 14, stripY + 12);

    const baselineY = stripY + 28;
    const stepPx = 2;

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
    ctx.shadowBlur = 4;
    ctx.beginPath();

    let first = true;
    for (let x = 0; x < w; x += stepPx) {
      // Phase across screen with sweep
      const phase = ((x / (w * 0.75)) + t) % 1.0;
      let mv = 0;

      // P wave (diastolic atrial contraction: t ~ 0.88 - 0.96)
      if (phase >= 0.88 && phase < 0.96) {
        mv = 0.18 * Math.sin(((phase - 0.88) / 0.08) * Math.PI);
      }
      // QRS Complex (onset of systole: t ~ 0.98 - 0.06)
      else if (phase >= 0.98 || phase < 0.06) {
        const qrsPhase = phase >= 0.98 ? (phase - 0.98) / 0.08 : (phase + 0.02) / 0.08;
        if (qrsPhase < 0.25) mv = -0.15;
        else if (qrsPhase < 0.65) mv = 1.25; // Tall R-wave
        else mv = -0.35; // S-wave
      }
      // T wave (end of systole / repolarization: t ~ 0.22 - 0.36)
      else if (phase >= 0.22 && phase < 0.36) {
        mv = 0.32 * Math.sin(((phase - 0.22) / 0.14) * Math.PI);
      }

      const py = baselineY - (mv * 14);
      if (first) {
        ctx.moveTo(x, py);
        first = false;
      } else {
        ctx.lineTo(x, py);
      }
    }
    ctx.stroke();

    // Vertical sweep cursor indicating active echo frame position in cardiac cycle
    const cursorX = (t * (w * 0.75)) % w;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(cursorX, stripY);
    ctx.lineTo(cursorX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  };

  // Mechanical Calipers Visualizer (Measurement Mode)
  const drawCalipers = (
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    distMm: number
  ) => {
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosshairs
    [p1, p2].forEach((p, idx) => {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 7, p.y);
      ctx.lineTo(p.x + 7, p.y);
      ctx.moveTo(p.x, p.y - 7);
      ctx.lineTo(p.x, p.y + 7);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(idx === 0 ? 'D1' : 'D2', p.x + 8, p.y - 8);
    });

    // Distance Badge
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.fillRect(midX - 36, midY - 10, 72, 20);
    ctx.strokeRect(midX - 36, midY - 10, 72, 20);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${distMm} mm`, midX, midY + 4);

    ctx.restore();
  };

  // Anatomical Hit Detection for Interactive Segments on A4C Canvas
  const getSegmentHit = useCallback((mx: number, my: number): 'apicalSeptal' | 'midSeptal' | 'basalSeptal' | 'lateral' | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = 480;

    const cx = w / 2;
    const apexY = isApexTop ? 65 : h - 75;
    const baseSign = isApexTop ? 1 : -1;
    const isDilated = dynamicPresetState.effectivePreset.isDilatedChambers;
    const isLVH = dynamicPresetState.effectivePreset.isConcentricLVH;
    const lvLengthDiastole = isDilated ? 185 : 170;
    const lvWidthDiastole = isDilated ? 104 : isLVH ? 72 : 84;

    const targets: Array<{ key: 'apicalSeptal' | 'midSeptal' | 'basalSeptal' | 'lateral'; x: number; y: number; radius: number }> = [
      { key: 'apicalSeptal', x: cx + 8, y: apexY + baseSign * 18, radius: 46 },
      { key: 'midSeptal', x: cx - 2, y: apexY + baseSign * (lvLengthDiastole * 0.48), radius: 44 },
      { key: 'basalSeptal', x: cx - 4, y: apexY + baseSign * (lvLengthDiastole * 0.94), radius: 44 },
      { key: 'lateral', x: cx + (lvWidthDiastole * 0.85), y: apexY + baseSign * (lvLengthDiastole * 0.65), radius: 48 },
    ];

    for (const t of targets) {
      const dist = Math.hypot(mx - t.x, my - t.y);
      if (dist <= t.radius) {
        return t.key;
      }
    }
    return null;
  }, [isApexTop, dynamicPresetState.effectivePreset]);

  // Canvas Mouse / Touch Handlers for Dragging Calipers and Segment Hover/Click
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (showCalipers && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const d1 = Math.hypot(mx - caliperP1.x, my - caliperP1.y);
      const d2 = Math.hypot(mx - caliperP2.x, my - caliperP2.y);

      if (d1 < 20) {
        setActiveDragCaliper('P1');
        return;
      } else if (d2 < 20) {
        setActiveDragCaliper('P2');
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (showCalipers && activeDragCaliper) {
      canvasRef.current.style.cursor = 'grabbing';
      let newP1 = caliperP1;
      let newP2 = caliperP2;

      if (activeDragCaliper === 'P1') {
        newP1 = { x: mx, y: my };
        setCaliperP1(newP1);
      } else {
        newP2 = { x: mx, y: my };
        setCaliperP2(newP2);
      }

      const pxDist = Math.hypot(newP2.x - newP1.x, newP2.y - newP1.y);
      const mm = Math.round(pxDist * 0.55);
      setCaliperDistMm(mm);
      return;
    }

    if (showCalipers) {
      const d1 = Math.hypot(mx - caliperP1.x, my - caliperP1.y);
      const d2 = Math.hypot(mx - caliperP2.x, my - caliperP2.y);
      if (d1 < 20 || d2 < 20) {
        canvasRef.current.style.cursor = 'crosshair';
        return;
      }
    }

    // Segment Hover Hit Testing
    const hitKey = getSegmentHit(mx, my);
    if (hitKey) {
      setHoveredSegmentKey(hitKey);
      canvasRef.current.style.cursor = 'pointer';
    } else {
      if (hoveredSegmentKey) setHoveredSegmentKey(null);
      canvasRef.current.style.cursor = 'default';
    }
  };

  const handleCanvasMouseUp = () => {
    setActiveDragCaliper(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (showCalipers && activeDragCaliper) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hitKey = getSegmentHit(mx, my);
    if (hitKey) {
      setInspectedSegmentKey(prev => prev === hitKey ? null : hitKey);
    }
  };

  // Generate AI Comprehensive Echocardiogram Consultation Report
  const handleGenerateAiReport = async () => {
    setIsGeneratingAiReport(true);
    try {
      const response = await fetch('/api/echo/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientContext: {
            name: patient?.name || 'Elena V.',
            age: patient?.age || 34,
            gender: patient?.gender || 'female',
            vitals: {
              heartRate,
              sbp: patient?.vitals?.sbp || 118,
              dbp: patient?.vitals?.dbp || 76,
            },
          },
          preset: dynamicPresetState.effectivePreset,
          hemodynamics: {
            calculatedEF: dynamicPresetState.effectiveEF,
            edv: dynamicPresetState.effectivePreset.edv,
            esv: dynamicPresetState.effectivePreset.esv,
            strokeVolumeMl: currentCardiacCycle.strokeVolumeMl,
            cardiacOutputLMin: currentCardiacCycle.cardiacOutputLMin,
            cardiacIndex: currentCardiacCycle.cardiacIndex,
            heartRate,
          },
          dynamicSegments: dynamicPresetState.fourSegments,
          ischemiaDurationMinutes,
          dopplerData: {
            eToARatio: '1.25',
            eToEPrime: ischemiaDurationMinutes > 20 ? '12.8' : '8.4',
            regurgitantVolume: dynamicPresetState.effectivePreset.mrSeverity === 'Severe' ? '52 mL' : dynamicPresetState.effectivePreset.mrSeverity === 'Moderate' ? '34 mL' : '0 mL',
          },
        }),
      });

      const data = await response.json();
      if (data && data.echoReport) {
        setAiReport(data.echoReport);
        setActiveInfoTab('report');
      } else {
        setAiReport(generateLocalEchoReport(dynamicPresetState.effectivePreset, currentCardiacCycle, heartRate));
        setActiveInfoTab('report');
      }
    } catch (err) {
      console.warn('AI report generation error, providing local expert consensus report:', err);
      setAiReport(generateLocalEchoReport(dynamicPresetState.effectivePreset, currentCardiacCycle, heartRate));
      setActiveInfoTab('report');
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  // Local fallback ASE compliant clinical echo report generator
  const generateLocalEchoReport = (
    preset: EchoPreset,
    hemodynamics: { calculatedEF: number; strokeVolumeMl: number; cardiacOutputLMin: number; cardiacIndex: number },
    hr: number
  ) => {
    const pName = patient?.name || 'Elena V.';
    const pAge = patient?.age || 34;
    const pGender = patient?.gender ? (String(patient.gender).toLowerCase().startsWith('f') ? 'F' : 'M') : 'F';
    const sbp = patient?.vitals?.sbp || 118;
    const dbp = patient?.vitals?.dbp || 76;
    const map = Math.round((Number(sbp) + 2 * Number(dbp)) / 3);

    const bSeg = dynamicPresetState.fourSegments.basalSeptal;
    const mSeg = dynamicPresetState.fourSegments.midSeptal;
    const aSeg = dynamicPresetState.fourSegments.apicalSeptal;
    const lSeg = dynamicPresetState.fourSegments.lateral;

    const isHOCM = preset.id === 'hocm';
    const isTamponade = preset.id === 'pericardial-tamponade';
    const isDissection = preset.id === 'aortic-dissection-type-a';
    const isFlail = preset.id === 'papillary-muscle-rupture';
    const isLAD = preset.coronaryArtery.includes('LAD') || preset.id === 'stemi-anterior-lad';
    const isSCAD = preset.name.includes('SCAD') || preset.name.includes('Spontaneous');
    const isTakotsubo = preset.name.includes('Takotsubo');

    const regVol = preset.mrSeverity === 'Severe' ? '52 mL' : preset.mrSeverity === 'Moderate' ? '34 mL' : preset.mrSeverity === 'Mild' ? '14 mL' : '0 mL';
    const venaContracta = preset.mrSeverity === 'Severe' ? '0.74 cm' : preset.mrSeverity === 'Moderate' ? '0.42 cm' : preset.mrSeverity === 'Mild' ? '0.22 cm' : 'None';

    let diagnosticSummary = `Non-ischemic myocardial pattern with LVEF ${hemodynamics.calculatedEF}% and WMSI ${dynamicPresetState.dynamicWmsi.toFixed(2)}. Correlate with underlying clinical presentation and biomarker surveillance.`;
    let actionPlan = `Activate Emergent Invasive Angiography / Primary PCI pathway if acute coronary syndrome suspected. Serial hs-cTnI monitoring.`;

    if (isHOCM) {
      diagnosticSummary = `Asymmetric septal hypertrophy (IVSd 22 mm, ratio >1.5) with dynamic Left Ventricular Outflow Tract (LVOT) obstruction and Systolic Anterior Motion (SAM) of the anterior mitral leaflet. High peak subaortic systolic gradients with late-systolic mitral regurgitation. Substantial risk of exertion-triggered lethal ventricular arrhythmias and sudden cardiac death.`;
      actionPlan = `1. Discontinue positive inotropes and vasodilators immediately (avoid preload reduction).\n   2. Initiate beta-blocker therapy (e.g., Metoprolol/Bisoprolol) to prolong diastole and diminish LVOT gradient.\n   3. Urgent cardiology consultation for ICD implantation stratification and evaluation for septal reduction therapy (surgical myectomy vs. alcohol septal ablation).`;
    } else if (isTamponade) {
      diagnosticSummary = `Large circumferential pericardial effusion (>24 mm) with overt features of **Cardiac Tamponade**. Notable late-diastolic right atrial collapse (>1/3 cardiac cycle), early-diastolic right ventricular free wall collapse, and marked respiratory variation of transvalvular Doppler inflow (>25% mitral variation). Manifesting obstructive shock and hemodynamic collapse.`;
      actionPlan = `1. Immediate bedside emergent subxiphoid pericardiocentesis under direct echocardiographic guidance.\n   2. Aggressive intravenous crystalloid volume loading (500-1000 mL) to sustain right ventricular preload pending drainage.\n   3. Strictly avoid positive-pressure mechanical ventilation if possible, which exacerbates RV preload compromise.`;
    } else if (isDissection) {
      diagnosticSummary = `Dilated ascending aorta root (48 mm) with a dynamic high-frequency fluttering **intimal flap** originating at the sinotubular junction, consistent with **Stanford Type A Acute Aortic Dissection**. Severe secondary aortic regurgitation due to commissural disruption, creating acute volume overload of the left ventricle with emergent risk of rupture into pericardial space.`;
      actionPlan = `1. Immediate emergent cardiothoracic surgical consultation for ascending aortic graft replacement / hemiarch repair.\n   2. Immediate intravenous anti-impulse therapy: IV Esmolol / Labetalol to lower heart rate (<60 BPM) and SBP (100-120 mmHg, dP/dt reduction).\n   3. Emergency CT Angiography of Chest/Abdomen/Pelvis if patient remains hemodynamically stable en route to OR.`;
    } else if (isFlail) {
      diagnosticSummary = `Acute flail posterior mitral valve leaflet prolapsing completely into the left atrium during systole with snapped chordae tendineae, secondary to **Posteromedial Papillary Muscle Rupture** following acute inferior/posterior myocardial infarction. Torrential acute mitral regurgitation (Regurgitant Volume 74 mL) provoking acute pulmonary edema and cardiogenic shock.`;
      actionPlan = `1. Emergent cardiothoracic surgical consultation for urgent mitral valve replacement / repair.\n   2. Hemodynamic stabilization with emergent Intra-Aortic Balloon Pump (IABP) counterpulsation or Impella to reduce afterload and regurgitant fraction.\n   3. Invasive arterial line and pulmonary artery catheter monitoring, avoiding high SVR states.`;
    } else if (isSCAD) {
      diagnosticSummary = `Findings in a young female patient presenting with acute localized regional wall motion abnormalities are highly suspicious for **Spontaneous Coronary Artery Dissection (SCAD)** of the mid-to-distal LAD. Conservative medical management is preferred over aggressive balloon angioplasty unless ongoing hemodynamic instability is noted.`;
      actionPlan = `1. Conservative inpatient monitoring with blood pressure control (target SBP < 120 mmHg).\n   2. Dual antiplatelet therapy and beta-blocker titration to decrease coronary wall shear stress.`;
    } else if (isTakotsubo) {
      diagnosticSummary = `Characteristic apical ballooning with preserved basal hyperkinesis strongly indicates **Stress-Induced (Takotsubo) Cardiomyopathy**. In the absence of obstructive coronary disease on angiography, mechanical supportive management is indicated.`;
      actionPlan = `1. Conservative supportive therapy and gentle heart failure management (ACE-inhibitors/ARBs).\n   2. Serial follow-up echocardiograms at 4-8 weeks to confirm functional myocardial recovery.`;
    } else if (isLAD) {
      diagnosticSummary = `Acute regional wall motion abnormality in the apex, apical-septum, and mid-septum conforming directly to **Proximal-to-Mid Left Anterior Descending (LAD) Coronary Artery Territory**. Ischemic duration modeled at **${ischemiaDurationMinutes} minutes** demonstrates ${dynamicPresetState.isElectroMechanicalLag ? "Electro-Mechanical Lag Phase: Normal kinetic contraction despite acute ECG changes" : ischemiaDurationMinutes <= 20 ? "Transitional ischemic phase with progressive hypokinesis" : "Transmural ischemic necrosis with dense akinesis and myocardial acoustic speckling"}.`;
      actionPlan = `1. Activate Emergent Invasive Angiography / Primary PCI pathway if acute LAD thrombotic occlusion suspected.\n   2. Serial high-sensitivity Cardiac Troponin (hs-cTnI) monitoring at 0h and 1h intervals.\n   3. Immediate guideline-directed medical therapy (aspirin 325 mg, P2Y12 inhibitor loading, parenteral anticoagulation).`;
    }

    return `### AMERICAN SOCIETY OF ECHOCARDIOGRAPHY (ASE) COMPREHENSIVE TTE REPORT
**Study Type:** Transthoracic Echocardiogram (Apical 4-Chamber Focused Simulation)
**Accreditation Level:** Intersocietal Accreditation Commission (IAC) Adult Echocardiography Standard
**Indication:** Evaluation of Acute Chest Oppression & Dynamic Wall Motion Abnormalities in ${preset.name}

---

#### 1. Demographics & Hemodynamics
- **Patient Demographics:** ${pName}, ${pAge}${pGender} | **Bedside Vitals:** Heart Rate ${hr} BPM, Blood Pressure ${sbp}/${dbp} mmHg (MAP ${map} mmHg)
- **Biplane Simpson’s Volumetric Assessment:**
  - **Left Ventricular Ejection Fraction (LVEF):** **${hemodynamics.calculatedEF}%** (${hemodynamics.calculatedEF >= 70 ? "Hyperdynamic" : hemodynamics.calculatedEF >= 52 ? "Preserved" : hemodynamics.calculatedEF >= 40 ? "Mild-to-Moderate Systolic Dysfunction" : "Severe Systolic Impairment / HFrEF"})
  - **End-Diastolic Volume (EDV):** ${preset.edv} mL (BSA-indexed: ${(preset.edv / 1.9).toFixed(1)} mL/m², Reference: 47-92 mL/m²)
  - **End-Systolic Volume (ESV):** ${preset.esv} mL (BSA-indexed: ${(preset.esv / 1.9).toFixed(1)} mL/m², Reference: 18-38 mL/m²)
  - **Stroke Volume (SV):** ${hemodynamics.strokeVolumeMl} mL | **Cardiac Output (CO):** ${hemodynamics.cardiacOutputLMin} L/min | **Cardiac Index (CI):** ${hemodynamics.cardiacIndex} L/min/m² (Normal: 2.5 - 4.0 L/min/m²)

---

#### 2. 2D Structural Findings
- **Chamber Dimensions & Remodeling:**
  - **Left Ventricular Internal Diameter (LVIDd):** ${preset.isDilatedChambers ? "56 mm (Dilated)" : isHOCM ? "38 mm (Small, Hypertrophied)" : "48 mm (Normal cavity caliber)"}
  - **Interventricular Septal Thickness (IVSd):** ${isHOCM ? "22 mm (Severe Asymmetric Hypertrophy)" : preset.isConcentricLVH ? "14 mm (Concentric Hypertrophy)" : "10 mm (Normal limit 6-10 mm)"}
  - **Posterior/Lateral Wall Thickness (LVPWd):** ${isHOCM ? "10 mm" : preset.isConcentricLVH ? "13 mm" : "9 mm (Normal limit 6-10 mm)"}
- **ASE 17-Segment Regional Wall Motion Classification:**
  - **Wall Motion Score Index (WMSI):** **${dynamicPresetState.dynamicWmsi.toFixed(2)}** (Reference: 1.00 = Normal contraction; >1.70 indicates extensive ischemic territory)
  - **Basal-Septal Segment (ASE #1):** **${bSeg.label}** (Score ${bSeg.score}) — Radial excursion: ${bSeg.excursion.toFixed(2)}x
  - **Mid-Anteroseptal Segment (ASE #2):** **${mSeg.label}** (Score ${mSeg.score}) — Radial excursion: ${mSeg.excursion.toFixed(2)}x | ${mSeg.score >= 3 ? "Marked akinesis with cellular glycogen depletion" : "Preserved reserve"}
  - **Apical-Septal & Apex Segments (ASE #13 & #17):** **${aSeg.label}** (Score ${aSeg.score}) — Radial excursion: ${aSeg.excursion.toFixed(2)}x | ${aSeg.score >= 3 ? "Complete transmural akinesis with paradoxical systolic hinge" : "Adequate apical tethering"}
  - **Mid/Basal-Lateral Free Wall (ASE #5 & #6):** **${lSeg.label}** (Score ${lSeg.score}) — Compensatory hyperdynamic systolic inward excursion (${lSeg.excursion.toFixed(2)}x) maintaining systemic stroke volume via Frank-Starling recruitment.
- **Right Ventricle & Atria:** ${isTamponade ? "Early diastolic right ventricular free wall collapse; late diastolic right atrial collapse (>34% of cardiac cycle). Diagnostic of tamponade physiology." : "RV cavity dimensions within normal parameters; TAPSE ~22 mm; preserved right ventricular systolic longitudinal strain. Left and right atrial volumes morphologically preserved."}

---

#### 3. Color Doppler Telemetry
- **Mitral Inflow Dynamics:**
  - **Peak Early Filling Velocity (E-wave):** 0.78 m/s
  - **Late Atrial Kick Velocity (A-wave):** 0.62 m/s
  - **Mitral E/A Ratio:** 1.25 (Normal adult pattern: 0.8 - 1.5)
  - **Tissue Doppler Medial Annular E/e' Ratio:** ${isLAD && ischemiaDurationMinutes > 20 ? "12.8" : isHOCM ? "16.4" : "8.4"}
  - **Deceleration Time (DT):** ${isFlail ? "110 ms (Restrictive Filling)" : "184 ms"}
- **Valvular Regurgitation Telemetry:**
  - **Mitral Regurgitation Jet Severity:** **${preset.mrSeverity}**
  - **Regurgitant Volume:** ${regVol} | **Vena Contracta Width:** ${venaContracta}
  - **Mechanism:** ${isFlail ? "Flail posterior mitral leaflet with ruptured posteromedial chordae tendineae causing catastrophic eccentric MR jet." : isHOCM ? "Systolic anterior motion (SAM) of the mitral valve creating dynamic subaortic obstruction and late systolic MR." : preset.mrSeverity === "None" ? "Physiologic coaptation without systolic jet." : "Secondary ischemic functional mitral regurgitation with posterior tethering of the anterior mitral leaflet."}
  - **Aortic & Tricuspid Telemetry:** ${isDissection ? "Severe central and eccentric diastolic aortic regurgitation jet due to intimal flap disruption of aortic valve commissures." : "Physiologic forward flow without stenosis or pathological regurgitant jets. Estimated pulmonary artery systolic pressure (PASP): 26 mmHg."}

---

#### 4. Clinical Conclusion
1. **Diagnostic Correlation:**
   ${diagnosticSummary}
2. **Electro-Mechanical Concordance:**
   - Pre-cardiac catheterization correlation: Correlate ST-segment vectors and hemodynamic profiles with observed kinetic behavior.
3. **Bedside Action Plan:**
   ${actionPlan}`;
  };

  const activeSegmentKey = inspectedSegmentKey || hoveredSegmentKey;
  const segDetails = useMemo(() => {
    if (!activeSegmentKey) return null;
    const seg = dynamicPresetState.fourSegments[activeSegmentKey as keyof typeof dynamicPresetState.fourSegments];
    if (!seg) return null;

    let aseName = '';
    let aseNumber = '';
    let vesselTerritory = '';
    let kinematicSummary = '';
    let pathophysiology = '';
    let teachingPearl = '';

    if (activeSegmentKey === 'midSeptal') {
      aseName = 'Mid-Anteroseptal Wall';
      aseNumber = 'ASE Segment #2';
      vesselTerritory = 'LAD (1st Septal Perforator Artery)';
      kinematicSummary = `Mid-Septal Wall: ${seg.score === 3 ? 'Akinetic (Score 3)' : seg.score === 2 ? 'Hypokinetic (Score 2)' : 'Normal (Score 1)'} due to regional microvascular ischemia secondary to proximal vessel obstruction.`;
      pathophysiology = 'Acute subendocardial hypoperfusion causes rapid high-energy phosphate (ATP) depletion, arresting actin-myosin cross-bridge recycling. Systolic inward excursion is abolished while diastolic relaxation fails.';
      teachingPearl = 'Diagnostic Teaching Pearl: Correlate with ECG precordial leads V1-V3. Note the electro-mechanical lag: ST elevation manifests within 60-120 seconds, but macroscopic mechanical akinesis takes >10-20 minutes of sustained ischemia.';
    } else if (activeSegmentKey === 'apicalSeptal') {
      aseName = 'Apical Septum & True Apex';
      aseNumber = 'ASE Segments #13 & #17';
      vesselTerritory = 'LAD (Terminal Recurrent Apical Branch)';
      kinematicSummary = `Apical-Septal & Apex: ${seg.score === 3 ? 'Akinetic (Score 3)' : seg.score === 2 ? 'Hypokinetic (Score 2)' : 'Normal (Score 1)'} with dynamic acoustic speckling secondary to distal vessel hypoperfusion.`;
      pathophysiology = 'The thin apical cap (3-4 mm) is subject to extreme wall tension by Laplace’s law. Ischemia leads to early ballooning, paradoxical systolic outward hinging, and loss of apical twist mechanics.';
      teachingPearl = 'Diagnostic Teaching Pearl: Apical akinesis is characteristic of proximal or mid LAD occlusion ("wrap-around LAD"). Look for the loss of apical systolic counter-clockwise rotation.';
    } else if (activeSegmentKey === 'basalSeptal') {
      aseName = 'Basal Septal Wall';
      aseNumber = 'ASE Segment #1';
      vesselTerritory = 'LAD Septal Branches / RCA Collaterals';
      kinematicSummary = `Basal-Septal Wall: ${seg.label} (Score ${seg.score}) with collateral reserve preserving basal electromechanical function.`;
      pathophysiology = 'Dual perfusion from proximal septal branches and proximal RCA perforators preserves basal septal motion even in mid-LAD occlusion unless the obstruction is ostial.';
      teachingPearl = 'Diagnostic Teaching Pearl: Preservation of basal septal thickening helps differentiate mid-LAD STEMI from global biventricular hypokinesis or acute myocarditis.';
    } else if (activeSegmentKey === 'lateral') {
      aseName = 'Mid & Basal Lateral Free Wall';
      aseNumber = 'ASE Segments #5 & #6';
      vesselTerritory = 'LCx (Left Circumflex / Obtuse Marginal 1)';
      kinematicSummary = `Lateral Wall: Compensatory Hyperdynamic (Score 1, Excursion ${seg.excursion.toFixed(2)}x) recruited via adrenergic and Frank-Starling mechanisms to maintain stroke volume.`;
      pathophysiology = 'Uncompromised LCx perfusion combined with acute baroreceptor-mediated sympathetic discharge and elevated end-diastolic stretch promotes vigorous hyperdynamic contraction (>1.25x excursion).';
      teachingPearl = 'Diagnostic Teaching Pearl: In acute LAD infarction, compensatory lateral hyperkinesis is critical for sustaining cardiac output. Absence of lateral hyperkinesis suggests multivessel CAD or cardiogenic shock.';
    }

    return {
      key: activeSegmentKey,
      seg,
      aseName,
      aseNumber,
      vesselTerritory,
      kinematicSummary,
      pathophysiology,
      teachingPearl,
      isPinned: inspectedSegmentKey === activeSegmentKey
    };
  }, [activeSegmentKey, dynamicPresetState.fourSegments, inspectedSegmentKey]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner">
              <Heart className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Transthoracic Echocardiogram (TTE) 2D Vector Simulator
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-500/40">
              Apical 4-Chamber (A4C) 60 FPS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time vector mechanics simulating dynamic Wall Motion Abnormalities (WMA), active myocardial thickening, biplane Simpson's LVEF calculation, and coronary territory mapping.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Freeze Frame' : 'Live Cine Loop'}</span>
          </button>

          <button
            onClick={handleGenerateAiReport}
            disabled={isGeneratingAiReport}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-950/50 border border-rose-400/40 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isGeneratingAiReport ? 'Analyzing ASE Echo...' : 'AI Echo Report'}</span>
          </button>
        </div>
      </div>

      {/* Preset Selector Bar */}
      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1.5 pl-1 pr-2">
          <Layers className="w-3.5 h-3.5 text-rose-400" />
          Clinical Profiles:
        </span>
        <div className="flex items-center gap-1.5">
          {ECHO_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 font-semibold border border-rose-400/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50'
                }`}
              >
                <span>{preset.name}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Electro-Mechanical Ischemic Lag Duration Slider */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              dynamicPresetState.isElectroMechanicalLag
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : ischemiaDurationMinutes <= 20
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }`}>
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                  Ischemia Duration (Minutes)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  dynamicPresetState.isElectroMechanicalLag
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : ischemiaDurationMinutes <= 20
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 animate-pulse'
                }`}>
                  {ischemiaDurationMinutes} min
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {dynamicPresetState.isElectroMechanicalLag ? (
                  <span className="text-emerald-400 font-medium">
                    ⚡ Electro-Mechanical Lag Phase: ST elevations present on ECG; myocardium still contracting normally.
                  </span>
                ) : ischemiaDurationMinutes <= 20 ? (
                  <span className="text-amber-400 font-medium">
                    ⚠️ Transitional Phase: Subendocardial ATP depletion, emerging hypokinesis &amp; progressive wall thinning.
                  </span>
                ) : (
                  <span className="text-cyan-400 font-medium">
                    ❄️ Transmural Akinesis &amp; Ischemic Warping: Apex and anteroseptum frozen with cyan acoustic speckling.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick preset step buttons */}
          <div className="flex items-center gap-1 shrink-0 self-start sm:self-center">
            {[
              { min: 0, label: '0m Onset' },
              { min: 8, label: '8m Lag' },
              { min: 16, label: '16m Trans' },
              { min: 35, label: '35m Akinesis' },
              { min: 90, label: '90m D2B' },
            ].map(item => (
              <button
                key={item.min}
                onClick={() => setIschemiaDurationMinutes(item.min)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-all border ${
                  ischemiaDurationMinutes === item.min
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Range Slider Track */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0"
            max="120"
            step="1"
            value={ischemiaDurationMinutes}
            onChange={(e) => setIschemiaDurationMinutes(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 focus:outline-none"
          />

          {/* Slider Scale Ticks and Clinical Annotation Markers */}
          <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
            <span className="text-emerald-400 font-semibold">0m (Normal Motion)</span>
            <span className="text-emerald-400">10m (Lag Threshold)</span>
            <span className="text-amber-400">20m (Akinesis Onset)</span>
            <span className="text-cyan-400">60m (Transmural Infarction)</span>
            <span className="text-rose-400">120m (PCI Window)</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage: Canvas & Bedside Overlays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Canvas Ultrasound Monitor with Interactive HUD */}
        <div className="lg:col-span-8 space-y-4">
          {/* Transducer View Selector & Research View Mode */}
          <div className="bg-slate-900/95 p-3 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-slate-400 pl-1 pr-1 font-semibold flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>Transducer View:</span>
              </span>
              <button
                onClick={() => setTransducerView('dual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                  transducerView === 'dual'
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950/50 border-cyan-400'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/60'
                }`}
                title="Synchronized Dual-Window: A4C + PLAX simultaneous vector display"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Dual-Window (A4C + PLAX)</span>
              </button>
              <button
                onClick={() => setTransducerView('a4c')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                  transducerView === 'a4c'
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950/50 border-cyan-400'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/60'
                }`}
                title="Apical 4-Chamber (A4C) View"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Apical 4-Chamber</span>
              </button>
              <button
                onClick={() => setTransducerView('plax')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                  transducerView === 'plax'
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950/50 border-cyan-400'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/60'
                }`}
                title="Parasternal Long Axis (PLAX) View"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Parasternal Long Axis</span>
              </button>
            </div>

            {/* Color Doppler Operational Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsColorDoppler(!isColorDoppler)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer border shadow-sm ${
                  isColorDoppler
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-cyan-950/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isColorDoppler ? 'bg-cyan-300 animate-pulse' : 'bg-slate-500'}`} />
                <span>Color Doppler Overlay: {isColorDoppler ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Dual-Window Mode vs Single View Mode */}
          {transducerView === 'dual' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Window 1: Apical 4-Chamber (A4C) */}
              <div className="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden group">
                {/* Viewport Header */}
                <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800/90 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white tracking-wide">A4C: Apical 4-Chamber</span>
                  </div>
                  <span className="text-[10px] text-slate-400">LV • RV • LA • RA</span>
                </div>

                {/* Top Interactive Bedside HUD Overlay for A4C */}
                <div className="absolute top-11 left-2.5 right-2.5 z-20 flex items-start justify-between pointer-events-none">
                  <div className="bg-slate-900/85 backdrop-blur-md px-2 py-1.5 rounded-lg border border-slate-800 shadow-lg pointer-events-auto space-y-0.5">
                    <div className="text-[11px] font-bold text-white truncate max-w-[140px]">
                      {selectedPreset.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      HR: <strong className="text-slate-200">{heartRate} BPM</strong>
                    </div>
                  </div>
                  <div className="bg-slate-900/85 backdrop-blur-md px-2 py-1.5 rounded-lg border border-slate-800 shadow-lg pointer-events-auto text-right">
                    <span className={`text-xs font-extrabold font-mono px-1.5 py-0.5 rounded border ${
                      currentCardiacCycle.calculatedEF >= 52
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : currentCardiacCycle.calculatedEF >= 40
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-red-950/80 text-red-300 border-red-500/40 animate-pulse'
                    }`}>
                      EF: {currentCardiacCycle.calculatedEF}%
                    </span>
                  </div>
                </div>

                {/* Phase Badge */}
                <div className="absolute top-24 left-2.5 z-20 pointer-events-none">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 backdrop-blur-sm shadow flex items-center gap-1 ${currentPhaseStatus.color}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                    {currentPhaseStatus.label.split(' ')[0]}
                  </span>
                </div>

                {/* A4C Canvas */}
                <canvas
                  ref={a4cCanvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onClick={handleCanvasClick}
                  onMouseLeave={() => setHoveredSegmentKey(null)}
                  className="w-full h-[440px] block cursor-crosshair select-none"
                />

                {/* Segment Inspector Popup on A4C if active */}
                {segDetails && (
                  <div className="absolute top-12 left-2 right-2 bg-slate-950/95 backdrop-blur-xl p-3 rounded-xl border border-rose-500/50 shadow-2xl z-30 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-1 border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-rose-400" />
                        <span className="font-bold text-white text-xs">{segDetails.aseName}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-rose-950 text-rose-300 border border-rose-500/40">{segDetails.aseNumber}</span>
                      </div>
                      <button
                        onClick={() => { setInspectedSegmentKey(null); setHoveredSegmentKey(null); }}
                        className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                      >✕</button>
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono">
                      Score: <strong className="text-rose-400">{segDetails.seg.score} ({segDetails.seg.label})</strong> • Excursion: <strong className="text-sky-300">{segDetails.seg.excursion.toFixed(2)}x</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Window 2: Parasternal Long Axis (PLAX) */}
              <div className="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden group">
                {/* Viewport Header */}
                <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800/90 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-bold text-white tracking-wide">PLAX: Parasternal Long Axis</span>
                  </div>
                  <span className="text-[10px] text-slate-400">LVOT • Aortic Root • MV Coaptation</span>
                </div>

                {/* Bedside HUD Overlay for PLAX */}
                <div className="absolute top-11 left-2.5 right-2.5 z-20 flex items-start justify-between pointer-events-none">
                  <div className="bg-slate-900/85 backdrop-blur-md px-2 py-1.5 rounded-lg border border-slate-800 shadow-lg pointer-events-auto space-y-0.5">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Subcostal/Basal Focus</span>
                    <div className="text-[10px] text-slate-400">
                      IVS: <strong className="text-slate-200">{dynamicPresetState.effectivePreset.id === 'hocm-obstructive' ? '22mm (Severe)' : '10mm'}</strong>
                    </div>
                  </div>
                  <div className="bg-slate-900/85 backdrop-blur-md px-2 py-1.5 rounded-lg border border-slate-800 shadow-lg pointer-events-auto text-right">
                    <span className="text-[10px] font-mono text-slate-300 block">
                      Doppler: {isColorDoppler ? 'Active' : 'Off'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      SV: {currentCardiacCycle.strokeVolumeMl}mL
                    </span>
                  </div>
                </div>

                {/* PLAX Canvas */}
                <canvas
                  ref={plaxCanvasRef}
                  className="w-full h-[440px] block cursor-default select-none"
                />
              </div>
            </div>
          ) : (
            /* Single Viewport Mode */
            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden group">
              {/* Single Viewport Header */}
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/90 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    transducerView === 'a4c' ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`} />
                  <span className="font-bold text-white tracking-wide text-sm">
                    {transducerView === 'a4c' ? 'Apical 4-Chamber (A4C)' : 'Parasternal Long Axis (PLAX)'}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {transducerView === 'a4c' ? 'LV • RV • LA • RA Coaptation' : 'LVOT • Aortic Root • Mitral Coaptation'}
                </span>
              </div>

              {/* Top Interactive Bedside HUD Overlay */}
              <div className="absolute top-12 left-3 right-3 z-20 flex items-start justify-between pointer-events-none">
                {/* Left HUD: Patient & Clinical State */}
                <div className="bg-slate-900/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-lg pointer-events-auto space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-white tracking-wide">
                      {selectedPreset.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>HR: <strong className="text-slate-200">{heartRate} BPM</strong></span>
                    <span>•</span>
                    <span>Preset EF: <strong className="text-rose-400">{dynamicPresetState.effectivePreset.expectedLVEF}%</strong></span>
                  </div>
                </div>

                {/* Right HUD: Live Calculated Hemodynamics */}
                <div className="bg-slate-900/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-lg pointer-events-auto text-right space-y-0.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Calculated LVEF</span>
                    <span className={`text-base font-extrabold font-mono px-2 py-0.5 rounded border ${
                      currentCardiacCycle.calculatedEF >= 52
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : currentCardiacCycle.calculatedEF >= 40
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-red-950/80 text-red-300 border-red-500/40 animate-pulse'
                    }`}>
                      {currentCardiacCycle.calculatedEF}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    SV: <strong className="text-slate-200">{currentCardiacCycle.strokeVolumeMl} mL</strong> | CO: <strong className="text-slate-200">{currentCardiacCycle.cardiacOutputLMin} L/m</strong>
                  </div>
                </div>
              </div>

              {/* Middle HUD: Phase Badge */}
              <div className="absolute top-28 left-3 z-20 pointer-events-none">
                <span className={`text-[10px] font-mono px-2 py-1 rounded-md bg-slate-900/90 border border-slate-800 backdrop-blur-sm shadow flex items-center gap-1.5 ${currentPhaseStatus.color}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                  {currentPhaseStatus.label}
                </span>
              </div>

              {/* Single View Canvas */}
              {transducerView === 'a4c' ? (
                <canvas
                  ref={a4cCanvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onClick={handleCanvasClick}
                  onMouseLeave={() => setHoveredSegmentKey(null)}
                  className="w-full h-[480px] block cursor-crosshair select-none"
                />
              ) : (
                <canvas
                  ref={plaxCanvasRef}
                  className="w-full h-[480px] block cursor-default select-none"
                />
              )}

              {/* Interactive "Inspected Segment Key" Visual HUD on Single View */}
              {segDetails && transducerView === 'a4c' && (
                <div className="absolute top-24 left-3 right-3 sm:right-auto sm:max-w-md bg-slate-950/95 backdrop-blur-xl p-3.5 rounded-2xl border border-rose-500/50 shadow-2xl z-30 space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <Target className="w-4 h-4 animate-pulse" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-white text-xs tracking-wide">
                            {segDetails.aseName}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                            {segDetails.aseNumber}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Segment Key: <strong className="text-rose-300">{segDetails.key}</strong> • {segDetails.vesselTerritory}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {segDetails.isPinned && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setInspectedSegmentKey(null);
                          setHoveredSegmentKey(null);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Close Inspector HUD"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Raw Localized Kinematics Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/90">
                      <span className="text-[9px] text-slate-400 uppercase block">Motion Score</span>
                      <span className={`font-bold ${
                        segDetails.seg.score === 1 ? 'text-emerald-400' :
                        segDetails.seg.score === 2 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {segDetails.seg.score} - {segDetails.seg.label.split(' ')[0]}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/90">
                      <span className="text-[9px] text-slate-400 uppercase block">Radial Excursion</span>
                      <span className="font-bold text-sky-300">
                        {segDetails.seg.excursion.toFixed(2)}x
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/90">
                      <span className="text-[9px] text-slate-400 uppercase block">Wall Thickening</span>
                      <span className={`font-bold ${segDetails.seg.thickening < 0.3 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {Math.round(segDetails.seg.thickening * 35)}%
                      </span>
                    </div>
                  </div>

                  {/* Raw Localized Kinematics Clinical Text */}
                  <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 space-y-1">
                    <p className="font-semibold text-xs leading-snug">
                      {segDetails.kinematicSummary}
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {segDetails.pathophysiology}
                    </p>
                  </div>

                  {/* Diagnostic Teaching Pearl */}
                  <div className="p-2 rounded-xl bg-sky-950/30 border border-sky-500/30 text-sky-200 text-[11px] leading-relaxed">
                    {segDetails.teachingPearl}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-0.5 text-[11px]">
                    <button
                      onClick={() => {
                        setInspectedSegmentKey(segDetails.key);
                        setActiveInfoTab('wma');
                      }}
                      className="text-rose-400 hover:text-rose-300 underline underline-offset-2 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <span>View in WMSI Matrix</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {segDetails.isPinned ? 'Click to unpin' : 'Click canvas to pin'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Canvas Interactive Controls Bar */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Heart Rate Bedside Slider */}
            <div className="flex items-center gap-3 flex-1 min-w-[220px]">
              <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-400" />
                Heart Rate: <strong className="text-white font-mono">{heartRate} BPM</strong>
              </span>
              <input
                type="range"
                min="40"
                max="160"
                step="2"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Playback speed toggle */}
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
              <span className="text-slate-400">Speed:</span>
              {[0.5, 1.0, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-1 rounded font-mono text-[11px] ${
                    playbackSpeed === speed
                      ? 'bg-slate-800 text-rose-300 font-bold border border-rose-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Sector Orientation & View Toggles */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <button
                onClick={() => setIsApexTop(!isApexTop)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-medium"
              >
                {isApexTop ? 'Apex Top (TTE)' : 'Apex Bottom (Anatomic)'}
              </button>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`px-2.5 py-1 rounded-lg transition-colors text-[11px] font-medium ${
                  showLabels ? 'bg-slate-800 text-sky-300 border border-sky-500/30' : 'bg-slate-800/50 text-slate-400'
                }`}
              >
                Labels
              </button>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2.5 py-1 rounded-lg transition-colors text-[11px] font-medium ${
                  showGrid ? 'bg-slate-800 text-sky-300 border border-sky-500/30' : 'bg-slate-800/50 text-slate-400'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Segmental Breakdown, Hemodynamics & AI Report */}
        <div className="lg:col-span-4 space-y-4">
          {/* View Tab Selector */}
          <div className="space-y-2">
            <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800">
              <button
                onClick={() => setActiveInfoTab('wma')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'wma'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>WMSI Matrix</span>
              </button>
              <button
                onClick={() => setActiveInfoTab('hemodynamics')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'hemodynamics'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Hemodynamics</span>
              </button>
              <button
                onClick={() => setActiveInfoTab('report')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'report'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Echo Report</span>
              </button>
            </div>

            {/* Toggle Switch next to Echo Report for High-Sensitivity Troponin Kinetics Graph */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/80 rounded-xl border border-slate-800/90 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">hs-cTnI Kinetics Graph</span>
              </div>
              <button
                onClick={() => setActiveInfoTab(activeTab === 'troponin' ? 'wma' : 'troponin')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1.5 ${
                  activeTab === 'troponin'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-700/80'
                }`}
              >
                <span>{activeTab === 'troponin' ? 'Viewing Kinetics' : 'Toggle hs-cTnI Graph'}</span>
                <span className={`w-2 h-2 rounded-full ${activeTab === 'troponin' ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`}></span>
              </button>
            </div>
          </div>

          {/* TAB 1: Segmental Wall Motion Score Index (WMSI) Visual Matrix */}
          {activeTab === 'wma' && (
            <WmsiVisualMatrix
              fourSegments={dynamicPresetState.fourSegments}
              segments={dynamicPresetState.fourSegments}
              calculatedWMSI={dynamicPresetState.dynamicWmsi}
              wmsi={dynamicPresetState.dynamicWmsi}
              calculatedEF={dynamicPresetState.effectiveEF}
              edv={dynamicPresetState.effectivePreset.edv}
              esv={dynamicPresetState.effectivePreset.esv}
              ischemiaDurationMinutes={ischemiaDurationMinutes}
              isElectroMechanicalLag={dynamicPresetState.isElectroMechanicalLag}
              isLagPhase={dynamicPresetState.isElectroMechanicalLag}
              inspectedSegmentKey={inspectedSegmentKey}
              activeSegmentKey={inspectedSegmentKey}
              onSelectSegment={(segKey) => setInspectedSegmentKey(inspectedSegmentKey === segKey ? null : segKey)}
              aiReport={aiReport}
              isGeneratingAiReport={isGeneratingAiReport}
              onGenerateAiReport={handleGenerateAiReport}
            />
          )}

          {/* TAB: High-Sensitivity Troponin Acceleration Delta Kinetic Grapher */}
          {activeTab === 'troponin' && (
            <TroponinKineticGrapher
              ischemiaDurationMinutes={ischemiaDurationMinutes}
              isAnteriorSTEMI={dynamicPresetState.isAnteriorSTEMI}
              onUpdateDuration={(newMin) => setIschemiaDurationMinutes(newMin)}
            />
          )}

          {/* TAB 2: Hemodynamics & Volumes */}
          {activeTab === 'hemodynamics' && (
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Biplane Hemodynamics</h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">End-Diastolic Vol</span>
                  <p className="text-lg font-bold font-mono text-white mt-0.5">{dynamicPresetState.effectivePreset.edv} mL</p>
                  <span className="text-[10px] text-slate-500">Normal: 90–140 mL</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">End-Systolic Vol</span>
                  <p className="text-lg font-bold font-mono text-rose-400 mt-0.5">{dynamicPresetState.effectivePreset.esv} mL</p>
                  <span className="text-[10px] text-slate-500">Normal: 30–55 mL</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Stroke Volume (SV)</span>
                  <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{currentCardiacCycle.strokeVolumeMl} mL</p>
                  <span className="text-[10px] text-slate-500">SV = EDV − ESV</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Cardiac Output</span>
                  <p className="text-lg font-bold font-mono text-sky-400 mt-0.5">{currentCardiacCycle.cardiacOutputLMin} L/min</p>
                  <span className="text-[10px] text-slate-500">CI: {currentCardiacCycle.cardiacIndex} L/min/m²</span>
                </div>
              </div>

              {/* Valvular Findings Box */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5 text-xs">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Valvular Assessment
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedPreset.valvularFindings}
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/50">
                  <span className="text-slate-400">Mitral Regurgitation:</span>
                  <span className={`font-mono font-bold ${
                    selectedPreset.mrSeverity === 'None'
                      ? 'text-emerald-400'
                      : selectedPreset.mrSeverity === 'Mild'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}>
                    {selectedPreset.mrSeverity}
                  </span>
                </div>
              </div>

              {/* Coronary Distribution Alert */}
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-rose-300">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Coronary Territory Correlation:
                </span>
                <p className="text-[11px] text-slate-300">
                  {selectedPreset.coronaryArtery}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Echo Consultation Report */}
          {activeTab === 'report' && (
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Clinical Echo Report</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowGrantModal(true)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-950/40 border border-indigo-400/40 transition-all cursor-pointer"
                    title="Export Dossier for NSFC Grant Submission"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Export Dossier for NSFC Grant Submission</span>
                  </button>
                  <button
                    onClick={handleGenerateAiReport}
                    disabled={isGeneratingAiReport}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingAiReport ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs max-h-[380px] overflow-y-auto pr-1 scrollbar-thin text-slate-300 space-y-2 whitespace-pre-wrap font-sans leading-relaxed">
                {aiReport ? (
                  aiReport
                ) : (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <Sparkles className="w-6 h-6 text-rose-400 mx-auto animate-pulse" />
                    <p className="font-medium text-slate-300">No report generated yet</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Click the "AI Echo Report" button above to synthesize an automated ASE/ACC compliant clinical report.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={handleGenerateAiReport}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow cursor-pointer transition-colors"
                      >
                        Generate Report Now
                      </button>
                      <button
                        onClick={() => setShowGrantModal(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Academic Dossier</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Quantitative Validation Engine HUD for Research & Journal Publications */}
      <QuantitativeValidationHud
        preset={dynamicPresetState.effectivePreset}
        selectedPreset={dynamicPresetState.effectivePreset}
        hemodynamics={currentCardiacCycle}
        currentCycle={currentCardiacCycle}
        dynamicPresetState={dynamicPresetState}
        ischemiaDurationMinutes={ischemiaDurationMinutes}
        onIschemiaChange={setIschemiaDurationMinutes}
        heartRate={heartRate}
        isColorDoppler={isColorDoppler}
        transducerView={transducerView}
        patientId={patient?.id}
        patientName={patient?.name}
        dynamicWmsi={dynamicPresetState.dynamicWmsi}
        sumScores={dynamicPresetState.sumScores}
        segments={dynamicPresetState.effectivePreset.segments}
        isElectroMechanicalLag={dynamicPresetState.isElectroMechanicalLag}
        inspectedSegmentKey={inspectedSegmentKey}
        onSelectSegment={(segKey) => {
          setInspectedSegmentKey(segKey);
          setActiveInfoTab('wma');
        }}
      />

      {/* Educational Guide Footer */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Clinical TTE Pearl:</strong> In acute anterior myocardial infarction (LAD occlusion), apical cap and septal akinesis are coupled with compensatory hyperkinesis of the basal lateral wall via the Frank-Starling mechanism.
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-500 shrink-0">
          ASE 17-Segment Model Grounded
        </div>
      </div>

      {/* Academic Grant PDF Export Engine Modal */}
      <AcademicGrantModal
        isOpen={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        preset={dynamicPresetState.effectivePreset}
        hemodynamics={{
          calculatedEF: dynamicPresetState.effectiveEF,
          strokeVolumeMl: currentCardiacCycle.strokeVolumeMl,
          cardiacOutputLMin: currentCardiacCycle.cardiacOutputLMin,
          cardiacIndex: currentCardiacCycle.cardiacIndex,
        }}
        heartRate={heartRate}
        ischemiaDurationMinutes={ischemiaDurationMinutes}
        fourSegments={dynamicPresetState.fourSegments}
        calculatedWMSI={dynamicPresetState.dynamicWmsi}
        patient={patient}
      />
    </div>
  );
};
