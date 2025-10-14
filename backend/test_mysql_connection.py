#!/usr/bin/env python3
"""
Script pour tester la connexion MySQL
"""
import os
import pymysql
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv('config.env')

def test_mysql_connection():
    """Teste la connexion à MySQL"""
    try:
        # Récupérer les paramètres de connexion
        host = os.getenv('MYSQL_HOST', 'localhost')
        user = os.getenv('MYSQL_USER', 'root')
        password = os.getenv('MYSQL_PASSWORD', '')
        database = os.getenv('MYSQL_DATABASE', 'quiz_connect')
        
        print(f"Tentative de connexion à MySQL:")
        print(f"Host: {host}")
        print(f"User: {user}")
        print(f"Database: {database}")
        print(f"Password: {'***' if password else '(vide)'}")
        print("-" * 50)
        
        # Tenter la connexion
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        print("✅ Connexion MySQL réussie!")
        
        # Tester une requête simple
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION() as version")
            result = cursor.fetchone()
            print(f"Version MySQL: {result['version']}")
            
            # Lister les tables
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"Nombre de tables: {len(tables)}")
            if tables:
                print("Tables disponibles:")
                for table in tables:
                    table_name = list(table.values())[0]
                    print(f"  - {table_name}")
        
        connection.close()
        return True
        
    except pymysql.Error as e:
        print(f"❌ Erreur de connexion MySQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        return False

if __name__ == "__main__":
    print("=== Test de connexion MySQL ===")
    success = test_mysql_connection()
    
    if not success:
        print("\n💡 Solutions possibles:")
        print("1. Vérifiez que MySQL est démarré")
        print("2. Vérifiez les paramètres dans config.env")
        print("3. Vérifiez que la base de données 'quiz_connect' existe")
        print("4. Vérifiez les permissions utilisateur MySQL")
