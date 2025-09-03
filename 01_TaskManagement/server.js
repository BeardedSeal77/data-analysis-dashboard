const express = require('express');
const { MongoClient, ServerApi } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

// MongoDB Atlas connection
const uri = "mongodb+srv://hdpsa-admin:IPlaySmashWithABlanketOnMyLap@hdpsa-task-management.pazpdmo.mongodb.net/?retryWrites=true&w=majority&appName=hdpsa-task-management";
const client = new MongoClient(uri, { serverApi: ServerApi('1') });

let db;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await client.connect();
        db = client.db('hdpsa_tasks');
        console.log('✅ Connected to MongoDB Atlas!');
        
        // Test the connection
        await client.admin.command('ping');
        console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// API Routes

// Get all documents from a collection
app.get('/api/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const documents = await db.collection(collection).find({}).toArray();
        res.json(documents);
    } catch (error) {
        console.error(`Error fetching ${req.params.collection}:`, error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Insert a single document
app.post('/api/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const document = req.body;
        const result = await db.collection(collection).insertOne(document);
        res.json({ insertedId: result.insertedId, ...document });
    } catch (error) {
        console.error(`Error inserting into ${req.params.collection}:`, error);
        res.status(500).json({ error: 'Failed to insert document' });
    }
});

// Replace entire collection with new documents
app.put('/api/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const documents = req.body;
        
        // Clear the collection
        await db.collection(collection).deleteMany({});
        
        // Insert new documents if any
        if (documents.length > 0) {
            await db.collection(collection).insertMany(documents);
        }
        
        res.json({ message: `Updated ${collection} with ${documents.length} documents` });
    } catch (error) {
        console.error(`Error updating ${req.params.collection}:`, error);
        res.status(500).json({ error: 'Failed to update collection' });
    }
});

// Delete documents
app.delete('/api/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const filter = req.body || {};
        const result = await db.collection(collection).deleteMany(filter);
        res.json({ deletedCount: result.deletedCount });
    } catch (error) {
        console.error(`Error deleting from ${req.params.collection}:`, error);
        res.status(500).json({ error: 'Failed to delete documents' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'MongoDB Atlas Task Management API' });
});

// Serve static files from public directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function startServer() {
    await connectToMongoDB();
    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
        console.log(`📊 Dashboard: http://localhost:${port}`);
    });
}

startServer();