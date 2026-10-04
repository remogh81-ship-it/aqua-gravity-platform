from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
import math

app = FastAPI()

# ----------------- SCHEMAS -----------------
class WaterSampleInput(BaseModel):
    flow_rate: float
    temperature: float
    turbidity: float
    ph: float
    tds: float
    total_hardness: float
    calcium_hardness: float
    total_alkalinity: float
    iron: float
    manganese: float
    nitrate: float
    nitrite: float
    sulfate: float
    chloride: float
    fluoride: float
    aluminum: float
    lead: float
    free_chlorine: float
    total_coliform: float
    e_coli: float
    sodium: float
    potassium: float
    ammonia: float
    phosphorous: float
    bod: float
    cod: float

class ComplianceResult(BaseModel):
    is_compliant: bool
    veto_status: str
    violations: List[str]

class WQIResult(BaseModel):
    wqi_value: float
    grade: str
    sub_indices: Dict[str, float]

class StabilityResult(BaseModel):
    phs: float
    lsi: float
    lsi_status: str
    rsi: float
    rsi_status: str

class DosageResult(BaseModel):
    reagent: str
    dosage_mg_l: float
    final_lsi: float
    daily_consumption_kg: float

class TreatmentResult(BaseModel):
    stages: List[str]

class AssessmentOutput(BaseModel):
    compliance: ComplianceResult
    wqi: WQIResult
    stability: StabilityResult
    dosage: DosageResult
    treatment_train: TreatmentResult
    water_type: str

# ----------------- STANDARDS (Decree 458/2007) -----------------
DECREE_458 = {
    "turbidity": 1.0, "ph_min": 6.5, "ph_max": 8.5, "tds": 1000.0,
    "total_hardness": 500.0, "calcium_hardness": 350.0, "total_alkalinity_max": 200.0,
    "iron": 0.3, "manganese": 0.4, "nitrate": 45.0, "nitrite": 0.2,
    "sulfate": 250.0, "chloride": 250.0, "fluoride": 0.8, "aluminum": 0.2, "lead": 0.01,
    "free_chlorine_min": 0.5, "free_chlorine_max": 1.5,
    "total_coliform": 0.0, "e_coli": 0.0, "sodium": 200.0,
    "ammonia": 0.5, "phosphorous": 2.0, "bod": 3.0, "cod": 10.0
}

# ----------------- LOGIC -----------------
def verify_compliance(s: WaterSampleInput) -> ComplianceResult:
    v = []
    veto = False
    
    if s.turbidity > DECREE_458["turbidity"]: v.append(f"Turbidity > {DECREE_458['turbidity']} NTU")
    if not (DECREE_458["ph_min"] <= s.ph <= DECREE_458["ph_max"]): v.append("pH out of bounds (6.5-8.5)")
    if s.tds > DECREE_458["tds"]: v.append(f"TDS > {DECREE_458['tds']} mg/L")
    if s.total_hardness > DECREE_458["total_hardness"]: v.append(f"Total Hardness > {DECREE_458['total_hardness']} mg/L")
    if s.calcium_hardness > DECREE_458["calcium_hardness"]: v.append(f"Calcium Hardness > {DECREE_458['calcium_hardness']} mg/L")
    if s.iron > DECREE_458["iron"]: v.append(f"Iron > {DECREE_458['iron']} mg/L")
    if s.manganese > DECREE_458["manganese"]: v.append(f"Manganese > {DECREE_458['manganese']} mg/L")
    if s.nitrate > DECREE_458["nitrate"]: v.append(f"Nitrate > {DECREE_458['nitrate']} mg/L")
    if s.nitrite > DECREE_458["nitrite"]: v.append(f"Nitrite > {DECREE_458['nitrite']} mg/L")
    if s.sulfate > DECREE_458["sulfate"]: v.append(f"Sulfate > {DECREE_458['sulfate']} mg/L")
    if s.chloride > DECREE_458["chloride"]: v.append(f"Chloride > {DECREE_458['chloride']} mg/L")
    if s.fluoride > DECREE_458["fluoride"]: v.append(f"Fluoride > {DECREE_458['fluoride']} mg/L")
    if s.aluminum > DECREE_458["aluminum"]: v.append(f"Aluminum > {DECREE_458['aluminum']} mg/L")
    if s.lead > DECREE_458["lead"]: v.append(f"Lead > {DECREE_458['lead']} mg/L (TOXIC)")
    if s.sodium > DECREE_458["sodium"]: v.append(f"Sodium > {DECREE_458['sodium']} mg/L")
    if s.ammonia > DECREE_458["ammonia"]: v.append(f"Ammonia > {DECREE_458['ammonia']} mg/L")
    if s.phosphorous > DECREE_458["phosphorous"]: v.append(f"Phosphorous > {DECREE_458['phosphorous']} mg/L")
    if s.bod > DECREE_458["bod"]: v.append(f"BOD > {DECREE_458['bod']} mg/L (Organic Pollution)")
    if s.cod > DECREE_458["cod"]: v.append(f"COD > {DECREE_458['cod']} mg/L (Chemical Pollution)")
    if not (DECREE_458["free_chlorine_min"] <= s.free_chlorine <= DECREE_458["free_chlorine_max"]): v.append("Free Chlorine out of bounds (0.5-1.5 mg/L)")
    
    if s.total_coliform > DECREE_458["total_coliform"]:
        v.append("Total Coliform Detected (CRITICAL)")
        veto = True
    if s.e_coli > DECREE_458["e_coli"]:
        v.append("E. coli Detected (CRITICAL VETO)")
        veto = True
        
    return ComplianceResult(is_compliant=len(v)==0, veto_status="REJECTED" if veto else "PASS", violations=v)

