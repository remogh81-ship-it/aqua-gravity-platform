from fastapi import FastAPI
from pydantic import BaseModel, Field
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
    e_coli: float

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
    final_ph: float
    final_alkalinity: float
    final_calcium: float
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

# ----------------- STANDARDS -----------------
DECREE_458 = {
    "turbidity": 1.0, "ph_min": 6.5, "ph_max": 8.5, "tds": 1000.0,
    "total_hardness": 500.0, "calcium_hardness": 350.0, "total_alkalinity_max": 200.0,
    "iron": 0.3, "manganese": 0.4, "nitrate": 45.0, "nitrite": 0.2, "e_coli": 0.0
}

# ----------------- LOGIC -----------------
def verify_compliance(s: WaterSampleInput) -> ComplianceResult:
    v = []
    veto = False
    if s.turbidity > DECREE_458["turbidity"]: v.append("Turbidity > 1.0 NTU")
    if not (DECREE_458["ph_min"] <= s.ph <= DECREE_458["ph_max"]): v.append("pH out of bounds")
    if s.tds > DECREE_458["tds"]: v.append("TDS > 1000 mg/L")
    if s.total_hardness > DECREE_458["total_hardness"]: v.append("Total Hardness > 500 mg/L")
    if s.calcium_hardness > DECREE_458["calcium_hardness"]: v.append("Calcium Hardness > 350 mg/L")
    if s.iron > DECREE_458["iron"]: v.append("Iron > 0.3 mg/L")
    if s.manganese > DECREE_458["manganese"]: v.append("Manganese > 0.4 mg/L")
    if s.nitrate > DECREE_458["nitrate"]: v.append("Nitrate > 45.0 mg/L")
    if s.nitrite > DECREE_458["nitrite"]: v.append("Nitrite > 0.2 mg/L")
    if s.e_coli > DECREE_458["e_coli"]:
        v.append("E. coli > 0 (CRITICAL)")
        veto = True
    return ComplianceResult(is_compliant=len(v)==0, veto_status="REJECTED" if veto else "PASS", violations=v)

def calculate_wqi(s: WaterSampleInput) -> WQIResult:
    params = {
        "turbidity": (s.turbidity, DECREE_458["turbidity"]),
        "ph": (s.ph, DECREE_458["ph_max"]),
        "tds": (s.tds, DECREE_458["tds"]),
        "total_hardness": (s.total_hardness, DECREE_458["total_hardness"]),
        "calcium_hardness": (s.calcium_hardness, DECREE_458["calcium_hardness"]),
        "total_alkalinity": (s.total_alkalinity, DECREE_458["total_alkalinity_max"]),
        "iron": (s.iron, DECREE_458["iron"]),
        "manganese": (s.manganese, DECREE_458["manganese"]),
        "nitrate": (s.nitrate, DECREE_458["nitrate"]),
        "nitrite": (s.nitrite, DECREE_458["nitrite"])
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
        return DosageResult(reagent="None (Stable)", dosage_mg_l=0, final_ph=s.ph, final_alkalinity=s.total_alkalinity, final_calcium=s.calcium_hardness, final_lsi=stab.lsi, daily_consumption_kg=0)
    low, high, best, final_sim, final_stab = 0.0, 200.0, 0.0, s, stab
    for _ in range(30):
        mid = (low + high) / 2.0
        sim = sim_water(s, mid)
        st = get_stability(sim)
        if abs(st.lsi - t_lsi) <= 0.02:
            best, final_sim, final_stab = mid, sim, st
            break
        elif st.lsi < t_lsi: low = mid
        else: high = mid
        best, final_sim, final_stab = mid, sim, st
    return DosageResult(reagent="Hydrated Lime [Ca(OH)2]", dosage_mg_l=round(best,2), final_ph=round(final_sim.ph,2), final_alkalinity=round(final_sim.total_alkalinity,2), final_calcium=round(final_sim.calcium_hardness,2), final_lsi=round(final_stab.lsi,2), daily_consumption_kg=round((best * s.flow_rate)/1000, 2))

def get_train(s: WaterSampleInput, c: ComplianceResult, st: StabilityResult) -> TreatmentResult:
    stages = []
    if s.iron > 0.1 or s.turbidity > 5.0: stages.append("Pre-oxidation")
    if s.turbidity > 1.0 or s.iron > 0.3: stages.append("Coagulation & Flocculation")
    stages.append("Rapid Sand Filtration")
    if s.calcium_hardness > 350 or s.tds > 1000: stages.append("Advanced Softening / RO")
    if st.lsi < -0.5: stages.append("Lime Conditioning")
    stages.append("Terminal Disinfection (Cl2)")
    return TreatmentResult(stages=stages)

# ----------------- ENDPOINTS -----------------
@app.post("/api/v1/assess", response_model=AssessmentOutput)
def assess_water(sample: WaterSampleInput):
    c = verify_compliance(sample)
    w = calculate_wqi(sample)
    st = get_stability(sample)
    d = calc_dosage(sample, st)
    t = get_train(sample, c, st)
    return AssessmentOutput(compliance=c, wqi=w, stability=st, dosage=d, treatment_train=t)
