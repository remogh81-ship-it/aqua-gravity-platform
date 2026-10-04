from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import WaterSampleInput, AssessmentOutput
from app.services.compliance_engine import verify_compliance
from app.services.wqi_calculator import calculate_wqi
from app.services.stability_engine import assess_stability
from app.services.dosage_solver import calculate_dosage
from app.services.treatment_engine import generate_treatment_train

app = FastAPI(title="AquaGravity Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "AquaGravity systems fully operational"}

@app.post("/api/v1/assess", response_model=AssessmentOutput)
def assess_water_quality(sample: WaterSampleInput):
    # 1. Compliance
    compliance = verify_compliance(sample)
    
    # 2. WAWQI
    wqi_results = calculate_wqi(sample)
    
    # 3. Stability (LSI & RSI)
    stability = assess_stability(sample)
    
    # 4. Chemical Conditioning
    dosage = calculate_dosage(sample, stability)
    
    # 5. Treatment Train
    treatment = generate_treatment_train(sample, compliance, stability)
    
    return AssessmentOutput(
        compliance=compliance,
        wqi=wqi_results,
        stability=stability,
        dosage=dosage,
        treatment_train=treatment
    )
