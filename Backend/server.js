// File: server.js
// MediBuddy Backend Server with Authentication and Gemini AI Integration

const express = require('express');
const mongoose = require('mongoose');
const fetch = globalThis.fetch || require('node-fetch');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_CONN = process.env.MONGO_CONN;
const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_change_me';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDwUmrcHJMrrFZ7EOLZgdjNTbj4I8hCXac";
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// MongoDB Connection (with in-memory fallback for development)
async function connectToDatabase() {
  if (MONGO_CONN) {
    try {
      await mongoose.connect(MONGO_CONN, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
      });
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Started in-memory MongoDB for development');
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err);
    process.exit(1);
  }
}

connectToDatabase();

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Chat History Schema
const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

// Analysis History Schema
const analysisHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['xray', 'symptom'], required: true },
  input: { type: String, required: true },
  result: { type: String, required: true },
  confidence: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

const AnalysisHistory = mongoose.model('AnalysisHistory', analysisHistorySchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Gemini AI Helper Function - FIXED
async function callGeminiAPI(prompt, context = []) {
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  // Build contents array with better error handling
  const contents = [];
  
  // Add context messages (previous conversation)
  if (Array.isArray(context) && context.length > 0) {
    for (const msg of context) {
      if (msg && msg.content) {
        contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
        });
      }
    }
  }
  
  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  try {
    console.log('Calling Gemini API with prompt...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const text = await response.text();
    let data;
    
    try { 
      data = JSON.parse(text); 
    } catch (parseErr) { 
      console.error('Failed to parse JSON response:', text);
      throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      console.error('Gemini API Error Response:', { 
        status: response.status, 
        body: text,
        data: data 
      });
      throw new Error(`Gemini API error: ${response.status} - ${data?.error?.message || text || 'Unknown error'}`);
    }

    // Safely extract content with multiple fallback options
    let contentText = '';
    
    // Try primary path: candidates[0].content.parts[0].text
    if (data?.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
        contentText = candidate.content.parts
          .map(p => p?.text)
          .filter(Boolean)
          .join('\n')
          .trim();
      }
      
      // Fallback: try candidates[0].content.text
      if (!contentText && candidate?.content?.text) {
        contentText = candidate.content.text.trim();
      }
      
      // Check for blocked content
      if (!contentText && candidate?.finishReason) {
        throw new Error(`Content blocked: ${candidate.finishReason}`);
      }
    }
    
    // Additional fallback: check promptFeedback
    if (!contentText && data?.promptFeedback) {
      throw new Error(`Prompt feedback: ${data.promptFeedback.blockReason || 'Content blocked'}`);
    }

    if (!contentText) {
      console.error('Unable to extract content from Gemini response:', JSON.stringify(data, null, 2));
      throw new Error('No content found in Gemini API response. The response structure may have changed.');
    }

    console.log('Gemini API response received successfully');
    return contentText;
    
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    throw error;
  }
}

// Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get User Profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat with AI
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, chatId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create chat history
    let chatHistory;
    if (chatId) {
      chatHistory = await ChatHistory.findOne({ _id: chatId, userId: req.user.userId });
    }

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId: req.user.userId,
        messages: []
      });
    }

    // Add user message to history
    chatHistory.messages.push({
      role: 'user',
      content: message
    });

    // Get context from last 10 messages
    const context = chatHistory.messages.slice(Math.max(0, chatHistory.messages.length - 10));

    // Create medical assistant prompt
    const systemPrompt = `You are MediBuddy, an AI medical assistant.
Return SHORT, PRECISE HTML with Tailwind classes and emojis. NO markdown hashes. Use bullet lists and color highlights. ≤120 words. End with 1-line disclaimer.

HTML TEMPLATE:
<div class="space-y-2">
  <div class="font-semibold text-primary">Summary 🩺</div>
  <ul class="list-disc pl-5 text-sm">
    <li><span class="text-emerald-600">Top insight</span></li>
    <li><span class="text-sky-600">Key action</span></li>
  </ul>
  <div class="text-xs text-muted-foreground">Disclaimer: Not medical advice.</div>
  
User: ${message}
</div>`;

    // Call Gemini API
    const aiResponse = await callGeminiAPI(systemPrompt, context.slice(0, -1));

    // Add AI response to history
    chatHistory.messages.push({
      role: 'assistant',
      content: aiResponse
    });

    await chatHistory.save();

    res.json({
      message: aiResponse,
      chatId: chatHistory._id
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: `Error processing chat message: ${error.message}` });
  }
});

