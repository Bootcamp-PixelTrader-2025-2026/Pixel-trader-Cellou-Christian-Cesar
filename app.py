from flask import Flask, jsonify
from flask_cors import CORS  # <-- Ajoute cette ligne
import mysql.connector

app = Flask(__name__)
CORS(app)  # <-- Ajoute cette ligne pour autoriser le site web

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root", # Change si ton utilisateur est différent
        password="kpc2005", # Mets ton mot de passe Workbench
        database="pixel_trader"
    )

@app.route('/jeux', methods=['GET'])
def get_jeux():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Jeux LIMIT 20")
    resultats = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultats)

if __name__ == '__main__':
    app.run(debug=True)