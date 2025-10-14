#!/usr/bin/env python3
"""
Script pour tester le nouveau workflow de validation des paiements
"""
import os
import requests
import json
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv('config.env')

API_BASE_URL = 'http://localhost:5000/api'

def test_student_status():
    """Teste le statut des étudiants"""
    print("=== Test du statut des étudiants ===")
    
    try:
        response = requests.get(f"{API_BASE_URL}/admin/students")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                students = data['data']
                print(f"Nombre d'étudiants: {len(students)}")
                
                active_count = sum(1 for s in students if s.get('actif', False))
                inactive_count = len(students) - active_count
                
                print(f"Étudiants actifs: {active_count}")
                print(f"Étudiants inactifs: {inactive_count}")
                
                # Afficher quelques exemples
                print("\nExemples d'étudiants:")
                for i, student in enumerate(students[:3]):
                    status = "ACTIF" if student.get('actif', False) else "INACTIF"
                    print(f"  {i+1}. {student.get('prenom', '')} {student.get('nom', '')} - {status}")
                
                return students
            else:
                print(f"Erreur API: {data.get('error', 'Erreur inconnue')}")
        else:
            print(f"Erreur HTTP: {response.status_code}")
    except Exception as e:
        print(f"Erreur de connexion: {e}")
    
    return []

def test_payments_status():
    """Teste le statut des paiements"""
    print("\n=== Test du statut des paiements ===")
    
    try:
        response = requests.get(f"{API_BASE_URL}/admin/payments")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                payments = data['data']
                print(f"Nombre de paiements: {len(payments)}")
                
                # Compter par statut
                statuts = {}
                for payment in payments:
                    statut = payment.get('statut', 'inconnu')
                    statuts[statut] = statuts.get(statut, 0) + 1
                
                print("Répartition par statut:")
                for statut, count in statuts.items():
                    print(f"  - {statut}: {count}")
                
                # Afficher quelques exemples
                print("\nExemples de paiements:")
                for i, payment in enumerate(payments[:3]):
                    print(f"  {i+1}. ID: {payment.get('id_paiement', 'N/A')} - "
                          f"Étudiant: {payment.get('id_etudiant', 'N/A')} - "
                          f"Statut: {payment.get('statut', 'N/A')} - "
                          f"Montant: {payment.get('montant', 0)} Ar")
                
                return payments
            else:
                print(f"Erreur API: {data.get('error', 'Erreur inconnue')}")
        else:
            print(f"Erreur HTTP: {response.status_code}")
    except Exception as e:
        print(f"Erreur de connexion: {e}")
    
    return []

def test_payment_validation(payment_id):
    """Teste la validation d'un paiement"""
    print(f"\n=== Test de validation du paiement {payment_id} ===")
    
    try:
        response = requests.post(f"{API_BASE_URL}/admin/payments/{payment_id}/validate")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print("✅ Validation réussie!")
                print(f"Message: {data.get('message', '')}")
                if 'data' in data:
                    print(f"Code d'auth: {data['data'].get('code_auth', 'N/A')}")
                    print(f"Email: {data['data'].get('user_email', 'N/A')}")
                return True
            else:
                print(f"❌ Erreur de validation: {data.get('error', 'Erreur inconnue')}")
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Détails: {error_data}")
            except:
                print(f"Réponse: {response.text}")
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
    
    return False

def main():
    """Fonction principale de test"""
    print("🧪 Test du nouveau workflow de validation des paiements")
    print("=" * 60)
    
    # Tester le statut des étudiants
    students = test_student_status()
    
    # Tester le statut des paiements
    payments = test_payments_status()
    
    # Analyser la cohérence
    print("\n=== Analyse de cohérence ===")
    if students and payments:
        # Vérifier les étudiants avec paiements validés mais inactifs
        student_dict = {s['id_etudiant']: s for s in students}
        
        inconsistencies = []
        for payment in payments:
            student_id = payment.get('id_etudiant')
            payment_status = payment.get('statut')
            
            if student_id in student_dict:
                student = student_dict[student_id]
                student_active = student.get('actif', False)
                
                # Vérifier la cohérence
                if payment_status in ['complet', 'par_tranche'] and not student_active:
                    inconsistencies.append({
                        'student_id': student_id,
                        'student_name': f"{student.get('prenom', '')} {student.get('nom', '')}",
                        'payment_status': payment_status,
                        'student_active': student_active
                    })
        
        if inconsistencies:
            print(f"⚠️  {len(inconsistencies)} incohérences détectées:")
            for inc in inconsistencies:
                print(f"  - Étudiant {inc['student_name']} (ID: {inc['student_id']}): "
                      f"Paiement {inc['payment_status']} mais étudiant inactif")
        else:
            print("✅ Aucune incohérence détectée")
    
    # Proposer de tester une validation
    if payments:
        pending_payments = [p for p in payments if p.get('statut') == 'en_attente']
        if pending_payments:
            print(f"\n💡 {len(pending_payments)} paiements en attente de validation")
            print("Vous pouvez tester la validation depuis l'interface admin")
        else:
            print("\n💡 Aucun paiement en attente de validation")
    
    print("\n🎯 Test terminé!")

if __name__ == "__main__":
    main()
