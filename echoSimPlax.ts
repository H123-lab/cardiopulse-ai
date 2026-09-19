import type { EchoPreset } from './EchoSimulatorView';

/**
 * Parasternal Long Axis (PLAX) High-Fidelity 2D Echocardiography Simulator Engine
 * 
 * Accurately models the structural acoustic interface of:
 * - Anterior chest wall & Right Ventricular Outflow Tract (RVOT)
 * - Interventricular Septum (IVS / Anteroseptal Wall)
 * - Left Ventricular Cavity (LV) & Posterior Wall (LVPW / Inferolateral Wall)
 * - Mitral Valve Apparatus (AML, PML, subvalvular apparatus)
 * - Aortic Root, Sinuses of Valsalva, Ascending Aorta, and Aortic Valve Cusps (RCC & NCC)
 * - Left Atrium (LA) and Descending Thoracic Aorta (DAo)
 * 
 * Dynamic Pathologies & High-Fidelity Vector Doppler Paths:
 * 1. HOCM: Asymmetric septal hypertrophy (IVSd >= 22mm), Systolic Anterior Motion (SAM) of AML,
 *    subaortic LVOT high-velocity mosaic jet during rapid ejection, alongside late-systolic MR stream.
 * 2. Papillary Muscle Rupture: Ruptured posteromedial chordae, systolic flail of PML into LA,
 *    torrential eccentric systolic mosaic jet filling the entire Left Atrium.
 * 3. Stanford Type A Dissection: Dilated aortic root (>48mm), high-frequency undulating intimal flap,
 *    and a wide central diastolic regurgitant jet back-flowing through the aortic valve into the LVOT.
 */