// X-Ray Analysis (YOLO forwarding with Gemini fallback)
app.post('/api/analyze/xray', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const PY_DETECT_URL = process.env.PY_DETECT_URL || 'https://your-fastapi-service.onrender.com/detect';
    let yoloData = null;

    try {
      // Forward to Python service
      const FormData = require('form-data');
      const form = new FormData();
      form.append('image', req.file.buffer, { filename: req.file.originalname || 'xray.jpg', contentType: req.file.mimetype || 'image/jpeg' });

      const pyResp = await fetch(PY_DETECT_URL, { method: 'POST', body: form, headers: form.getHeaders() });
      const pyText = await pyResp.text();
      yoloData = JSON.parse(pyText);
    } catch (e) {
      console.warn('YOLO service not available, falling back to Gemini:', e.message);
    }

    let analysis = '';
    if (!yoloData) {
      const prompt = `You are an AI medical imaging assistant analyzing an X-ray image. Provide a concise analysis:
1. Observations
2. Fracture likelihood
3. Suspected location/type
4. Recommendations

Note: This is preliminary analysis only. Professional evaluation is essential.`;
      analysis = await callGeminiAPI(prompt);
    } else {
      const anyHigh = Array.isArray(yoloData?.detections) && yoloData.detections.some(d => (d.confidence || 0) > 0.5);
      analysis = yoloData?.summary || (anyHigh ? 'Fracture suspected based on detections.' : 'No clear fracture detected.');
    }

    // Save to history
    const analysisRecord = new AnalysisHistory({
      userId: req.user.userId,
      type: 'xray',
      input: 'X-ray image analysis',
      result: analysis,
      confidence: yoloData ? undefined : 0.85
    });
    await analysisRecord.save();

    return res.json({
      analysis,
      analysisId: analysisRecord._id,
      detections: yoloData?.detections || [],
      numDetections: yoloData?.numDetections || 0,
      device: yoloData?.device
    });
  } catch (error) {
    console.error('X-ray analysis error:', error);
    res.status(500).json({ error: `Error analyzing X-ray image: ${error.message}` });
  }
});

// Symptom Analysis
app.post('/api/analyze/symptoms', authenticateToken, async (req, res) => {
    const { symptoms, duration, severity, additionalInfo } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

  const prompt = `You are MediBuddy, an AI medical assistant.
Return SHORT, PRECISE HTML using Tailwind classes and emojis. NO markdown headers. Use bullets and color highlights. ≤140 words. End with 1-line disclaimer.

INPUT:
Symptoms: ${symptoms}
Duration: ${duration || 'Not specified'}
Severity: ${severity || 'Not specified'}
Additional: ${additionalInfo || 'None'}

HTML TEMPLATE:
<div class="space-y-2">
  <div class="font-semibold text-primary">Likely Causes 🔎</div>
  <ul class="list-disc pl-5 text-sm">
    <li><span class="text-rose-600">Cause A</span> — brief reason</li>
    <li><span class="text-amber-600">Cause B</span> — brief reason</li>
  </ul>
  <div class="font-semibold text-secondary">What To Do ✅</div>
  <ul class="list-disc pl-5 text-sm">
    <li><span class="text-emerald-600">Step 1</span></li>
    <li><span class="text-sky-600">Step 2</span></li>
    <li><span class="text-indigo-600">Step 3</span></li>
  </ul>
  <div class="text-xs text-muted-foreground">Disclaimer: Not medical advice.</div>
</div>`;

  let analysisText = '';
  try {
    analysisText = await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Symptom analysis AI error, returning fallback:', error);
    analysisText = 'We are unable to reach the AI analysis service right now. Based on your input, consider monitoring your symptoms, staying hydrated, resting, and seeking medical attention if symptoms worsen, include chest pain, shortness of breath, severe headache, or high fever. This is not medical advice; please consult a healthcare professional.';
  }

  try {
    const analysisRecord = new AnalysisHistory({
      userId: req.user.userId,
      type: 'symptom',
      input: JSON.stringify({ symptoms, duration, severity, additionalInfo }),
      result: analysisText,
      confidence: 0.75
    });
    await analysisRecord.save();

    return res.json({
      analysis: analysisText,
      analysisId: analysisRecord._id
    });
  } catch (saveError) {
    console.error('Symptom analysis save error:', saveError);
    return res.json({ analysis: analysisText });
  }
});

// Helpful response for accidental GET navigation in browser
app.get('/api/analyze/symptoms', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: 'Use POST /api/analyze/symptoms with JSON body { symptoms, duration?, severity?, additionalInfo? } and Authorization: Bearer <token>.'
  });
});

// Get Analysis History
app.get('/api/history/analysis', authenticateToken, async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    const query = { userId: req.user.userId };
    if (type) {
      query.type = type;
    }

    const history = await AnalysisHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Error fetching history' });
  }
});

// Get Chat History
app.get('/api/history/chat', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const chats = await ChatHistory.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ chats });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Error fetching chat history' });
  }
});

// Get specific chat
app.get('/api/chat/:chatId', authenticateToken, async (req, res) => {
  try {
    const chat = await ChatHistory.findOne({ 
      _id: req.params.chatId, 
      userId: req.user.userId 
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Error fetching chat' });
  }
});

// Delete analysis
app.delete('/api/history/analysis/:id', authenticateToken, async (req, res) => {
  try {
    const result = await AnalysisHistory.deleteOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({ error: 'Error deleting analysis' });
  }
});

// Delete chat
app.delete('/api/history/chat/:id', authenticateToken, async (req, res) => {
  try {
    const result = await ChatHistory.deleteOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Error deleting chat' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`MongoDB connection string: ${MONGO_CONN ? 'Configured' : 'Not configured'}`);
  console.log(`Gemini API Key: ${GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
});