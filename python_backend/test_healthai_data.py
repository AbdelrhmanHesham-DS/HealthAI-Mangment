#!/usr/bin/env python
"""Test script to verify HealthAI medical databases are loaded correctly"""

from ai.services.healthai_analyzer import HealthAIAnalyzer

def test_healthai_data():
    print("=" * 60)
    print("HealthAI Medical Data Integration Test")
    print("=" * 60)
    
    try:
        analyzer = HealthAIAnalyzer()
        print("\n✅ HealthAI Analyzer loaded successfully\n")
        
        # Test disease database
        diseases = analyzer.disease_db.get('diseases', {})
        print(f"📊 Disease Database:")
        print(f"   - Total diseases: {len(diseases)}")
        if diseases:
            sample_disease = list(diseases.keys())[0]
            print(f"   - Sample: {sample_disease}")
            print(f"   - Symptoms: {len(diseases[sample_disease].get('symptoms', []))}")
        
        # Test lab database
        labs = analyzer.lab_db.get('lab_tests', {})
        print(f"\n🧪 Lab Reference Ranges:")
        print(f"   - Total tests: {len(labs)}")
        if labs:
            sample_lab = list(labs.keys())[0]
            print(f"   - Sample: {sample_lab}")
            print(f"   - Range: {labs[sample_lab].get('normal_range')}")
        
        # Test emergency database
        emergencies = analyzer.emergency_db.get('emergencies', {})
        print(f"\n🚨 Emergency Guidance:")
        print(f"   - Total scenarios: {len(emergencies)}")
        if emergencies:
            sample_emergency = list(emergencies.keys())[0]
            print(f"   - Sample: {sample_emergency}")
            print(f"   - Severity: {emergencies[sample_emergency].get('severity')}")
        
        # Test drug database
        drugs = analyzer.drug_db.get('drugs', {})
        print(f"\n💊 Drug Interactions:")
        print(f"   - Total medications: {len(drugs)}")
        if drugs:
            sample_drug = list(drugs.keys())[0]
            print(f"   - Sample: {sample_drug}")
            print(f"   - Category: {drugs[sample_drug].get('category')}")
        
        # Test tips database
        tips = analyzer.tips_db.get('tips', {})
        print(f"\n💡 Health Tips:")
        print(f"   - Total categories: {len(tips)}")
        if tips:
            sample_category = list(tips.keys())[0]
            print(f"   - Sample category: {sample_category}")
            print(f"   - Tips in category: {len(tips[sample_category])}")
        
        print("\n" + "=" * 60)
        print("✅ All medical databases loaded successfully!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_healthai_data()
    exit(0 if success else 1)
