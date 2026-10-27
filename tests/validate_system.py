import requests
import json

# Test cases from user
test_cases = [
    {
        "name": "Test Case 1 — Healthy (Early)",
        "data": {
            "Voltage_measured": 3.9,
            "Current_measured": -1.0,
            "Temperature_measured": 25,
            "Current_load": -0.8,
            "Voltage_load": 3.8,
            "Time": 50,
            "Sense_current": -1.0,
            "Battery_current": -1.0,
            "Current_ratio": 1.0,
            "Battery_impedance": 0.08,
            "Rectified_Impedance": 0.08,
            "Current_charge": 1.2,
            "Voltage_charge": 4.1
        },
        "expected_health": "HEALTHY",
        "expected_rul_range": (900, 1200)
    },
    {
        "name": "Test Case 2 — Healthy (Normal Use)",
        "data": {
            "Voltage_measured": 3.8,
            "Current_measured": -1.2,
            "Temperature_measured": 28,
            "Current_load": -1.0,
            "Voltage_load": 3.7,
            "Time": 150,
            "Sense_current": -1.2,
            "Battery_current": -1.2,
            "Current_ratio": 1.0,
            "Battery_impedance": 0.10,
            "Rectified_Impedance": 0.10,
            "Current_charge": 1.0,
            "Voltage_charge": 4.0
        },
        "expected_health": "HEALTHY",
        "expected_rul_range": (700, 1000)
    },
    {
        "name": "Test Case 3 — Slight Degradation",
        "data": {
            "Voltage_measured": 3.7,
            "Current_measured": -1.3,
            "Temperature_measured": 30,
            "Current_load": -1.1,
            "Voltage_load": 3.6,
            "Time": 300,
            "Sense_current": -1.3,
            "Battery_current": -1.3,
            "Current_ratio": 1.1,
            "Battery_impedance": 0.14,
            "Rectified_Impedance": 0.13,
            "Current_charge": 0.9,
            "Voltage_charge": 4.0
        },
        "expected_health": "MODERATE",
        "expected_rul_range": (500, 800)
    },
    {
        "name": "Test Case 4 — Mid-Life",
        "data": {
            "Voltage_measured": 3.6,
            "Current_measured": -1.4,
            "Temperature_measured": 32,
            "Current_load": -1.2,
            "Voltage_load": 3.5,
            "Time": 500,
            "Sense_current": -1.4,
            "Battery_current": -1.4,
            "Current_ratio": 1.1,
            "Battery_impedance": 0.16,
            "Rectified_Impedance": 0.15,
            "Current_charge": 0.8,
            "Voltage_charge": 3.95
        },
        "expected_health": "MODERATE",
        "expected_rul_range": (350, 600)
    },
    {
        "name": "Test Case 5 — Aging Start",
        "data": {
            "Voltage_measured": 3.5,
            "Current_measured": -1.5,
            "Temperature_measured": 33,
            "Current_load": -1.3,
            "Voltage_load": 3.4,
            "Time": 650,
            "Sense_current": -1.5,
            "Battery_current": -1.5,
            "Current_ratio": 1.2,
            "Battery_impedance": 0.18,
            "Rectified_Impedance": 0.17,
            "Current_charge": 0.7,
            "Voltage_charge": 3.9
        },
        "expected_health": "MODERATE",
        "expected_rul_range": (250, 450)
    },
    {
        "name": "Test Case 6 — Degraded",
        "data": {
            "Voltage_measured": 3.4,
            "Current_measured": -1.5,
            "Temperature_measured": 35,
            "Current_load": -1.2,
            "Voltage_load": 3.3,
            "Time": 800,
            "Sense_current": -1.4,
            "Battery_current": -1.5,
            "Current_ratio": 1.2,
            "Battery_impedance": 0.22,
            "Rectified_Impedance": 0.20,
            "Current_charge": 0.5,
            "Voltage_charge": 3.9
        },
        "expected_health": "DEGRADED",
        "expected_rul_range": (150, 350)
    },
    {
        "name": "Test Case 7 — Severe Aging",
        "data": {
            "Voltage_measured": 3.3,
            "Current_measured": -1.7,
            "Temperature_measured": 38,
            "Current_load": -1.4,
            "Voltage_load": 3.2,
            "Time": 900,
            "Sense_current": -1.7,
            "Battery_current": -1.7,
            "Current_ratio": 1.3,
            "Battery_impedance": 0.25,
            "Rectified_Impedance": 0.23,
            "Current_charge": 0.4,
            "Voltage_charge": 3.85
        },
        "expected_health": "DEGRADED",
        "expected_rul_range": (80, 200)
    },
    {
        "name": "Test Case 8 — Critical",
        "data": {
            "Voltage_measured": 3.1,
            "Current_measured": -2.0,
            "Temperature_measured": 45,
            "Current_load": -1.6,
            "Voltage_load": 3.0,
            "Time": 1100,
            "Sense_current": -2.0,
            "Battery_current": -2.0,
            "Current_ratio": 1.4,
            "Battery_impedance": 0.30,
            "Rectified_Impedance": 0.28,
            "Current_charge": 0.3,
            "Voltage_charge": 3.8
        },
        "expected_health": "CRITICAL",
        "expected_rul_range": (0, 100)
    },
    {
        "name": "Test Case 9 — Thermal Stress",
        "data": {
            "Voltage_measured": 3.7,
            "Current_measured": -1.2,
            "Temperature_measured": 50,
            "Current_load": -1.0,
            "Voltage_load": 3.6,
            "Time": 400,
            "Sense_current": -1.2,
            "Battery_current": -1.2,
            "Current_ratio": 1.1,
            "Battery_impedance": 0.15,
            "Rectified_Impedance": 0.14,
            "Current_charge": 0.9,
            "Voltage_charge": 4.0
        },
        "expected_health": "MODERATE",
        "expected_rul_range": (300, 600)
    },
    {
        "name": "Test Case 10 — Overcharge Risk",
        "data": {
            "Voltage_measured": 4.3,
            "Current_measured": 0.5,
            "Temperature_measured": 30,
            "Current_load": 0.3,
            "Voltage_load": 4.2,
            "Time": 200,
            "Sense_current": 0.5,
            "Battery_current": 0.5,
            "Current_ratio": 1.0,
            "Battery_impedance": 0.12,
            "Rectified_Impedance": 0.11,
            "Current_charge": 1.5,
            "Voltage_charge": 4.3
        },
        "expected_health": "MODERATE",
        "expected_rul_range": (500, 900)
    }
]

