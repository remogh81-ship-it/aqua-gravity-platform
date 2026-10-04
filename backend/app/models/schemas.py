from pydantic import BaseModel, Field
from typing import List, Dict

class WaterSampleInput(BaseModel):
    flow_rate: float = Field(..., description="Plant capacity in m3/day")
    temperature: float = Field(..., description="Water temperature in Celsius")
    turbidity: float = Field(..., description="Turbidity in NTU")
    ph: float = Field(..., description="pH level")
    tds: float = Field(..., description="Total Dissolved Solids in mg/L")
    total_hardness: float = Field(..., description="Total Hardness in mg/L as CaCO3")
    calcium_hardness: float = Field(..., description="Calcium Hardness in mg/L as CaCO3")
    total_alkalinity: float = Field(..., description="Total Alkalinity in mg/L as CaCO3")
    iron: float = Field(..., description="Dissolved Iron in mg/L")
    manganese: float = Field(..., description="Dissolved Manganese in mg/L")
    nitrate: float = Field(..., description="Nitrate in mg/L")
    nitrite: float = Field(..., description="Nitrite in mg/L")
    e_coli: float = Field(..., description="E. coli in CFU/100mL")

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
