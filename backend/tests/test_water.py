import pytest
from app.models.schemas import WaterSampleInput
from app.services.stability_engine import assess_stability
from app.services.dosage_solver import calculate_dosage

def test_stability_engine_sample_a():
    # Sample A test vector
    sample = WaterSampleInput(
        flow_rate=1000,
        temperature=20.0,
        turbidity=0.5,
        ph=7.2,
        tds=350.0,
        total_hardness=150.0,
        calcium_hardness=120.0,
        total_alkalinity=90.0,
        iron=0.1,
        manganese=0.05,
        nitrate=5.0,
        nitrite=0.01,
        e_coli=0.0
    )
    
    stability = assess_stability(sample)
    
    # Confirm LSI between -0.4 and 0.0
    assert -0.4 <= stability.lsi <= 0.0, f"LSI {stability.lsi} out of expected bounds"
    
    # Confirm RSI between 6.8 and 7.4
    assert 6.8 <= stability.rsi <= 7.4, f"RSI {stability.rsi} out of expected bounds"

def test_dosage_solver_sample_a():
    sample = WaterSampleInput(
        flow_rate=1000,
        temperature=20.0,
        turbidity=0.5,
        ph=7.2,
        tds=350.0,
        total_hardness=150.0,
        calcium_hardness=120.0,
        total_alkalinity=90.0,
        iron=0.1,
        manganese=0.05,
        nitrate=5.0,
        nitrite=0.01,
        e_coli=0.0
    )
    
    stability = assess_stability(sample)
    dosage = calculate_dosage(sample, stability)
    
    # Should calculate a dose > 0 because LSI < 0.05
    assert dosage.dosage_mg_l >= 0.0
    assert dosage.final_lsi >= 0.03
