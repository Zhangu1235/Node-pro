document.addEventListener('DOMContentLoaded', () => {
    const eventsGrid = document.getElementById('events-grid');
    const keywordInput = document.getElementById('keywordInput');
    const locationInput = document.getElementById('locationInput');
    const searchBtn = document.querySelector('.btn-search');
    const refreshApifyBtn = document.getElementById('refreshApifyBtn');
    const fetchStatusPill = document.getElementById('fetchStatusPill');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const sortSelect = document.getElementById('sortSelect');
    const eventsCountEl = document.getElementById('eventsCount');
    const lastSyncAtEl = document.getElementById('lastSyncAt');
    const liveStateEl = document.getElementById('liveState');

    let allEvents = [];
    let lastRenderedEvents = [];


    function formatTimestamp(date = new Date()) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function setFetchStatus(text, state = 'idle') {
        fetchStatusPill.textContent = text;
        fetchStatusPill.classList.remove('is-idle', 'is-loading', 'is-success', 'is-error');
        fetchStatusPill.classList.add(`is-${state}`);
    }

    function updateStats() {
        eventsCountEl.textContent = String(allEvents.length);
        if (allEvents.length > 0) {
            lastSyncAtEl.textContent = formatTimestamp(new Date());
        }
    }



    // Fetch events from the backend API
    async function fetchEvents() {
        try {
            const response = await fetch('/api/events');
            
            if (!response.ok) {
                const errData = await response.json();
                eventsGrid.innerHTML = `<div class="loading-state" style="color: #ef4444;">API Error: ${errData.error}</div>`;
                return;
            }

            const data = await response.json();
            
            if (data.events && data.events.length > 0) {
                allEvents = data.events;
                applyFiltersAndRender();
                updateStats();
                setFetchStatus('Loaded', 'success');
            } else {
                eventsGrid.innerHTML = '<div class="loading-state">No upcoming events found. Check back later!</div>';
                setFetchStatus('No Data', 'idle');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            eventsGrid.innerHTML = '<div class="loading-state">Failed to load events. Please try again later.</div>';
            setFetchStatus('Load Failed', 'error');
        }
    }

    async function triggerApifyFetch(customInput = null) {
        try {
            refreshApifyBtn.disabled = true;
            if (searchBtn) searchBtn.disabled = true;
            
            const locStr = locationInput.value.trim() ? ` (${locationInput.value.trim()})` : '';
            setFetchStatus(`Scraping${locStr}...`, 'loading');
            
            const response = await fetch('/api/apify/fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customInput || {})
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Fetch trigger failed');
            }

            setFetchStatus(`Synced ${data.eventsCount} events`, 'success');
            await fetchEvents();
        } catch (error) {
            console.error('Error triggering Apify fetch:', error);
            setFetchStatus('Fetch Failed', 'error');
        } finally {
            refreshApifyBtn.disabled = false;
            if (searchBtn) searchBtn.disabled = false;
        }
    }

    function getEventDateMs(event) {
        const raw = event?.dates?.start?.dateTime || event?.dates?.start?.localDate || null;
        const parsed = raw ? Date.parse(raw) : NaN;
        return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
    }

    function sortEvents(events) {
        const mode = sortSelect.value;
        const copy = [...events];

        if (mode === 'date-desc') {
            return copy.sort((a, b) => getEventDateMs(b) - getEventDateMs(a));
        }

        if (mode === 'name-asc') {
            return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        return copy.sort((a, b) => getEventDateMs(a) - getEventDateMs(b));
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    // Extract card creation logic to reuse properly
    function applyFiltersAndRender() {
        const keywordQuery = keywordInput.value.toLowerCase();
        const locQuery = locationInput.value.toLowerCase();
        
        let filtered = allEvents;
        
        if (keywordQuery || locQuery) {
            filtered = allEvents.filter(event => {
                const title = (event.name || '').toLowerCase();
                const desc = (event.description || event.info || '').toLowerCase();
                
                let loc = '';
                if (event._embedded && event._embedded.venues && event._embedded.venues.length > 0) {
                    loc = (event._embedded.venues[0].name || '').toLowerCase();
                    if (event._embedded.venues[0].city) loc += ' ' + (event._embedded.venues[0].city.name || '').toLowerCase();
                }
                
                const matchesKeyword = !keywordQuery || title.includes(keywordQuery) || desc.includes(keywordQuery);
                const matchesLoc = !locQuery || loc.includes(locQuery);
                
                return matchesKeyword && matchesLoc;
            });
        }
        
        renderEvents(sortEvents(filtered));
    }
    
    function createEventCard(event, isNew = false) {
        const title = event.name || 'Untitled Event';
        const description = event.info || event.description || 'Join this exciting event happening soon! Grab your tickets before they sell out.';
        
        let rawDate = new Date().toISOString();
        if (event.dates && event.dates.start) {
            rawDate = event.dates.start.dateTime || event.dates.start.localDate || rawDate;
        }
        
        const dateObj = new Date(rawDate);
        const dateString = dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });

        let location = 'Online / TBD';
        if (event._embedded && event._embedded.venues && event._embedded.venues.length > 0) {
            location = event._embedded.venues[0].name;
            if (event._embedded.venues[0].city) {
                location += `, ${event._embedded.venues[0].city.name}`;
            }
        }

        let imageUrl = 'https://images.unsplash.com/photo-1559136555-e4616d94625b?auto=format&fit=crop&w=600&q=80';
        if (event.images && event.images.length > 0) {
            // Find a good image size (16:9)
            const img = event.images.find(i => i.ratio === '16_9') || event.images[0];
            imageUrl = img.url;
        }

        const parametersObject = event.rawParameters || event;
        const parametersJson = escapeHtml(JSON.stringify(parametersObject, null, 2) || '{}');

        const card = document.createElement('div');
        card.className = isNew ? 'event-card new-realtime-event' : 'event-card';
        
        card.innerHTML = `
            <div class="event-image" style="background-image: url('${imageUrl}')"></div>
            <div class="event-content">
                <div class="event-date">${dateString}</div>
                <h3 class="event-title">${title}</h3>
                <p class="event-desc">${description}</p>
                <div class="event-footer">
                    <div class="event-location">📍 ${location}</div>
                    <a href="${event.url || '#'}" target="_blank" style="color: var(--accent-primary); text-decoration: none; font-weight: 600;">Details ↗</a>
                </div>
                <details class="event-params">
                    <summary>All Parameters</summary>
                    <pre>${parametersJson}</pre>
                </details>
            </div>
        `;
        return card;
    }

    function renderEvents(events) {
        eventsGrid.innerHTML = '';
        lastRenderedEvents = events;
        
        if (events.length === 0) {
            const locQuery = locationInput.value.trim();
            const keywordQuery = keywordInput.value.trim();
            let label = [];
            if (keywordQuery) label.push(`"${escapeHtml(keywordQuery)}"`);
            if (locQuery) label.push(`near "${escapeHtml(locQuery)}"`);
            const labelStr = label.length > 0 ? ` for ${label.join(' ')}` : '';

            if (locQuery || keywordQuery) {
                eventsGrid.innerHTML = `
                    <div class="loading-state">
                        <div style="margin-bottom: 1.5rem; font-size: 1.2rem; color: var(--text-secondary);">No local events found${labelStr}.</div>
                        <button onclick="document.getElementById('refreshApifyBtn').click()" class="btn-primary" style="border: none; cursor: pointer; padding: 0.8rem 2rem; font-size: 1rem;">
                            Deep Fetch from Meetup
                        </button>
                    </div>`;
            } else {
                eventsGrid.innerHTML = '<div class="loading-state">No events match your criteria.</div>';
            }
            return;
        }

        events.forEach(event => {
            const card = createEventCard(event);
            eventsGrid.appendChild(card);
        });
    }

    // WebSocket Integration
    const socket = io();

    socket.on('apify_events_updated', (newBatchOfEvents) => {
        console.log("Real-time Apify data received!", newBatchOfEvents);
        
        // Replace our current state with the freshly scraped dataset!
        allEvents = newBatchOfEvents;
        
        // Apply default search (e.g. Jalandhar) and render instantly with the new data
        applyFiltersAndRender();
        
        // We can optionally attach the animation trick to stagger them in natively
        const cards = eventsGrid.querySelectorAll('.event-card');
        cards.forEach((card, index) => {
            card.classList.add('new-realtime-event');
            card.style.animationDelay = `${index * 0.1}s`;
        });

        updateStats();
        setFetchStatus(`Live update: ${newBatchOfEvents.length} events`, 'success');
    });

    socket.on('connect', () => {
        liveStateEl.innerHTML = '<span class="pulse-dot"></span> Connected';
    });

    socket.on('disconnect', () => {
        liveStateEl.innerHTML = '<span class="pulse-dot offline"></span> Disconnected';
    });

    keywordInput.addEventListener('input', () => {
        applyFiltersAndRender();
    });

    locationInput.addEventListener('input', () => {
        applyFiltersAndRender();
    });

    const triggerSearchExplicit = (e) => {
        if (e.type === 'click' || e.key === 'Enter') {
            applyFiltersAndRender();
            document.getElementById('events').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    keywordInput.addEventListener('keypress', triggerSearchExplicit);
    locationInput.addEventListener('keypress', triggerSearchExplicit);
    searchBtn.addEventListener('click', triggerSearchExplicit);

    // Chip Filtering (Visual only for demo)
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            // Re-render based on chip category simulation
            // For now, "All" shows all, others show random subset or full list depending on data
            const category = chip.innerText.toLowerCase();
            if (category === 'all') {
                applyFiltersAndRender();
            } else {
                const filtered = allEvents.filter(e => {
                    const title = (e.name || '').toLowerCase();
                    const desc = (e.description || '').toLowerCase();
                    return title.includes(category) || desc.includes(category);
                });
                renderEvents(filtered);
            }
        });
    });

    refreshApifyBtn.addEventListener('click', () => {
        const keywordQuery = keywordInput.value.trim();
        const locQuery = locationInput.value.trim();
        let payload = null;
        
        if (keywordQuery || locQuery) {
            let formattedLoc = locQuery;
            if (formattedLoc.toLowerCase() === 'jalandhar' || formattedLoc.toLowerCase().includes('jalandhar')) {
                formattedLoc = 'in--India--Jalandhar';
            } else if (formattedLoc.toLowerCase() === 'new york' || formattedLoc.toLowerCase().includes('new york')) {
                formattedLoc = 'us--ny--New York';
            }
            const keywordsEncoded = encodeURIComponent(keywordQuery || 'startup');
            const locEncoded = encodeURIComponent(formattedLoc);
            const url = `https://www.meetup.com/find/?keywords=${keywordsEncoded}&location=${locEncoded}&source=EVENTS&distance=anyDistance`;
            
            payload = {
                searchUrls: [url],
                maxItems: 50,
                proxyConfiguration: {
                    useApifyProxy: true,
                    apifyProxyGroups: ['RESIDENTIAL']
                }
            };
        }
        triggerApifyFetch(payload);
    });

    clearSearchBtn.addEventListener('click', () => {
        keywordInput.value = '';
        locationInput.value = '';
        applyFiltersAndRender();
    });
    sortSelect.addEventListener('change', applyFiltersAndRender);

    setFetchStatus('Idle', 'idle');

    // Initial fetch
    fetchEvents();
});
