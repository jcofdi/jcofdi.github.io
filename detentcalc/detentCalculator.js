/**
 * detentCalculator.js
 *
 * Browser-friendly version of the Excel→JS translation.
 * Uses an Excel-like ROUND implementation to match Excel rounding.
 * Exposes DetentCalculator on window.
 */
(function(exports){
  // Excel ROUND(x, decimals) mimic: round half away from zero
  function excelRound(value, decimals = 0) {
    const v = Number(value);
    if (!isFinite(v)) return 0;
    const factor = Math.pow(10, decimals);
    if (v >= 0) {
      return Math.floor(v * factor + 0.5) / factor;
    } else {
      return Math.ceil(v * factor - 0.5) / factor;
    }
  }

  function excelRoundInt(value) {
    return excelRound(value, 0);
  }

  function isInvFlag(inv) {
    if (inv === 'X' || inv === 'x') return true;
    if (typeof inv === 'boolean') return inv;
    if (typeof inv === 'string') {
      const s = inv.trim().toLowerCase();
      return s === 'true' || s === '1';
    }
    return false;
  }

  function computeMIL(abLoc) { return Number(abLoc) + 1; }

  // Saturation Factor = ROUND(Detent_Loc/(Sat_X/100),0)
  // Deadzone Factor DZ_F = Detent_Loc - DZ
  // Combined Factor CF = DZ_F/(Sat_X/100)
  function computeFactors({ detentLoc, satX = 100, dz = 0 }) {
    const d = Number(detentLoc || 0);
    const sX = Number(satX) || 100;
    const dzNum = Number(dz) || 0;
    const sXdiv = (sX === 0) ? 1 : (sX / 100);
    const satFactor = excelRoundInt(d / sXdiv); // Excel ROUND(...,0)
    const dzFactor = d - dzNum;
    const combinedFactor = dzFactor / sXdiv; // not rounded in sheet
    return { satFactor, dzFactor, combinedFactor };
  }

  // Compute NR/AR slopes & intercepts implementing IF/IFERROR logic from the sheet.
  function computeRanges({ abLoc, combinedFactor, invFlag }) {
    const MIL = computeMIL(abLoc);
    const CF = Number(combinedFactor);
    const inv = isInvFlag(invFlag);

    function safeDivide(numer, denom) {
      const d = Number(denom);
      if (!isFinite(d) || Math.abs(d) < 1e-12) return 0;
      return Number(numer) / d;
    }

    // NR_Slope = IFERROR(IF(INV="X",-(100-MIL)/CF,(100-MIL)/(100-CF)),0)
    let NR_Slope;
    if (inv) NR_Slope = safeDivide(-(100 - MIL), CF);
    else NR_Slope = safeDivide(100 - MIL, 100 - CF);
    if (!isFinite(NR_Slope)) NR_Slope = 0;

    // NR_Int = IF(INV="X",100,-(NR_Slope-1)*100)
    const NR_Int = inv ? 100 : (-(NR_Slope - 1) * 100);

    // AR_Slope = IFERROR(IF(INV="X",-(MIL)/(100-CF),MIL/CF),0)
    let AR_Slope;
    if (inv) AR_Slope = safeDivide(-MIL, 100 - CF);
    else AR_Slope = safeDivide(MIL, CF);
    if (!isFinite(AR_Slope)) AR_Slope = 0;

    // AR_Int = IF(INV="X",-(AR_Slope)*100,0)
    const AR_Int = inv ? (-(AR_Slope) * 100) : 0;

    return { MIL, CF, NR_Slope, NR_Int, AR_Slope, AR_Int };
  }

  // Evaluate a single F value into the G value following the exact IF() logic and Excel ROUND
  function evaluateF({ F, NR_Slope, NR_Int, AR_Slope, AR_Int, CF, invFlag }) {
    const inv = isInvFlag(invFlag);
    const fnum = Number(F);
    const cfNum = Number(CF);

    let y;
    if (inv) {
      if (fnum < cfNum) y = (fnum * NR_Slope) + NR_Int;
      else y = (fnum * AR_Slope) + AR_Int;
    } else {
      if (fnum < cfNum) y = (fnum * AR_Slope) + AR_Int;
      else y = (fnum * NR_Slope) + NR_Int;
    }

    // Use Excel rounding semantics
    return excelRoundInt(y);
  }

  function displayValueFromG({ G, invFlag }) {
    return isInvFlag(invFlag) ? (100 - Number(G)) : Number(G);
  }

  function computeSeries(params) {
    const { abLoc, detentLoc, satX = 100, dz = 0, invFlag, Fvalues } = params || {};
    const { satFactor, dzFactor, combinedFactor: CF } = computeFactors({ detentLoc, satX, dz });
    const ranges = computeRanges({ abLoc, combinedFactor: CF, invFlag });

    const Fvals = Array.isArray(Fvalues) && Fvalues.length ? Fvalues : (() => {
      const arr = [];
      for (let x = 0; x <= 100; x += 10) arr.push(x);
      return arr;
    })();

    const results = Fvals.map(f => {
      const G = evaluateF({
        F: f,
        NR_Slope: ranges.NR_Slope,
        NR_Int: ranges.NR_Int,
        AR_Slope: ranges.AR_Slope,
        AR_Int: ranges.AR_Int,
        CF: ranges.CF,
        invFlag
      });
      return { x: f, g: G, display: displayValueFromG({ G, invFlag }) };
    });

    return {
      inputs: { abLoc, mil: ranges.MIL, detentLoc, satX, dz, invFlag },
      computed: { satFactor, dzFactor, CF: ranges.CF, NR_Slope: ranges.NR_Slope, NR_Int: ranges.NR_Int, AR_Slope: ranges.AR_Slope, AR_Int: ranges.AR_Int },
      series: results
    };
  }

  // expose on window
  exports.DetentCalculator = {
    excelRound,
    computeMIL,
    computeFactors,
    computeRanges,
    evaluateF,
    displayValueFromG,
    computeSeries
  };
})(window);
