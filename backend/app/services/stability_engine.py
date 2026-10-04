import math
from app.models.schemas import WaterSampleInput, StabilityResult

def assess_stability(sample: WaterSampleInput) -> StabilityResult:
    # pHs = (9.3 + A + B) - (C + D)
    
    A = (math.log10(sample.tds) - 1.0) / 10.0
    B = -13.12 * math.log10(sample.temperature + 273.15) + 34.55
    C = math.log10(sample.calcium_hardness) - 0.4
    D = math.log10(sample.total_alkalinity)
    
    phs = (9.3 + A + B) - (C + D)
    lsi = sample.ph - phs
    rsi = 2 * phs - sample.ph
    
    # LSI Status
    if lsi < -2.0: lsi_status = "Severe corrosion"
    elif lsi < -0.5: lsi_status = "Moderate corrosion"
    elif lsi <= 0.5: lsi_status = "Chemically stable"
    elif lsi <= 2.0: lsi_status = "Moderate scaling"
    else: lsi_status = "Severe scaling"
    
    # RSI Status
    if rsi < 5.5: rsi_status = "Heavy scaling"
    elif rsi < 6.2: rsi_status = "Slight scaling"
    elif rsi <= 6.8: rsi_status = "Stable & balanced"
    elif rsi <= 7.5: rsi_status = "Mild corrosion"
    elif rsi <= 8.5: rsi_status = "Severe corrosion"
    else: rsi_status = "Aggressive corrosion"
    
    return StabilityResult(
        phs=round(phs, 2),
        lsi=round(lsi, 2),
        lsi_status=lsi_status,
        rsi=round(rsi, 2),
        rsi_status=rsi_status
    )