def test_battery_predictions():
    """Test all battery prediction cases"""
    print("🧪 BATTERY HEALTH PREDICTION SYSTEM VALIDATION")
    print("=" * 60)

    all_passed = True
    results = []

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 {test_case['name']}")
        print("-" * 40)

        try:
            response = requests.post('http://localhost:5001/predict', json=test_case['data'])
            if response.status_code != 200:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                all_passed = False
                continue

            result = response.json()

            # Extract results
            predicted_rul = result.get('prediction', 0)
            health_status = result.get('health_status', 'UNKNOWN')
            raw_rul = result.get('raw_prediction', predicted_rul)
            calibration_applied = result.get('calibration_info', {}).get('calibration_applied', False)

            # Check health status
            expected_health = test_case['expected_health']
            health_match = health_status == expected_health

            # Check RUL range
            expected_min, expected_max = test_case['expected_rul_range']
            rul_in_range = expected_min <= predicted_rul <= expected_max

            # Print results
            print(f"Health Status: {health_status} {'✅' if health_match else '❌'} (Expected: {expected_health})")
            print(f"RUL Prediction: {predicted_rul:.1f} cycles {'✅' if rul_in_range else '❌'} (Expected: {expected_min}-{expected_max})")
            print(f"Raw ML Output: {raw_rul:.1f} cycles")
            print(f"Calibration Applied: {calibration_applied}")

            # Determine pass/fail
            passed = health_match and rul_in_range
            if not passed:
                all_passed = False

            results.append({
                'case': i,
                'name': test_case['name'],
                'passed': passed,
                'health_match': health_match,
                'rul_in_range': rul_in_range,
                'predicted_rul': predicted_rul,
                'health_status': health_status
            })

        except Exception as e:
            print(f"❌ Test Error: {e}")
            all_passed = False
            results.append({
                'case': i,
                'name': test_case['name'],
                'passed': False,
                'error': str(e)
            })

    # Summary
    print("\n" + "=" * 60)
    print("🎯 VALIDATION SUMMARY")
    print("=" * 60)

    passed_count = sum(1 for r in results if r.get('passed', False))
    total_count = len(results)

    print(f"Tests Passed: {passed_count}/{total_count}")

    if all_passed:
        print("✅ ALL TESTS PASSED - System is working correctly!")
    else:
        print("❌ SOME TESTS FAILED - Issues detected:")

        # Show failures
        for result in results:
            if not result.get('passed', False):
                print(f"\n❌ Case {result['case']}: {result['name']}")
                if 'error' in result:
                    print(f"   Error: {result['error']}")
                else:
                    print(f"   Health: {result['health_status']} (expected different)")
                    print(f"   RUL: {result['predicted_rul']:.1f} (expected different range)")

    # Trend check
    print("\n📈 TREND ANALYSIS:")
    rul_values = [r.get('predicted_rul', 0) for r in results if 'predicted_rul' in r]
    if len(rul_values) == len(test_cases):
        decreasing = all(rul_values[i] >= rul_values[i+1] for i in range(len(rul_values)-1))
        print(f"RUL Decreasing Trend: {'✅' if decreasing else '❌'}")

    return all_passed

if __name__ == "__main__":
    test_battery_predictions()