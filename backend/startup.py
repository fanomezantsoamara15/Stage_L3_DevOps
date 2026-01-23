import os
import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError


def wait_for_mysql():
    host = os.getenv("MYSQL_HOST")
    user = os.getenv("MYSQL_USER")
    password = os.getenv("MYSQL_PASSWORD")
    db = os.getenv("MYSQL_DATABASE")

    if not all([host, user, password, db]):
        print("⚠️ Variables MySQL manquantes — bascule temporaire vers SQLite local (dev).")
        # Ne quitte pas le processus: laisse l'application démarrer en SQLite pour les tests locaux.
        # En production, ces variables doivent être fournies par les manifests Kubernetes (Secret/ConfigMap).
        return

    url = f"mysql+pymysql://{user}:{password}@{host}/{db}"

    print("⏳ Attente MySQL...")

    # Créer l'engine une seule fois et réessayer la connexion
    engine = create_engine(url, pool_pre_ping=True, pool_recycle=300)

    # Respecter éventuellement un timeout configuré (secondes)
    try:
        timeout = int(os.getenv('DB_CONNECT_TIMEOUT', '60'))
    except ValueError:
        timeout = 60

    attempt_interval = 2
    attempts = max(1, int(timeout / attempt_interval))

    for i in range(attempts):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("✅ MySQL prêt")
            return
        except OperationalError as e:
            print(f"⏳ Tentative {i+1}/{attempts} - erreur: {e}")
            time.sleep(attempt_interval)

    # Si MySQL reste indisponible, ne pas terminer le process en production automatique.
    # Fallback vers SQLite local pour permettre au service d'exposer l'endpoint de health
    # et démarrer (utile pour débogage / readiness). En production, corriger la connectivité DB.
    print(f"❌ MySQL indisponible après {timeout}s — bascule vers SQLite locale (fallback).")
    return
