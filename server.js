require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');
const path = require('path');
const { loadSnapshot, saveEvents, getStorageInfo } = require('./lib/event-store');
const { registerUser, loginUser, authMiddleware, verifyToken, refreshToken } = require('./lib/auth');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_WEBHOOK_SECRET = process.env.APIFY_WEBHOOK_SECRET;
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID || '9dardaZ3akeIhRfs3';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const apifyClient = new ApifyClient({ token: APIFY_API_TOKEN });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '1mb' }));

// Auth endpoints (public - no middleware required)
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await registerUser(email, password, username);
    
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result);
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await loginUser(email, password);
    
    if (!result.success) {
        return res.status(401).json({ error: result.error });
    }

    return res.json(result);
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
    res.json({ 
        message: 'Token is valid',
        user: {
            id: req.user.id,
            email: req.user.email
        }
    });
});

app.post('/api/auth/refresh', async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await refreshToken(refresh_token);
    
    if (!result.success) {
        return res.status(401).json({ error: result.error });
    }

    return res.json(result);
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
    // With Supabase, logout is mainly client-side (remove token)
    // But we can invalidate sessions on the server if needed
    return res.json({ message: 'Logged out successfully' });
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Listen for connections (WebSockets)
io.on('connection', (socket) => {
    console.log('A user connected to real-time events:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Cache to store Apify events persistently for new visits
let cachedEvents = [];
let cacheMeta = {
    savedAt: null,
    filePath: null,
    eventsCount: 0
};

const defaultActorInput = {
    searchUrls: [
        'https://www.meetup.com/find/?keywords=ai&location=us--ny--New%20York&source=EVENTS&distance=anyDistance&eventType=online'
    ],
    maxItems: 50,
    proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL']
    }
};

function mapItemsToEvents(items = []) {
    return items.map(item => {
        return {
            name: item.title || item.name || "Startup Event",
            description: item.description || item.details || "A premium startup event.",
            dates: {
                start: {
                    dateTime: item.dateTime || item.startDate || item.time || new Date().toISOString()
                }
            },
            _embedded: {
                venues: [{
                    name: item.venue || (item.location && item.location.name) || "India",
                    city: { name: (item.location && item.location.city) || "" }
                }]
            },
            images: [{
                url: (item.featuredEventPhoto && item.featuredEventPhoto.highResUrl) || (item.displayPhoto && item.displayPhoto.highResUrl) || item.image || item.imageUrl || item.thumbnail || "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&w=600&q=80",
                ratio: '16_9'
            }],
            url: item.url || item.eventUrl || "#",
            rawParameters: item
        };
    });
}

function getDatasetIdFromPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;

    return (
        payload?.resource?.defaultDatasetId ||
        payload?.data?.resource?.defaultDatasetId ||
        payload?.eventData?.resource?.defaultDatasetId ||
        null
    );
}

function summarizeEventForAssistant(event) {
    const venue = event?._embedded?.venues?.[0];

    return {
        id: event.id || null,
        name: event.name || 'Untitled Event',
        description: event.description || event.info || '',
        date: event?.dates?.start?.dateTime || event?.dates?.start?.localDate || null,
        location: {
            venue: venue?.name || null,
            city: venue?.city?.name || null
        },
        url: event.url || null
    };
}

app.post('/api/apify/fetch', authMiddleware, async (req, res) => {
    if (!APIFY_API_TOKEN) {
        return res.status(400).json({ error: 'Missing APIFY_API_TOKEN in .env' });
    }

    try {
        const actorInput = req.body && Object.keys(req.body).length > 0 ? req.body : defaultActorInput;

        // Run the Actor and wait for it to finish
        const run = await apifyClient.actor(APIFY_ACTOR_ID).call(actorInput);
        const datasetId = run?.defaultDatasetId;

        if (!datasetId) {
            return res.status(500).json({ error: 'Actor run completed without defaultDatasetId.' });
        }

        // Fetch and cache items from the Actor output dataset
        const { items } = await apifyClient.dataset(datasetId).listItems();
        cachedEvents = mapItemsToEvents(items || []);
        const snapshot = await saveEvents(cachedEvents, {
            actorId: APIFY_ACTOR_ID,
            datasetId,
            runId: run?.id || null
        });
        cacheMeta = getStorageInfo(snapshot);
        io.emit('apify_events_updated', cachedEvents);

        return res.status(200).json({
            message: 'Apify actor run completed and events updated.',
            actorId: APIFY_ACTOR_ID,
            runId: run?.id,
            datasetId,
            eventsCount: cachedEvents.length,
            cache: cacheMeta
        });
    } catch (error) {
        console.error('Error running Apify actor:', error.message);
        return res.status(500).json({ error: 'Failed to run Apify actor fetch.' });
    }
});

// Define raw body parser specifically for the webhook to bypass Content-Type issues
app.post('/api/webhooks/apify', express.text({type: '*/*'}), async (req, res) => {
    let payload = req.body;
    
    // Forcefully parse the body if it arrived as raw text due to missing JSON headers
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error("Failed to forcefully parse JSON webhook payload");
        }
    }

    if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid webhook payload. Expected JSON body.' });
    }

    if (APIFY_WEBHOOK_SECRET) {
        const receivedSecret = req.query.secret || req.get('x-apify-webhook-secret');
        if (receivedSecret !== APIFY_WEBHOOK_SECRET) {
            return res.status(401).json({ error: 'Invalid webhook secret.' });
        }
    }
    
    console.log("Webhook Triggered by Apify!", payload);
    
    // Apify webhook payload can vary by event format
    const datasetId = getDatasetIdFromPayload(payload);
    
    if (datasetId) {
        try {
            console.log(`Fetching freshly scraped dataset: ${datasetId}`);
            const scrapedItems = await apifyClient.dataset(datasetId).listItems();
            const items = scrapedItems?.items || [];
            const newEvents = mapItemsToEvents(items);
            
            // Replace our global cache with the latest scrape!
            cachedEvents = newEvents;
            const snapshot = await saveEvents(cachedEvents, {
                actorId: APIFY_ACTOR_ID,
                datasetId,
                sourceEvent: 'webhook'
            });
            cacheMeta = getStorageInfo(snapshot);
            
            // Broadcast the entire new array to anyone currently staring at the screen
            io.emit('apify_events_updated', cachedEvents);
            console.log(`Broadcasted ${cachedEvents.length} new events from Apify!`);
            
        } catch (error) {
            console.error("Error fetching Apify dataset:", error.message);
            return res.status(500).json({ error: 'Webhook received but failed to fetch dataset items.' });
        }
    } else {
        return res.status(400).json({ error: 'Webhook payload missing defaultDatasetId.' });
    }
    
    res.status(200).send("Apify Webhook Processed!");
});

