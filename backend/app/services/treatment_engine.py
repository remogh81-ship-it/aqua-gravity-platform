from app.models.schemas import WaterSampleInput, ComplianceResult, StabilityResult, TreatmentResult

def generate_treatment_train(sample: WaterSampleInput, compliance: ComplianceResult, stability: StabilityResult) -> TreatmentResult:
    stages = []
    
    # Pre-oxidation
    if sample.iron > 0.1 or sample.turbidity > 5.0:
        stages.append("Pre-oxidation (Aeration / Permanganate)")
        
    # Coagulation/Flocculation
    if sample.turbidity > 1.0 or sample.iron > 0.3:
        stages.append("Coagulation & Flocculation (Alum / FeCl3)")
        
    # Filtration
    stages.append("Clarification & Rapid Sand Filtration")
    
    # Softening / RO
    if sample.calcium_hardness > 350 or sample.tds > 1000:
        stages.append("Advanced Filtration / Softening / RO Membrane")
        
    # Chemical Conditioning
    if stability.lsi < -0.5:
        stages.append("Chemical Conditioning (Hydrated Lime)")
    elif stability.lsi > 1.0:
        stages.append("Chemical Conditioning (Acid Dosing)")
        
    # Terminal Disinfection
    stages.append("Terminal Disinfection (Chlorination to 0.5-1.5 mg/L residual)")
    
    return TreatmentResult(stages=stages)
