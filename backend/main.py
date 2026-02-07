# from app import app
# from db import db
# from startup import wait_for_mysql
# from init_db import init_db
# # @app.route("/health")
# # def health():
# #     return "ok", 200

# if __name__ == "__main__":
#     wait_for_mysql()
#     app.run(host="0.0.0.0", port=5000)

# ********* main.py modifié *********************
from app import app
from db import db
from startup import wait_for_mysql
from init_db import init_db  # <--- Importez votre fonction d'initialisation

if __name__ == "__main__":

    
    # 1. On attend que la base de données soit accessible
    wait_for_mysql()
    
    # 2. On crée les tables et l'admin (contexte Flask requis)
    print("🔧 Initialisation de la base de données...")
    init_db() 
    
    # 3. On lance l'application
    print("🚀 Démarrage de l'application...")
    app.run(host="0.0.0.0", port=5000)