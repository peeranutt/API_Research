require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = 3002;

// CORS สำหรับ frontend dev server
app.use(cors({
    credentials: true,
    origin: [
        "http://10.0.15.37:5173",
        "http://10.0.15.27:5173",
        "http://localhost:5173",
        "https://servicehub.it.kmitl.ac.th" //origin จริงของ prod
    ]
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===================
// API ROUTES
// ===================
const users = require('./routes/Users');
const conference = require('./routes/Conference');
const score = require('./routes/Score');
const kris = require('./routes/Research_KRIS');
const form = require('./routes/Form');
const opinionPC = require('./routes/Officers_opinion_pc');
const opinionConf = require('./routes/Officers_opinion_conf');
const opinionKris = require('./routes/Officers_opinion_kris');
const budget = require('./routes/Budget');
const PCall = require('./routes/PageCharge_all');
const google = require('./routes/google');
const ruleBase = require('./routes/RuleBase');
const noti = require('./routes/Notification');
const file = require('./routes/File_pdf');
const Summary = require('./routes/summary');

// Mount API routes
app.use(users.router);
app.use(conference.router);
app.use(score.router);
app.use(kris.router);
app.use(form.router);
app.use(opinionPC.router);
app.use(opinionConf.router);
app.use(opinionKris.router);
app.use(budget.router);
app.use(PCall.router);
app.use(google.router);
app.use(ruleBase.router);
app.use(noti.router);
app.use(file.router);
app.use(Summary.router);

// ===================
// Serve Vue Frontend (Vite build)
// ===================
const distPath = path.join(__dirname, 'dist');
app.use('/rass', express.static(distPath));

// Fallback route for SPA (Vue router)
app.get('/rass/*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Optional root route
app.get('/', (req, res) => {
    res.send('Hello from Node.js Backend! wine');
});

// Test POST API
app.post('/api/data', (req, res) => {
    const data = req.body;
    res.json({ message: 'Data received!', data });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT} tast ja`);
});