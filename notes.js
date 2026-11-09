const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { MATTER_OPTIONS, escapeHtml, createMarked } = require('./posts');

const NOTES_DIR = path.join(__dirname, 'notes');
const GRID_WEEKS = 26;
const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Dates are handled as YYYY-MM-DD strings in UTC, so time zones can't shift a note to another day
function isoDay(date) {
    return date.toISOString().slice(0, 10);
}

function addDays(iso, days) {
    const date = new Date(`${iso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return isoDay(date);
}

// Function splits a note into takeaways. Each paragraph starts a new one;
// code blocks, lists and quotes after it belong to it.
function splitTakeaways(content) {
    const marked = createMarked();
    const tokens = marked.lexer(content);
    const groups = [];

    tokens.forEach(token => {
        if (token.type === 'space') return;
        if (token.type === 'paragraph' || groups.length === 0) {
            groups.push([]);
        }
        groups[groups.length - 1].push(token);
    });

    return groups.map(group => {
        group.links = tokens.links;
        return marked.parser(group);
    });
}

// Reads every note, newest first. The file name is the date: notes/2026-11-09.md.
// A broken file is skipped so it can't take the site down. Files starting with _ are ignored.
function loadNotes() {
    if (!fs.existsSync(NOTES_DIR)) return [];
    const notes = [];

    fs.readdirSync(NOTES_DIR)
        .filter(file => file.endsWith('.md') && !file.startsWith('_'))
        .forEach(file => {
            try {
                const date = file.slice(0, -3);
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date))) {
                    throw new Error('file name must be a date, like 2026-11-09.md');
                }
                const { data, content } = matter(fs.readFileSync(path.join(NOTES_DIR, file), 'utf8'), MATTER_OPTIONS);
                const takeaways = splitTakeaways(content);
                if (takeaways.length === 0) {
                    throw new Error('note is empty');
                }
                notes.push({
                    date,
                    tag: String(data.tag || 'notes'),
                    post: data.post ? String(data.post) : '',
                    takeaways
                });
            } catch (error) {
                console.error(`Skipping note ${file}:`, error.message);
            }
        });

    notes.sort((a, b) => b.date.localeCompare(a.date));
    notes.forEach((note, i) => { note.n = notes.length - i; });
    return notes;
}

// Function counts the current streak (ending today, or yesterday if today has no note yet)
// and the longest run of consecutive days with a note
function streaks(days, today) {
    let current = 0;
    let day = days.has(today) ? today : addDays(today, -1);
    while (days.has(day)) {
        current++;
        day = addDays(day, -1);
    }

    let longest = 0;
    days.forEach(d => {
        if (days.has(addDays(d, -1))) return;
        let run = 1;
        while (days.has(addDays(d, run))) run++;
        longest = Math.max(longest, run);
    });

    return { current, longest };
}

// Function builds the activity grid: one column per week, the last one holding today
function renderGrid(notes, today) {
    const counts = new Map(notes.map(note => [note.date, note.takeaways.length]));
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
    const start = addDays(today, -weekday - (GRID_WEEKS - 1) * 7);

    const cells = [];
    for (let day = start; day <= today; day = addDays(day, 1)) {
        const count = counts.get(day) || 0;
        const level = Math.min(count, 3);
        const tip = count ? `${day} — ${count} ${count > 1 ? 'takeaways' : 'takeaway'}` : `${day} — no note`;
        cells.push(`<span class="cell${level ? ` l${level}` : ''}" title="${tip}"></span>`);
    }
    return cells.join('');
}

function renderEntry(note) {
    const weekday = DAY_NAMES[new Date(`${note.date}T00:00:00Z`).getUTCDay()];
    const many = note.takeaways.length > 1;
    const items = note.takeaways.map((html, i) => `
                <li><span class="k mono" aria-hidden="true">${many ? String(i + 1).padStart(2, '0') : '→'}</span><div class="tk prose">${html}</div></li>`
    ).join('');
    const post = note.post
        ? `<a href="/post/${encodeURIComponent(note.post)}">→ became a post</a>`
        : '';

    return `
        <article class="en" data-tag="${escapeHtml(note.tag)}">
            <span class="node" aria-hidden="true"></span>
            <div class="dt mono"><b>${note.date}</b><span>${weekday} · #${String(note.n).padStart(3, '0')}</span></div>
            <div class="bd">
                <ol class="tks">${items}
                </ol>
                <div class="meta mono"><span>#${escapeHtml(note.tag)}</span>${post}</div>
            </div>
        </article>`;
}

function renderChips(notes) {
    const tags = ['all', ...new Set(notes.map(note => note.tag))];
    return tags.map(tag => {
        const count = tag === 'all' ? notes.length : notes.filter(note => note.tag === tag).length;
        return `<button class="chip${tag === 'all' ? ' on' : ''}" data-tag="${escapeHtml(tag)}" aria-pressed="${tag === 'all'}"><span class="sq" aria-hidden="true"></span>${escapeHtml(tag)}<sup>${count}</sup></button>`;
    }).join('');
}

// Function fills in the notes page template
function renderNotesPage(today = isoDay(new Date())) {
    const notes = loadNotes();
    const { current, longest } = streaks(new Set(notes.map(note => note.date)), today);

    const values = {
        total: notes.length,
        streak: current,
        longest,
        grid: renderGrid(notes, today),
        chips: notes.length ? renderChips(notes) : '',
        entries: notes.length
            ? notes.map(renderEntry).join('')
            : '<p class="mono label empty">no notes yet.</p>'
    };

    const template = fs.readFileSync(path.join(__dirname, 'views', 'notes.html'), 'utf8');
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key]);
}

module.exports = { NOTES_DIR, renderNotesPage };
