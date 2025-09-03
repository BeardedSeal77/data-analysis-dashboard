from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
from datetime import datetime
import pandas as pd
import numpy as np
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# PostgreSQL connection configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'bin_project',
    'user': 'postgres',
    'password': 'postgres',
    'port': 5432
}

# Initialize PostgreSQL connection
def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"[ERROR] PostgreSQL connection error: {e}")
        return None

def test_db_connection():
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute('SELECT version()')
            version = cur.fetchone()
            cur.close()
            conn.close()
            print("[SUCCESS] Connected to PostgreSQL!")
            return True
        except Exception as e:
            print(f"[ERROR] PostgreSQL test error: {e}")
            return False
    return False

# Custom JSON encoder for numpy types
class NumpyJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, datetime):
            return obj.isoformat()
        if pd.isna(obj):
            return None
        return super(NumpyJSONEncoder, self).default(obj)

app.json_encoder = NumpyJSONEncoder

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        if conn:
            cur = conn.cursor()
            cur.execute('SELECT version()')
            version = cur.fetchone()[0]
            cur.close()
            conn.close()
            
            return jsonify({
                "status": "OK", 
                "message": "Data Analysis Project API - PostgreSQL",
                "database": DB_CONFIG['database'],
                "port": 5001,
                "postgres_version": version,
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "status": "ERROR",
                "message": "Database connection failed"
            }), 500
    except Exception as e:
        return jsonify({
            "status": "ERROR",
            "message": f"Database connection failed: {str(e)}"
        }), 500

# Get dataset information
@app.route('/api/datasets', methods=['GET'])
def get_datasets():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get all tables in the database
        cur.execute("""
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cur.fetchall()
        datasets = []
        
        for table in tables:
            table_name = table['table_name']
            
            # Get row count
            cur.execute(f'SELECT COUNT(*) as count FROM "{table_name}"')
            row_count = cur.fetchone()['count']
            
            # Get column information
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = %s
                ORDER BY ordinal_position
            """, (table_name,))
            
            columns = cur.fetchall()
            
            datasets.append({
                "name": table_name,
                "type": table['table_type'],
                "row_count": row_count,
                "column_count": len(columns),
                "columns": [dict(col) for col in columns]
            })
        
        cur.close()
        conn.close()
        
        return jsonify(datasets)
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch datasets: {str(e)}"}), 500

# Get data from a specific table
@app.route('/api/datasets/<table_name>/data', methods=['GET'])
def get_table_data(table_name):
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        # Use pandas to read data (handles data types better)
        query = f'SELECT * FROM "{table_name}" LIMIT %s OFFSET %s'
        df = pd.read_sql_query(query, conn, params=(limit, offset))
        
        # Convert to JSON-serializable format
        data = df.to_dict('records')
        
        conn.close()
        
        return jsonify({
            "table_name": table_name,
            "data": data,
            "limit": limit,
            "offset": offset,
            "count": len(data)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch data from {table_name}: {str(e)}"}), 500

# Get basic statistics for a table
@app.route('/api/datasets/<table_name>/stats', methods=['GET'])
def get_table_stats(table_name):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        # Read data into pandas for analysis
        df = pd.read_sql_query(f'SELECT * FROM "{table_name}"', conn)
        
        # Get basic statistics
        stats = {
            "table_name": table_name,
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "numeric_columns": [],
            "categorical_columns": [],
            "missing_values": {},
            "data_types": {}
        }
        
        for column in df.columns:
            # Data type info
            stats["data_types"][column] = str(df[column].dtype)
            
            # Missing values
            missing_count = df[column].isna().sum()
            stats["missing_values"][column] = int(missing_count)
            
            # Categorize columns
            if df[column].dtype in ['int64', 'float64', 'int32', 'float32']:
                column_stats = {
                    "column": column,
                    "mean": float(df[column].mean()) if not df[column].isna().all() else None,
                    "median": float(df[column].median()) if not df[column].isna().all() else None,
                    "std": float(df[column].std()) if not df[column].isna().all() else None,
                    "min": float(df[column].min()) if not df[column].isna().all() else None,
                    "max": float(df[column].max()) if not df[column].isna().all() else None,
                    "missing_count": int(missing_count)
                }
                stats["numeric_columns"].append(column_stats)
            else:
                column_stats = {
                    "column": column,
                    "unique_count": int(df[column].nunique()),
                    "most_frequent": df[column].mode().iloc[0] if len(df[column].mode()) > 0 else None,
                    "missing_count": int(missing_count)
                }
                stats["categorical_columns"].append(column_stats)
        
        conn.close()
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({"error": f"Failed to get statistics for {table_name}: {str(e)}"}), 500

# Upload CSV data to PostgreSQL
@app.route('/api/datasets/upload', methods=['POST'])
def upload_dataset():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        table_name = request.form.get('table_name', file.filename.split('.')[0])
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Read CSV with pandas
        df = pd.read_csv(file)
        
        # Connect to database and upload
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        # Upload dataframe to PostgreSQL
        df.to_sql(table_name, conn, if_exists='replace', index=False, method='multi')
        
        conn.close()
        
        return jsonify({
            "message": f"Dataset uploaded successfully as '{table_name}'",
            "rows": len(df),
            "columns": len(df.columns),
            "table_name": table_name
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Failed to upload dataset: {str(e)}"}), 500

# Execute custom SQL query
@app.route('/api/query', methods=['POST'])
def execute_query():
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "No query provided"}), 400
        
        query = data['query']
        
        # Basic security check - only allow SELECT statements
        if not query.strip().upper().startswith('SELECT'):
            return jsonify({"error": "Only SELECT queries are allowed"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        # Execute query with pandas
        df = pd.read_sql_query(query, conn)
        
        # Convert to JSON
        result = df.to_dict('records')
        
        conn.close()
        
        return jsonify({
            "query": query,
            "results": result,
            "row_count": len(result),
            "columns": list(df.columns)
        })
        
    except Exception as e:
        return jsonify({"error": f"Query execution failed: {str(e)}"}), 500

if __name__ == '__main__':
    if test_db_connection():
        print("Starting Data Analysis Project API server...")
        print("API endpoints available at http://localhost:5001/api/")
        print("[INFO] Health check: http://localhost:5001/api/health")
        print("[INFO] Data Analysis System - PostgreSQL")
        app.run(debug=True, host='0.0.0.0', port=5001)
    else:
        print("[ERROR] Failed to start Data Analysis server - PostgreSQL connection failed")
        print("[INFO] Make sure PostgreSQL is running via Docker: docker-compose up -d")