def calculate_wqi(s: WaterSampleInput) -> WQIResult:
    params = {
        "turbidity": (s.turbidity, DECREE_458["turbidity"]),
        "ph": (s.ph, DECREE_458["ph_max"]),
        "tds": (s.tds, DECREE_458["tds"]),
        "total_hardness": (s.total_hardness, DECREE_458["total_hardness"]),
        "iron": (s.iron, DECREE_458["iron"]),
        "nitrate": (s.nitrate, DECREE_458["nitrate"]),
        "sulfate": (s.sulfate, DECREE_458["sulfate"]),
        "chloride": (s.chloride, DECREE_458["chloride"]),
        "fluoride": (s.fluoride, DECREE_458["fluoride"]),
        "lead": (s.lead, DECREE_458["lead"]),
        "sodium": (s.sodium, DECREE_458["sodium"]),
        "ammonia": (s.ammonia, DECREE_458["ammonia"]),
        "bod": (s.bod, DECREE_458["bod"])
    }
    K = 1.0 / sum(1.0 / p[1] for p in params.values() if p[1] > 0)
    subs = {}
    wqi_sum = 0.0
    for key, (val, s_val) in params.items():
        if s_val == 0: continue
        wi = K / s_val
        qi = (abs(val - 7.0) / (8.5 - 7.0) * 100) if key == "ph" else (val / s_val * 100)
        subs[key] = round(wi * qi, 2)
        wqi_sum += wi * qi
    val = round(wqi_sum, 2)
    grade = "A (Excellent)" if val <= 25 else "B (Good)" if val <= 50 else "C (Poor)" if val <= 75 else "D (Very Poor)" if val <= 100 else "E (Unfit)"
    return WQIResult(wqi_value=val, grade=grade, sub_indices=subs)

def get_stability(s: WaterSampleInput) -> StabilityResult:
    if s.tds <= 0 or s.calcium_hardness <= 0 or s.total_alkalinity <= 0:
        return StabilityResult(phs=7.0, lsi=0, lsi_status="Invalid Data", rsi=0, rsi_status="Invalid Data")
    A = (math.log10(s.tds) - 1.0) / 10.0
    B = -13.12 * math.log10(s.temperature + 273.15) + 34.55
    C = math.log10(s.calcium_hardness) - 0.4
    D = math.log10(s.total_alkalinity)
    phs = (9.3 + A + B) - (C + D)
    lsi = s.ph - phs
    rsi = 2 * phs - s.ph
    
    lsi_st = "Severe scaling" if lsi > 2.0 else "Moderate scaling" if lsi > 0.5 else "Chemically stable" if lsi >= -0.5 else "Moderate corrosion" if lsi >= -2.0 else "Severe corrosion"
    rsi_st = "Heavy scaling" if rsi < 5.5 else "Slight scaling" if rsi < 6.2 else "Stable" if rsi <= 6.8 else "Mild corrosion" if rsi <= 7.5 else "Aggressive corrosion"
    return StabilityResult(phs=round(phs,2), lsi=round(lsi,2), lsi_status=lsi_st, rsi=round(rsi,2), rsi_status=rsi_st)

