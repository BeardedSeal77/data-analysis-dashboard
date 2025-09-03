from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB Atlas connection
MONGODB_URI = "mongodb+srv://hdpsa-admin:IPlaySmashWithABlanketOnMyLap@hdpsa-task-management.pazpdmo.mongodb.net/?retryWrites=true&w=majority&appName=hdpsa-task-management"
DATABASE_NAME = "hdpsa_tasks"

# Initialize MongoDB client
client = None
db = None

def init_mongodb():
    global client, db
    try:
        client = MongoClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        # Test the connection
        client.admin.command('ismaster')
        print("[SUCCESS] Connected to MongoDB Atlas!")
        return True
    except Exception as e:
        print(f"[ERROR] MongoDB connection error: {e}")
        return False

# Custom JSON encoder for MongoDB ObjectId
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(MongoJSONEncoder, self).default(obj)

app.json_encoder = MongoJSONEncoder

# Helper function to convert MongoDB documents
def convert_objectid(doc):
    if isinstance(doc, list):
        return [convert_objectid(item) for item in doc]
    elif isinstance(doc, dict):
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                doc[key] = str(value)
            elif isinstance(value, dict):
                doc[key] = convert_objectid(value)
            elif isinstance(value, list):
                doc[key] = convert_objectid(value)
        return doc
    return doc

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test MongoDB connection
        client.admin.command('ismaster')
        return jsonify({
            "status": "OK", 
            "message": "Task Management API - MongoDB Atlas",
            "database": DATABASE_NAME,
            "port": 5000,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "ERROR",
            "message": f"Database connection failed: {str(e)}"
        }), 500

# Get all documents from a collection
@app.route('/api/<collection>', methods=['GET'])
def get_collection(collection):
    try:
        documents = list(db[collection].find({}))
        documents = convert_objectid(documents)
        return jsonify(documents)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch {collection}: {str(e)}"}), 500

# Insert a single document
@app.route('/api/<collection>', methods=['POST'])
def insert_document(collection):
    try:
        document = request.get_json()
        if not document:
            return jsonify({"error": "No data provided"}), 400
        
        result = db[collection].insert_one(document)
        document['_id'] = str(result.inserted_id)
        
        return jsonify({
            "message": f"Document inserted into {collection}",
            "insertedId": str(result.inserted_id),
            "document": convert_objectid(document)
        }), 201
    except Exception as e:
        return jsonify({"error": f"Failed to insert document: {str(e)}"}), 500

# Replace entire collection with new documents
@app.route('/api/<collection>', methods=['PUT'])
def update_collection(collection):
    try:
        documents = request.get_json()
        if not isinstance(documents, list):
            return jsonify({"error": "Data must be an array of documents"}), 400
        
        # Clear the collection
        delete_result = db[collection].delete_many({})
        
        # Insert new documents if any
        insert_count = 0
        if documents:
            insert_result = db[collection].insert_many(documents)
            insert_count = len(insert_result.inserted_ids)
        
        return jsonify({
            "message": f"Updated {collection} collection",
            "deletedCount": delete_result.deleted_count,
            "insertedCount": insert_count
        })
    except Exception as e:
        return jsonify({"error": f"Failed to update {collection}: {str(e)}"}), 500

# Delete documents (with optional filter)
@app.route('/api/<collection>', methods=['DELETE'])
def delete_documents(collection):
    try:
        filter_data = request.get_json() or {}
        result = db[collection].delete_many(filter_data)
        
        return jsonify({
            "message": f"Deleted documents from {collection}",
            "deletedCount": result.deleted_count
        })
    except Exception as e:
        return jsonify({"error": f"Failed to delete from {collection}: {str(e)}"}), 500

# Task Management Specific Endpoints

@app.route('/api/tasks/by-milestone/<int:milestone_id>', methods=['GET'])
def get_tasks_by_milestone(milestone_id):
    try:
        tasks = list(db.tasks.find({"milestoneId": milestone_id}))
        tasks = convert_objectid(tasks)
        return jsonify(tasks)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch tasks for milestone {milestone_id}: {str(e)}"}), 500

@app.route('/api/assignments/by-member/<int:member_id>', methods=['GET'])
def get_assignments_by_member(member_id):
    try:
        assignments = list(db.assignments.find({"memberId": member_id}))
        assignments = convert_objectid(assignments)
        return jsonify(assignments)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch assignments for member {member_id}: {str(e)}"}), 500

@app.route('/api/assignments/by-task/<task_id>', methods=['GET'])
def get_assignments_by_task(task_id):
    try:
        assignments = list(db.assignments.find({"taskId": task_id}))
        assignments = convert_objectid(assignments)
        return jsonify(assignments)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch assignments for task {task_id}: {str(e)}"}), 500

# Data Analysis Endpoints (for R integration)

@app.route('/api/analytics/task-distribution', methods=['GET'])
def task_distribution():
    try:
        # Get task counts by member
        pipeline = [
            {
                "$group": {
                    "_id": "$memberId",
                    "taskCount": {"$sum": 1},
                    "completedTasks": {
                        "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                    }
                }
            }
        ]
        result = list(db.assignments.aggregate(pipeline))
        return jsonify(convert_objectid(result))
    except Exception as e:
        return jsonify({"error": f"Failed to get task distribution: {str(e)}"}), 500

@app.route('/api/analytics/milestone-progress', methods=['GET'])
def milestone_progress():
    try:
        # Get progress by milestone
        pipeline = [
            {
                "$lookup": {
                    "from": "tasks",
                    "localField": "taskId",
                    "foreignField": "taskId", 
                    "as": "task"
                }
            },
            {
                "$unwind": "$task"
            },
            {
                "$group": {
                    "_id": "$task.milestoneId",
                    "totalTasks": {"$sum": 1},
                    "completedTasks": {
                        "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                    }
                }
            }
        ]
        result = list(db.assignments.aggregate(pipeline))
        return jsonify(convert_objectid(result))
    except Exception as e:
        return jsonify({"error": f"Failed to get milestone progress: {str(e)}"}), 500

if __name__ == '__main__':
    if init_mongodb():
        print("Starting Task Management API server...")
        print("API endpoints available at http://localhost:5000/api/")
        print("[INFO] Health check: http://localhost:5000/api/health")
        print("[INFO] Task Management System - MongoDB Atlas")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("[ERROR] Failed to start Task Management server - MongoDB connection failed")