app.get('/api/events', authMiddleware, async (req, res) => {
    // Serve our magically cached Apify events!
    // If empty, frontend shows "No events", but once the webhook hits, it works!
    return res.json({
        events: cachedEvents,
        cache: cacheMeta
    });
});

app.get('/api/events/download', authMiddleware, async (req, res) => {
    if (!cacheMeta.filePath) {
        return res.status(404).json({ error: 'No local JSON cache available yet.' });
    }

    return res.download(cacheMeta.filePath, 'events-cache.json');
});

app.post('/api/assistant', authMiddleware, async (req, res) => {
    if (!GEMINI_API_KEY) {
        return res.status(503).json({ error: 'Missing GEMINI_API_KEY in .env' });
    }

    const {
        message,
        filters = {},
        events = []
    } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    const safeEvents = Array.isArray(events)
        ? events.slice(0, 12).map(summarizeEventForAssistant)
        : [];

    const systemPrompt = [
        'You are a concise chatbot for a startup events web app.',
        'First understand the user question or problem, then answer it directly.',
        'Use the provided event data and current filter context when the question is about events, recommendations, cities, dates, saved items, or search strategy.',
        'Do not invent specific events, dates, cities, or links that are not in the provided event data.',
        'If event data is missing or weak, still help the user by suggesting practical search terms, filters, or next steps.',
        'If the question is outside event discovery, give a short helpful answer and connect it back to how the app can help when relevant.',
        'Keep answers short and practical, usually 2 to 4 sentences.'
    ].join(' ');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text: systemPrompt
                        }
                    ]
                },
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: JSON.stringify({
                                    message: message.trim(),
                                    filters,
                                    events: safeEvents
                                })
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 512
                }
            })
        });

        const payload = await response.json();

        if (!response.ok) {
            const errorMessage = payload?.error?.message || 'Gemini request failed.';
            return res.status(response.status).json({ error: errorMessage });
        }

        const text = (payload?.candidates?.[0]?.content?.parts || [])
            .map((part) => part.text || '')
            .join('')
            .trim();

        if (!text) {
            return res.status(502).json({ error: 'Gemini returned an empty response.' });
        }

        return res.json({ reply: text, model: GEMINI_MODEL });
    } catch (error) {
        console.error('Error calling Gemini API:', error.message);
        return res.status(500).json({ error: 'Failed to generate assistant reply.' });
    }
});

(async () => {
    try {
        const snapshot = await loadSnapshot();
        cachedEvents = snapshot.events;
        cacheMeta = getStorageInfo(snapshot);
    } catch (error) {
        console.error('Failed to load local event cache:', error.message);
    }
})();

server.listen(PORT, () => {
    console.log(`Server running purely on API requests + WebSockets at http://localhost:${PORT}`);
});
