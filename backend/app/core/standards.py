DECREE_458_STANDARDS = {
    "turbidity": {"limit": 1.0, "unit": "NTU", "type": "max", "critical": True},
    "ph": {"min": 6.5, "max": 8.5, "unit": "pH", "type": "range", "critical": False},
    "tds": {"limit": 1000.0, "unit": "mg/L", "type": "max", "critical": False},
    "total_hardness": {"limit": 500.0, "unit": "mg/L as CaCO3", "type": "max", "critical": False},
    "calcium_hardness": {"limit": 350.0, "unit": "mg/L as CaCO3", "type": "max", "critical": False},
    "total_alkalinity": {"min": 50.0, "max": 200.0, "unit": "mg/L as CaCO3", "type": "range", "critical": False},
    "iron": {"limit": 0.3, "unit": "mg/L", "type": "max", "critical": False},
    "manganese": {"limit": 0.4, "unit": "mg/L", "type": "max", "critical": False},
    "nitrate": {"limit": 45.0, "unit": "mg/L", "type": "max", "critical": False},
    "nitrite": {"limit": 0.2, "unit": "mg/L", "type": "max", "critical": False},
    "e_coli": {"limit": 0.0, "unit": "CFU/100mL", "type": "max", "critical": True}
}
