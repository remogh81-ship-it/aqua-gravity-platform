import math
from app.models.schemas import WaterSampleInput, StabilityResult, DosageResult
from app.services.stability_engine import assess_stability

def simulate_water_state(sample: WaterSampleInput, lime_mg_l: float, purity: float = 0.90):
    """
    Simulate the physical state of water after adding Hydrated Lime Ca(OH)2.
    1 mg/L pure lime adds approx 1.35 mg/L Alk and 1.35 mg/L CaH.
    pH rises logarithmically based on buffer capacity (simplified engineering approximation).
    """
    pure_lime = lime_mg_l * purity
    alk_added = pure_lime * 1.35
    cah_added = pure_lime * 1.35
    tds_added = pure_lime
    
    new_alk = sample.total_alkalinity + alk_added
    new_cah = sample.calcium_hardness + cah_added
    new_tds = sample.tds + tds_added
    
    # Empirical pH shift modeling for buffering
    # Delta pH = log10(New Alk / Old Alk) roughly models the shift in a buffered carbonate system
    ph_shift = math.log10(new_alk / sample.total_alkalinity) if sample.total_alkalinity > 0 else 0
    new_ph = sample.ph + ph_shift
    
    return WaterSampleInput(
        flow_rate=sample.flow_rate,
        temperature=sample.temperature,
        turbidity=sample.turbidity,
        ph=new_ph,
        tds=new_tds,
        total_hardness=sample.total_hardness + cah_added,
        calcium_hardness=new_cah,
        total_alkalinity=new_alk,
        iron=sample.iron,
        manganese=sample.manganese,
        nitrate=sample.nitrate,
        nitrite=sample.nitrite,
        e_coli=sample.e_coli
    )

def calculate_dosage(sample: WaterSampleInput, stability: StabilityResult) -> DosageResult:
    target_lsi = 0.05
    tolerance = 0.02
    
    # If already stable or scale-forming, no lime needed
    if stability.lsi >= target_lsi - tolerance:
        return DosageResult(
            reagent="None (Water is Stable/Scaling)",
            dosage_mg_l=0.0,
            final_ph=sample.ph,
            final_alkalinity=sample.total_alkalinity,
            final_calcium=sample.calcium_hardness,
            final_lsi=stability.lsi,
            daily_consumption_kg=0.0
        )

    # Iterative Bisection Algorithm
    low = 0.0
    high = 200.0 # mg/L commercial dose max limit
    commercial_purity = 0.90
    max_iter = 50
    best_dose = 0.0
    final_sim = sample
    final_stab = stability
    
    for _ in range(max_iter):
        mid = (low + high) / 2.0
        sim_sample = simulate_water_state(sample, mid, commercial_purity)
        sim_stab = assess_stability(sim_sample)
        
        if abs(sim_stab.lsi - target_lsi) <= tolerance:
            best_dose = mid
            final_sim = sim_sample
            final_stab = sim_stab
            break
        elif sim_stab.lsi < target_lsi:
            low = mid
        else:
            high = mid
            
        best_dose = mid
        final_sim = sim_sample
        final_stab = sim_stab
        
    daily_kg = (best_dose * sample.flow_rate) / 1000.0
    
    return DosageResult(
        reagent="Hydrated Lime [Ca(OH)2] 90%",
        dosage_mg_l=round(best_dose, 2),
        final_ph=round(final_sim.ph, 2),
        final_alkalinity=round(final_sim.total_alkalinity, 2),
        final_calcium=round(final_sim.calcium_hardness, 2),
        final_lsi=final_stab.lsi,
        daily_consumption_kg=round(daily_kg, 2)
    )
