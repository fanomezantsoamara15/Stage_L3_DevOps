from app import app
from db import db
from startup import wait_for_mysql

# @app.route("/health")
# def health():
#     return "ok", 200

if __name__ == "__main__":
    wait_for_mysql()
    app.run(host="0.0.0.0", port=5000)
