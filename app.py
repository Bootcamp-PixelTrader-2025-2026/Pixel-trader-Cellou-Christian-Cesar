from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app) # Pour que le navigateur accepte de parler à l'API

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="kpc2005",
        database="pixel_trader"
    )

@app.route('/jeux', methods=['GET'])
def get_jeux():
    conn = get_db_connection()
    # dictionary=True permet d'avoir les noms des colonnes dans le JSON
    cursor = conn.cursor(dictionary=True)
    
    # J'ai retiré le "LIMIT 20" pour afficher tout le stock (55 jeux)
    cursor.execute("SELECT * FROM Jeux")
    
    resultats = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultats)

if __name__ == '__main__':
    # debug=True pour voir les erreurs en direct pendant l'oral
    app.run(debug=True)