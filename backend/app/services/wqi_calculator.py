from app.core.standards import DECREE_458_STANDARDS
from app.models.schemas import WaterSampleInput, WQIResult

def calculate_wqi(sample: WaterSampleInput) -> WQIResult:
    # WQI Parameters mapping based on standard rules
    params = {
        "turbidity": (sample.turbidity, DECREE_458_STANDARDS["turbidity"]["limit"]),
        "ph": (sample.ph, DECREE_458_STANDARDS["ph"]["max"]), # Convention uses max
        "tds": (sample.tds, DECREE_458_STANDARDS["tds"]["limit"]),
        "total_hardness": (sample.total_hardness, DECREE_458_STANDARDS["total_hardness"]["limit"]),
        "calcium_hardness": (sample.calcium_hardness, DECREE_458_STANDARDS["calcium_hardness"]["limit"]),
        "total_alkalinity": (sample.total_alkalinity, DECREE_458_STANDARDS["total_alkalinity"]["max"]),
        "iron": (sample.iron, DECREE_458_STANDARDS["iron"]["limit"]),
        "manganese": (sample.manganese, DECREE_458_STANDARDS["manganese"]["limit"]),
        "nitrate": (sample.nitrate, DECREE_458_STANDARDS["nitrate"]["limit"]),
        "nitrite": (sample.nitrite, DECREE_458_STANDARDS["nitrite"]["limit"])
    }
    
    # Proportionality Constant (K)
    sum_inv_s = sum(1.0 / p[1] for p in params.values() if p[1] > 0)
    K = 1.0 / sum_inv_s
    
    sub_indices = {}
    wqi_sum = 0.0
    
    for key, (val, s_val) in params.items():
        if s_val == 0: continue
        w_i = K / s_val
        
        if key == "ph":
            q_i = (abs(val - 7.0) / (8.5 - 7.0)) * 100.0
        else:
            q_i = (val / s_val) * 100.0
            
        sub_index = w_i * q_i
        sub_indices[key] = round(sub_index, 2)
        wqi_sum += sub_index
        
    wqi_value = round(wqi_sum, 2)
    
    # Categorization
    if wqi_value <= 25: grade = "A (Excellent)"
    elif wqi_value <= 50: grade = "B (Good)"
    elif wqi_value <= 75: grade = "C (Poor)"
    elif wqi_value <= 100: grade = "D (Very Poor)"
    else: grade = "E (Unfit)"
    
    return WQIResult(
        wqi_value=wqi_value,
        grade=grade,
        sub_indices=sub_indices
    )
