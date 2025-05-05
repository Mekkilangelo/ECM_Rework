import mysql.connector
from mysql.connector import Error
from datetime import datetime

def create_db_connection():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            database='metallurgie',
            user='root',
            password=''
        )
        return conn
    except Error as e:
        print(f"Erreur de connexion à la base de données : {e}")
        return None

def create_requests_table():
    conn = create_db_connection()
    if conn is None:
        return

    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                header TEXT NOT NULL,
                line_number INT NOT NULL,
                content TEXT NOT NULL,
                relevance FLOAT NOT NULL,
                timestamp DATETIME NOT NULL
            )
        """)
        conn.commit()
    except Error as e:
        print(f"Erreur création table : {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def save_request(header, line_num, content, relevance):
    conn = create_db_connection()
    if conn is None:
        return

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO requests (header, line_number, content, relevance, timestamp)
            VALUES (%s, %s, %s, %s, %s)
        """, (header, line_num, content, relevance, datetime.now()))
        conn.commit()
    except Error as e:
        print(f"Erreur sauvegarde : {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def extract_table_name(header):
    start_marker = "(table MySQL:"
    end_marker = ")"
    
    start_index = header.find(start_marker)
    end_index = header.find(end_marker, start_index)
    
    if start_index != -1 and end_index != -1:
        table_name = header[start_index + len(start_marker):end_index].strip().strip("'")
        return table_name
    return None

def fetch_table_content(table_name):
    conn = create_db_connection()
    if conn is None:
        return None

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        return rows
    except Error as e:
        print(f"Erreur lors de la récupération du contenu de la table '{table_name}': {e}")
        return None
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