export const drawPLAXAnatomy = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  systoleFactor: number,
  valveOpenFactor: number,
  preset: EchoPreset,
  isColorDoppler: boolean,
  showWmaHeatmap: boolean,
  showLabels: boolean,
  ischemicWarpFactor: number = 0,
  inspectedKey: string | null = null,
  cyclePhase: number = 0,
  time: number = 0
) => {
  ctx.save();

  // Pathology Flags
  const isHOCM = preset?.id === 'hocm';
  const isTamponade = preset?.id === 'pericardial-tamponade';
  const isDissection = preset?.id === 'aortic-dissection-type-a';
  const isFlail = preset?.id === 'papillary-muscle-rupture';
  const isDilated = Boolean(preset?.isDilatedChambers || preset?.id === 'hfref-dilated');
  const isLVH = Boolean(preset?.isConcentricLVH || isHOCM);
  const isAnteriorSTEMI = preset?.id === 'stemi-anterior-lad';

  // Origin and layout geometry
  const cx = w / 2;
  const originX = cx;
  const originY = 22;
  const maxRadius = Math.min(360, h - 50);
  const sectorAngleRad = (75 * Math.PI) / 180;
  const startAngle = (Math.PI / 2) - (sectorAngleRad / 2);
  const endAngle = (Math.PI / 2) + (sectorAngleRad / 2);

  // ----------------------------------------------------
  // 1. ULTRASOUND SECTOR BEAM & DEPTH GRID
  // ----------------------------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.arc(originX, originY, maxRadius, startAngle, endAngle, false);
  ctx.closePath();

  const sectorGrad = ctx.createRadialGradient(originX, originY, 20, originX, originY, maxRadius);
  sectorGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
  sectorGrad.addColorStop(0.7, 'rgba(8, 14, 26, 0.65)');
  sectorGrad.addColorStop(1, 'rgba(3, 7, 18, 0.90)');
  ctx.fillStyle = sectorGrad;
  ctx.fill();

  ctx.lineWidth = 1.0;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.stroke();

  // Concentric depth arcs (every 4cm equivalent)
  const arcSteps = [0.25, 0.50, 0.75, 1.0];
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.setLineDash([3, 4]);

  arcSteps.forEach((step, idx) => {
    const r = maxRadius * step;
    ctx.beginPath();
    ctx.arc(originX, originY, r, startAngle, endAngle, false);
    ctx.stroke();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '9px monospace';
    const labelDepth = (idx + 1) * 4;
    const labelX = originX + r * Math.sin(sectorAngleRad / 2) + 4;
    const labelY = originY + r * Math.cos(sectorAngleRad / 2);
    ctx.fillText(`${labelDepth}cm`, labelX, labelY);
  });
  ctx.setLineDash([]);

  // Transducer Probe Icon at Origin
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(originX, originY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Orientation Indicator Marker "R"
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(originX + 22, originY + 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('R', originX + 28, originY + 11);

  ctx.restore();

  // ----------------------------------------------------
  // 2. TAMPONADE COMPRESSION & RESPIRATORY SWING
  // ----------------------------------------------------
  const respCycle = Math.sin(time * 0.0015);
  let tamponadeRvCompress = 0;
  let swingOffsetX = 0;
  let swingOffsetY = 0;

  if (isTamponade) {
    const isEarlyDiastole = cyclePhase >= 0.38 && cyclePhase <= 0.66;
    if (isEarlyDiastole) {
      tamponadeRvCompress = 16 * Math.sin(((cyclePhase - 0.38) / 0.28) * Math.PI);
    }
    swingOffsetX = Math.sin(time * 0.003) * 7;
    swingOffsetY = Math.cos(time * 0.003) * 4;
  }

  // ----------------------------------------------------
  // 3. ANATOMICAL COORDINATES (PARASTERNAL GEOMETRY)
  // ----------------------------------------------------
  const centerShiftX = cx - 18 + swingOffsetX;
  const centerShiftY = 110 + swingOffsetY;

  // Interventricular Septum (IVS) Thickness & Geometry
  let ivsThickness = isHOCM ? 26 : isLVH ? 16 : isAnteriorSTEMI ? 8 : 11;
  const ivsThickeningDelta = isAnteriorSTEMI 
    ? (preset.segments.midSeptal.wallThickening * 0.05 * systoleFactor) 
    : (ivsThickness * 0.35 * systoleFactor);
  const currentIvsThick = ivsThickness + ivsThickeningDelta;

  // Septum runs from LV Apex / Mid anteroseptum (left) to Aortic Root junction (right)
  const ivsApexX = centerShiftX - 105;
  const ivsApexY = centerShiftY + 70;
  const ivsMidX = centerShiftX - 35;
  const ivsMidY = centerShiftY + 62 + (isHOCM ? 12 : 0); // HOCM asymmetric bulge into LVOT
  const ivsBasalX = centerShiftX + 26;
  const ivsBasalY = centerShiftY + 54;

  // Right Ventricular Outflow Tract (RVOT)
  const rvotAntWallY = centerShiftY + 14 + tamponadeRvCompress;
  const rvotLeftX = centerShiftX - 90;
  const rvotRightX = centerShiftX + 65;

  // Left Ventricle (LV) Cavity Dimensions
  const lvDiastolicCaliber = isDilated ? 98 : isHOCM ? 58 : 78;
  const lvSystolicContraction = systoleFactor * (isHOCM ? 22 : isDilated ? 6 : 16);
  const currentLvCaliber = lvDiastolicCaliber - lvSystolicContraction;

  // Posterior Wall (LVPW / Inferolateral)
  const pwApexX = centerShiftX - 110;
  const pwApexY = ivsApexY + currentLvCaliber;
  const pwMidX = centerShiftX - 30;
  const pwMidY = ivsMidY + currentLvCaliber - (systoleFactor * 10);
  const pwBasalX = centerShiftX + 22; // at posterior mitral annulus
  const pwBasalY = ivsBasalY + currentLvCaliber - (systoleFactor * 12);

  // Aortic Root & Ascending Aorta
  const aoRootDiameter = isDissection ? 52 : 32;
  const aoRootAngle = -0.38; // radians tilted upward/rightward
  const aoAntWallStartX = ivsBasalX;
  const aoAntWallStartY = ivsBasalY;
  const aoAntWallEndX = aoAntWallStartX + Math.cos(aoRootAngle) * 78;
  const aoAntWallEndY = aoAntWallStartY + Math.sin(aoRootAngle) * 78;

  const aoPostWallStartX = aoAntWallStartX + Math.sin(-aoRootAngle) * aoRootDiameter;
  const aoPostWallStartY = aoAntWallStartY + Math.cos(-aoRootAngle) * aoRootDiameter;
  const aoPostWallEndX = aoAntWallEndX + Math.sin(-aoRootAngle) * aoRootDiameter;
  const aoPostWallEndY = aoAntWallEndY + Math.cos(-aoRootAngle) * aoRootDiameter;

  // Left Atrium (LA) - Sits posterior to Aortic Root
  const laAntWallStartX = aoPostWallStartX;
  const laAntWallStartY = aoPostWallStartY;
  const laPostWallEndX = laAntWallStartX + 68;
  const laPostWallEndY = laAntWallStartY + 58;

  // ----------------------------------------------------
  // 4. DRAW PERICARDIAL FLUID (TAMPONADE ANECHOIC RIM)
  // ----------------------------------------------------
  if (isTamponade) {
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.98)';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.0;

    // Anterior pericardial space
    ctx.beginPath();
    ctx.moveTo(rvotLeftX - 14, rvotAntWallY - 20);
    ctx.lineTo(rvotRightX + 14, rvotAntWallY - 20);
    ctx.lineTo(rvotRightX + 14, rvotAntWallY);
    ctx.lineTo(rvotLeftX - 14, rvotAntWallY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Posterior pericardial space
    ctx.beginPath();
    ctx.moveTo(pwApexX - 10, pwApexY + 22);
    ctx.lineTo(pwBasalX + 18, pwBasalY + 22);
    ctx.lineTo(pwBasalX + 18, pwBasalY);
    ctx.lineTo(pwApexX - 10, pwApexY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('PERICARDIAL EFFUSION (24mm)', centerShiftX - 70, pwBasalY + 18);
    ctx.restore();
  }

  // ----------------------------------------------------
  // 5. DRAW MYOCARDIAL WALLS (ACOUSTIC SPECKLING)
  // ----------------------------------------------------
  ctx.save();

  // Draw RV Anterior Wall
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rvotLeftX, rvotAntWallY - 8);
  ctx.lineTo(rvotRightX, rvotAntWallY - 8);
  ctx.lineTo(rvotRightX, rvotAntWallY);
  ctx.lineTo(rvotLeftX, rvotAntWallY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw Interventricular Septum (IVS)
  ctx.beginPath();
  ctx.moveTo(ivsApexX, ivsApexY);
  ctx.quadraticCurveTo(ivsMidX, ivsMidY, ivsBasalX, ivsBasalY);
  ctx.lineTo(ivsBasalX, ivsBasalY - currentIvsThick);
  ctx.quadraticCurveTo(ivsMidX, ivsMidY - currentIvsThick, ivsApexX, ivsApexY - (currentIvsThick * 0.8));
  ctx.closePath();

  // Color gradient / WMA Heatmap for Septum
  if (showWmaHeatmap && isAnteriorSTEMI && ischemicWarpFactor > 0.2) {
    const isAkinetic = ischemicWarpFactor > 0.6;
    ctx.fillStyle = isAkinetic ? 'rgba(244, 63, 94, 0.45)' : 'rgba(245, 158, 11, 0.40)';
  } else if (isHOCM) {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)'; // Highlighted hypertrophied septum
  } else {
    ctx.fillStyle = '#334155';
  }
  ctx.fill();

  ctx.strokeStyle = isHOCM ? '#f43f5e' : '#cbd5e1';
  ctx.lineWidth = isHOCM ? 2.5 : 2.0;
  ctx.stroke();

  // Draw Posterior Wall (LVPW)
  const pwThickness = isLVH ? 15 : 11;
  ctx.beginPath();
  ctx.moveTo(pwApexX, pwApexY);
  ctx.quadraticCurveTo(pwMidX, pwMidY, pwBasalX, pwBasalY);
  ctx.lineTo(pwBasalX, pwBasalY + pwThickness);
  ctx.quadraticCurveTo(pwMidX, pwMidY + pwThickness, pwApexX, pwApexY + pwThickness);
  ctx.closePath();
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Draw Left Atrial Posterior Wall
  ctx.beginPath();
  ctx.moveTo(aoPostWallStartX, aoPostWallStartY);
  ctx.quadraticCurveTo(laPostWallEndX, laAntWallStartY + 20, pwBasalX, pwBasalY);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Draw Aorta Walls
  ctx.beginPath();
  ctx.moveTo(aoAntWallStartX, aoAntWallStartY);
  ctx.lineTo(aoAntWallEndX, aoAntWallEndY);
  ctx.moveTo(aoPostWallStartX, aoPostWallStartY);
  ctx.lineTo(aoPostWallEndX, aoPostWallEndY);
  ctx.strokeStyle = isDissection ? '#f43f5e' : '#cbd5e1';
  ctx.lineWidth = isDissection ? 2.6 : 2.0;
  ctx.stroke();

  // Stanford Type A Undulating Intimal Flap in Aortic Root
  if (isDissection) {
    const flapWave = Math.sin(time * 0.04 + cyclePhase * 18) * 8;
    const flapMidX = (aoAntWallStartX + aoPostWallStartX) / 2 + flapWave;
    const flapMidY = (aoAntWallStartY + aoPostWallStartY) / 2;
    const flapEndX = (aoAntWallEndX + aoPostWallEndX) / 2 + flapWave * 0.7;
    const flapEndY = (aoAntWallEndY + aoPostWallEndY) / 2;

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo((aoAntWallStartX + aoPostWallStartX) / 2, (aoAntWallStartY + aoPostWallStartY) / 2);
    ctx.quadraticCurveTo(flapMidX, flapMidY, flapEndX, flapEndY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Lumen labels
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('TRUE LUMEN', flapMidX - 18, flapMidY - 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('FALSE LUMEN', flapMidX - 18, flapMidY + 14);
  }

  // Descending Thoracic Aorta (circular cross-section behind LA/LV junction)
  const daoX = pwBasalX + 32;
  const daoY = pwBasalY + 36;
  ctx.beginPath();
  ctx.arc(daoX, daoY, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#020617';
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();

  // ----------------------------------------------------
  // 6. VALVULAR APPARATUS (AORTIC & MITRAL VALVES)
  // ----------------------------------------------------
  ctx.save();
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2.0;

  // Aortic Valve Cusps (RCC & NCC)
  const isAorticOpen = systoleFactor > 0.15 && !isDissection;
  const avBoxSeparation = isAorticOpen ? 16 : 0;
  const avMidStartX = (aoAntWallStartX + aoPostWallStartX) / 2;
  const avMidStartY = (aoAntWallStartY + aoPostWallStartY) / 2;
  const avLength = 24;

  // RCC (Anterior cusp)
  ctx.beginPath();
  ctx.moveTo(aoAntWallStartX + 4, aoAntWallStartY - 2);
  ctx.lineTo(
    avMidStartX + Math.cos(aoRootAngle) * avLength - (isAorticOpen ? 8 : 0),
    avMidStartY + Math.sin(aoRootAngle) * avLength - (isAorticOpen ? 6 : 0)
  );
  ctx.stroke();

  // NCC (Posterior cusp)
  ctx.beginPath();
  ctx.moveTo(aoPostWallStartX - 4, aoPostWallStartY + 2);
  ctx.lineTo(
    avMidStartX + Math.cos(aoRootAngle) * avLength + (isAorticOpen ? 8 : 0),
    avMidStartY + Math.sin(aoRootAngle) * avLength + (isAorticOpen ? 6 : 0)
  );
  ctx.stroke();

  // Mitral Valve Leaflets
  // Anterior Mitral Leaflet (AML): attached at junction of IVS and aortic root
  const amlBaseX = aoPostWallStartX;
  const amlBaseY = aoPostWallStartY;

  // Dynamic Systolic Anterior Motion (SAM) in HOCM:
  // In mid-systole, Venturi effect sucks AML tip toward the hypertrophied septum!
  const isSam = isHOCM && systoleFactor > 0.16;
  const amlSwingDiastole = valveOpenFactor * 24;
  const amlTipX = isSam
    ? ivsMidX + 22 // Direct contact with hypertrophied septum!
    : valveOpenFactor > 0.1
    ? amlBaseX - 22 - amlSwingDiastole * 0.4
    : amlBaseX - 18;
  const amlTipY = isSam
    ? ivsMidY + 4 // Contact in LVOT
    : valveOpenFactor > 0.1
    ? amlBaseY - 14 - amlSwingDiastole * 0.5
    : amlBaseY + 12;

  ctx.beginPath();
  ctx.moveTo(amlBaseX, amlBaseY);
  ctx.quadraticCurveTo(
    isSam ? (amlBaseX + amlTipX) / 2 : amlBaseX - 10,
    isSam ? (amlBaseY + amlTipY) / 2 : amlBaseY + (valveOpenFactor > 0.1 ? -10 : 8),
    amlTipX,
    amlTipY
  );
  ctx.stroke();

  // Posterior Mitral Leaflet (PML): attached at posterior annulus
  const pmlBaseX = pwBasalX;
  const pmlBaseY = pwBasalY;

  // In Papillary Muscle Rupture, PML flails freely into the LA during systole
  const isPmlFlail = isFlail && systoleFactor > 0.15;
  const pmlSwingDiastole = valveOpenFactor * 16;
  const pmlTipX = isPmlFlail
    ? laAntWallStartX + 22 + Math.sin(time * 0.03) * 10
    : valveOpenFactor > 0.1
    ? pmlBaseX - 16
    : amlTipX;
  const pmlTipY = isPmlFlail
    ? laAntWallStartY + 24 + Math.sin(time * 0.025) * 8
    : valveOpenFactor > 0.1
    ? pmlBaseY + pmlSwingDiastole * 0.4
    : amlTipY;

  ctx.beginPath();
  ctx.moveTo(pmlBaseX, pmlBaseY);
  ctx.quadraticCurveTo(
    isPmlFlail ? (pmlBaseX + pmlTipX) / 2 : pmlBaseX - 8,
    isPmlFlail ? (pmlBaseY + pmlTipY) / 2 : pmlBaseY - (valveOpenFactor > 0.1 ? 6 : 10),
    pmlTipX,
    pmlTipY
  );
  ctx.stroke();

  // Posteromedial Papillary Muscle & Chordae in PLAX
  const papX = pwMidX + 16;
  const papY = pwMidY - 12;
  ctx.fillStyle = isFlail ? '#f43f5e' : '#475569';
  ctx.beginPath();
  ctx.arc(papX, papY, isFlail ? 5 : 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
  ctx.beginPath();
  ctx.moveTo(papX, papY);
  if (!isFlail) {
    ctx.lineTo(amlTipX, amlTipY);
    ctx.moveTo(papX, papY);
    ctx.lineTo(pmlTipX, pmlTipY);
  } else {
    // Ruptured, curled chordae tendineae
    ctx.lineTo(papX + 8, papY - 8);
    ctx.moveTo(pmlTipX, pmlTipY);
    ctx.lineTo(pmlTipX - 6, pmlTipY + 6);
  }
  ctx.stroke();

  ctx.restore();

  // ----------------------------------------------------
  // 7. HIGH-FIDELITY COLOR DOPPLER VECTOR STREAMS
  // ----------------------------------------------------
  if (isColorDoppler) {
    ctx.save();

    // 7A. Normal Diastolic Transmitral Inflow (Red/Orange laminar stream)
    if (valveOpenFactor > 0.12 && !isDissection) {
      const inflowStartX = (amlBaseX + pmlBaseX) / 2;
      const inflowStartY = (amlBaseY + pmlBaseY) / 2;
      const inflowEndX = ivsApexX + 45;
      const inflowEndY = ivsApexY + (currentLvCaliber * 0.5);

      const inflowGrad = ctx.createLinearGradient(inflowStartX, inflowStartY, inflowEndX, inflowEndY);
      inflowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.70)'); // Red toward transducer
      inflowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.65)');
      inflowGrad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

      ctx.fillStyle = inflowGrad;
      ctx.beginPath();
      ctx.moveTo(amlTipX, amlTipY);
      ctx.lineTo(pmlTipX, pmlTipY);
      ctx.quadraticCurveTo(inflowEndX + 16, inflowEndY, inflowEndX, inflowEndY);
      ctx.quadraticCurveTo(inflowStartX - 20, inflowStartY, amlTipX, amlTipY);
      ctx.closePath();
      ctx.fill();
    }

    // 7B. Normal Systolic LVOT Forward Ejection (Blue/Cyan laminar stream)
    if (systoleFactor > 0.20 && !isHOCM && !isFlail) {
      const lvotStartX = ivsMidX + 10;
      const lvotStartY = ivsMidY + 12;
      const lvotEndX = aoAntWallEndX;
      const lvotEndY = (aoAntWallEndY + aoPostWallEndY) / 2;

      const fwdGrad = ctx.createLinearGradient(lvotStartX, lvotStartY, lvotEndX, lvotEndY);
      fwdGrad.addColorStop(0, 'rgba(56, 189, 248, 0.75)'); // Cyan away from transducer
      fwdGrad.addColorStop(0.6, 'rgba(37, 99, 235, 0.70)'); // Deep blue
      fwdGrad.addColorStop(1, 'rgba(56, 189, 248, 0.10)');

      ctx.fillStyle = fwdGrad;
      ctx.beginPath();
      ctx.moveTo(ivsBasalX - 6, ivsBasalY + 4);
      ctx.lineTo(aoAntWallEndX, aoAntWallEndY);
      ctx.lineTo(aoPostWallEndX, aoPostWallEndY);
      ctx.lineTo(amlTipX, amlTipY);
      ctx.closePath();
      ctx.fill();
    }

    // 7C. HOCM: HIGH-VELOCITY MOSAIC JET CROWDING LVOT + LATE-SYSTOLIC MR STREAM
    if (isHOCM && systoleFactor > 0.18) {
      // High-Velocity Mosaic Outflow Jet through narrowed LVOT
      const lvotGrad = ctx.createLinearGradient(ivsMidX, ivsMidY, aoAntWallEndX, (aoAntWallEndY + aoPostWallEndY) / 2);
      lvotGrad.addColorStop(0, 'rgba(234, 179, 8, 0.95)'); // Turbulent mosaic yellow
      lvotGrad.addColorStop(0.25, 'rgba(6, 182, 212, 0.90)'); // Cyan
      lvotGrad.addColorStop(0.55, 'rgba(239, 68, 68, 0.90)'); // Red
      lvotGrad.addColorStop(0.80, 'rgba(168, 85, 247, 0.85)'); // Mosaic purple
      lvotGrad.addColorStop(1, 'rgba(255, 255, 255, 0.98)'); // Peak velocity white-hot core

      ctx.fillStyle = lvotGrad;
      ctx.beginPath();
      ctx.moveTo(ivsMidX + 16, ivsMidY);
      ctx.lineTo(ivsBasalX, ivsBasalY);
      ctx.lineTo(aoAntWallEndX + 4, aoAntWallEndY);
      ctx.lineTo(aoPostWallEndX - 2, aoPostWallEndY);
      ctx.lineTo(amlTipX, amlTipY);
      ctx.closePath();
      ctx.fill();

      // Late-Systolic Mitral Regurgitation Stream into Left Atrium (due to SAM malcoaptation)
      const mrOriginX = amlBaseX - 4;
      const mrOriginY = amlBaseY + 6;
      const mrEndX = laPostWallEndX - 8;
      const mrEndY = laPostWallEndY - 12;

      const mrGrad = ctx.createLinearGradient(mrOriginX, mrOriginY, mrEndX, mrEndY);
      mrGrad.addColorStop(0, 'rgba(56, 189, 248, 0.90)'); // Blue/Cyan
      mrGrad.addColorStop(0.4, 'rgba(234, 179, 8, 0.85)'); // Mosaic yellow
      mrGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.80)'); // Red
      mrGrad.addColorStop(1, 'rgba(168, 85, 247, 0.15)'); // Purple tail

      ctx.fillStyle = mrGrad;
      ctx.beginPath();
      ctx.moveTo(mrOriginX - 8, mrOriginY);
      ctx.lineTo(mrOriginX + 8, mrOriginY);
      ctx.quadraticCurveTo(mrEndX + 14, mrEndY - 10, mrEndX, mrEndY);
      ctx.quadraticCurveTo(mrEndX - 18, mrEndY + 12, mrOriginX - 8, mrOriginY);
      ctx.closePath();
      ctx.fill();
    }

    // 7D. PAPILLARY MUSCLE RUPTURE & FLAIL LEAFLET: TORRENTIAL ECCENTRIC SYSTOLIC MOSAIC JET FILLING LA
    if (isFlail && systoleFactor > 0.16) {
      const flailOriginX = pmlBaseX - 4;
      const flailOriginY = pmlBaseY - 8;
      const flailLength = 76;

      const flailGrad = ctx.createLinearGradient(flailOriginX, flailOriginY, flailOriginX + 38, flailOriginY - flailLength);
      flailGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)'); // White-hot core
      flailGrad.addColorStop(0.20, 'rgba(6, 182, 212, 0.95)'); // Cyan
      flailGrad.addColorStop(0.40, 'rgba(234, 179, 8, 0.92)'); // Gold/Yellow
      flailGrad.addColorStop(0.65, 'rgba(239, 68, 68, 0.88)'); // Crimson
      flailGrad.addColorStop(0.85, 'rgba(168, 85, 247, 0.82)'); // Mosaic purple
      flailGrad.addColorStop(1, 'rgba(56, 189, 248, 0.15)'); // Dissipating tail

      ctx.fillStyle = flailGrad;
      ctx.beginPath();
      ctx.moveTo(flailOriginX - 12, flailOriginY);
      ctx.lineTo(flailOriginX + 12, flailOriginY);
      ctx.bezierCurveTo(
        flailOriginX + 48, flailOriginY - 25,
        flailOriginX + 62, flailOriginY - flailLength,
        laPostWallEndX, laPostWallEndY - 28
      );
      ctx.bezierCurveTo(
        laPostWallEndX - 20, laPostWallEndY - flailLength,
        flailOriginX - 22, flailOriginY - 45,
        flailOriginX - 12, flailOriginY
      );
      ctx.closePath();
      ctx.fill();
    }

    // 7E. STANFORD TYPE A DISSECTION: WIDE CENTRAL DIASTOLIC REGURGITANT JET BACK-FLOWING THROUGH AORTIC VALVE
    if (isDissection && valveOpenFactor > 0.08) {
      const arOriginX = (aoAntWallStartX + aoPostWallStartX) / 2;
      const arOriginY = (aoAntWallStartY + aoPostWallStartY) / 2;
      const arLength = 84;
      const arWidth = 36;

      // Backward plume flowing into LV cavity
      const arGrad = ctx.createLinearGradient(arOriginX, arOriginY, ivsMidX + 15, ivsMidY + 28);
      arGrad.addColorStop(0, 'rgba(234, 179, 8, 0.95)'); // Aliasing yellow
      arGrad.addColorStop(0.30, 'rgba(6, 182, 212, 0.90)'); // Cyan
      arGrad.addColorStop(0.60, 'rgba(239, 68, 68, 0.85)'); // Red
      arGrad.addColorStop(0.85, 'rgba(168, 85, 247, 0.80)'); // Mosaic purple
      arGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

      ctx.fillStyle = arGrad;
      ctx.beginPath();
      ctx.moveTo(arOriginX - 12, arOriginY);
      ctx.lineTo(arOriginX + 12, arOriginY);
      ctx.bezierCurveTo(
        arOriginX - (arWidth * 0.8), arOriginY + 35,
        ivsMidX + 32, ivsMidY + 38,
        ivsMidX + 10, ivsMidY + 26
      );
      ctx.bezierCurveTo(
        ivsMidX - 10, ivsMidY + 20,
        arOriginX - (arWidth * 1.2), arOriginY + 18,
        arOriginX - 12, arOriginY
      );
      ctx.closePath();
      ctx.fill();
    }

    // 7F. Doppler Nyquist Velocity Bar (+64 to -64 cm/s)
    const barX = w - 46;
    const barY = 60;
    const barW = 12;
    const barH = 110;

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
  // 8. ANATOMICAL LABELS & PATHOLOGY BADGES
  // ----------------------------------------------------
  if (showLabels) {
    ctx.save();
    ctx.font = 'bold 10px monospace';

    // RVOT
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('RVOT', rvotLeftX + 35, rvotAntWallY + 22);

    // IVS
    ctx.fillStyle = isHOCM ? '#f43f5e' : '#cbd5e1';
    ctx.fillText(isHOCM ? 'IVS (22mm)' : 'IVS', ivsMidX - 16, ivsMidY - 4);

    // LV Cavity
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('LV', ivsMidX + 10, ivsMidY + (currentLvCaliber * 0.48));

    // LVPW (Posterior Wall)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('LVPW', pwMidX - 10, pwMidY + 16);

    // Aortic Root / Valve
    ctx.fillStyle = isDissection ? '#f59e0b' : '#38bdf8';
    ctx.fillText('Ao Root', aoAntWallStartX + 24, aoAntWallStartY + 8);
    ctx.fillText('AV', avMidStartX - 6, avMidStartY - 8);

    // Left Atrium (LA)
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('LA', aoPostWallStartX + 26, aoPostWallStartY + 34);

    // Mitral Valve (MV)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('AML', amlBaseX - 16, amlBaseY - 4);
    ctx.fillText('PML', pmlBaseX - 16, pmlBaseY + 14);

    // Descending Thoracic Aorta (DAo)
    ctx.fillStyle = '#64748b';
    ctx.fillText('DAo', daoX - 8, daoY + 3);

    // Specific Pathological Callouts
    if (isHOCM) {
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('SAM CONTACT', amlTipX - 25, amlTipY - 8);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('LVOT MOSAIC JET', ivsBasalX + 4, ivsBasalY + 14);
    } else if (isFlail) {
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('FLAIL PML (CHORDAE RUPTURE)', pmlBaseX - 10, pmlBaseY - 24);
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('TORRENTIAL MR JET', laAntWallStartX + 12, laAntWallStartY + 18);
    } else if (isDissection) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('INTIMAL FLAP (TYPE A)', (aoAntWallStartX + aoPostWallStartX) / 2 + 10, (aoAntWallStartY + aoPostWallStartY) / 2 - 16);
      if (valveOpenFactor > 0.08) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('CENTRAL DIASTOLIC AR JET', ivsMidX + 2, ivsMidY + 24);
      }
    }

    ctx.restore();
  }

  ctx.restore();
};