def sim_water(s, dose, purity=0.9):
    pure = dose * purity
    added = pure * 1.35
    n_alk = s.total_alkalinity + added
    ph_shift = math.log10(n_alk / s.total_alkalinity) if s.total_alkalinity > 0 else 0
    return WaterSampleInput(**{**s.dict(), "ph": s.ph + ph_shift, "calcium_hardness": s.calcium_hardness + added, "total_alkalinity": n_alk, "tds": s.tds + pure})

def calc_dosage(s: WaterSampleInput, stab: StabilityResult) -> DosageResult:
    t_lsi = 0.05
    if stab.lsi >= t_lsi - 0.02:
        return DosageResult(reagent="None (Stable)", dosage_mg_l=0, final_lsi=stab.lsi, daily_consumption_kg=0)
    low, high, best, final_stab = 0.0, 200.0, 0.0, stab
    for _ in range(30):
        mid = (low + high) / 2.0
        sim = sim_water(s, mid)
        st = get_stability(sim)
        if abs(st.lsi - t_lsi) <= 0.02:
            best, final_stab = mid, st
            break
        elif st.lsi < t_lsi: low = mid
        else: high = mid
        best, final_stab = mid, st
    return DosageResult(reagent="Hydrated Lime [Ca(OH)2]", dosage_mg_l=round(best,2), final_lsi=round(final_stab.lsi,2), daily_consumption_kg=round((best * s.flow_rate)/1000, 2))

def get_train(s: WaterSampleInput, c: ComplianceResult, st: StabilityResult) -> TreatmentResult:
    stages = ["Intake & Screening"]
    if s.bod > 20 or s.cod > 50 or s.ammonia > 5: stages.append("Biological Treatment (MBBR / AS)")
    if s.iron > 0.1 or s.manganese > 0.1 or s.turbidity > 5.0: stages.append("Pre-oxidation (Aeration / KMnO4)")
    if s.turbidity > 1.0 or s.aluminum > 0.1 or s.phosphorous > 2.0: stages.append("Coagulation & Flocculation")
    stages.append("Clarification & Sand Filtration")
    if s.calcium_hardness > 350 or s.tds > 1000 or s.chloride > 250 or s.sulfate > 250 or s.sodium > 200: stages.append("Membrane Filtration (RO)")
    if s.lead > 0.01 or s.cod > 10.0: stages.append("GAC / Specialized Media Adsorption")
    if st.lsi < -0.5: stages.append("Chemical Conditioning (pH Adjustment)")
    stages.append("Terminal Disinfection (Chlorine / UV)")
    return TreatmentResult(stages=stages)

def classify_water_source(s: WaterSampleInput) -> str:
    # Heuristic Engine for Water Type Fingerprinting
    if s.tds > 30000:
        return "Sea Water (مياه بحر)"
    if 1500 < s.tds <= 30000:
        return "Brackish Water (مياه شبه مالحة / مسوس)"
    
    # Heavy pollution / Industrial
    if s.lead > 0.05 or s.aluminum > 2.0 or s.ph < 5.0 or s.ph > 9.5 or s.cod > 150:
        return "Industrial Wastewater (مياه صرف صناعي)"
    
    # Biological pollution / Domestic
    if s.e_coli > 1000 or s.total_coliform > 10000 or s.bod > 20 or s.ammonia > 5.0:
        return "Domestic Wastewater (مياه صرف صحي)"
        
    # Treated vs Untreated Fresh Water
    if s.free_chlorine >= 0.1 and s.tds <= 1500 and s.e_coli == 0:
        return "Treated Drinking Water (مياه شرب معالجة)"
        
    # Groundwater characteristics
    if s.total_hardness > 250 and s.turbidity < 5.0 and s.free_chlorine == 0 and s.bod < 5:
        return "Groundwater (مياه جوفية)"
        
    return "Untreated Surface Water (مياه سطحية عذبة غير معالجة)"

# ----------------- ENDPOINTS -----------------
@app.post("/api/v1/assess", response_model=AssessmentOutput)
def assess_water(sample: WaterSampleInput):
    c = verify_compliance(sample)
    w = calculate_wqi(sample)
    st = get_stability(sample)
    d = calc_dosage(sample, st)
    t = get_train(sample, c, st)
    water_type = classify_water_source(sample)
    return AssessmentOutput(compliance=c, wqi=w, stability=st, dosage=d, treatment_train=t, water_type=water_type)
