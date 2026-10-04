from app.core.standards import DECREE_458_STANDARDS
from app.models.schemas import WaterSampleInput, ComplianceResult

def verify_compliance(sample: WaterSampleInput) -> ComplianceResult:
    violations = []
    veto = False
    
    if sample.turbidity > DECREE_458_STANDARDS["turbidity"]["limit"]:
        violations.append("Turbidity > 1.0 NTU")
        
    if not (DECREE_458_STANDARDS["ph"]["min"] <= sample.ph <= DECREE_458_STANDARDS["ph"]["max"]):
        violations.append("pH out of bounds (6.5 - 8.5)")
        
    if sample.tds > DECREE_458_STANDARDS["tds"]["limit"]:
        violations.append("TDS > 1000 mg/L")
        
    if sample.total_hardness > DECREE_458_STANDARDS["total_hardness"]["limit"]:
        violations.append("Total Hardness > 500 mg/L")
        
    if sample.calcium_hardness > DECREE_458_STANDARDS["calcium_hardness"]["limit"]:
        violations.append("Calcium Hardness > 350 mg/L")
        
    if sample.iron > DECREE_458_STANDARDS["iron"]["limit"]:
        violations.append("Iron > 0.3 mg/L")
        
    if sample.manganese > DECREE_458_STANDARDS["manganese"]["limit"]:
        violations.append("Manganese > 0.4 mg/L")
        
    if sample.nitrate > DECREE_458_STANDARDS["nitrate"]["limit"]:
        violations.append("Nitrate > 45.0 mg/L")
        
    if sample.nitrite > DECREE_458_STANDARDS["nitrite"]["limit"]:
        violations.append("Nitrite > 0.2 mg/L")
        
    if sample.e_coli > DECREE_458_STANDARDS["e_coli"]["limit"]:
        violations.append("E. coli > 0 CFU/100mL (CRITICAL VETO)")
        veto = True
        
    return ComplianceResult(
        is_compliant=len(violations) == 0,
        veto_status="REJECTED" if veto else "PASS",
        violations=violations
    )
