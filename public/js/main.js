function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text;
    return el.innerHTML.replace(/"/g, '&quot;');
}

// Function adds the post rows for the selected tag to the HTML
function renderPosts(posts, tag) {
    const container = document.getElementById('posts');
    const list = posts.filter(p => tag === "all" || p.tag === tag);

    container.innerHTML = list.map((p, i) => `
        <a class="row" href="/post/${encodeURIComponent(p.slug)}">
            <span class="n">${String(i + 1).padStart(2, '0')}</span>
            <span class="d">${p.date}</span>
            <span class="t">${escapeHtml(p.title)}</span>
            <span class="tag">${escapeHtml(p.tag)}<span class="ra" aria-hidden="true">→</span></span>
        </a>
    `).join('');
}

// Function fetches the posts, then adds the filter chips and wires them to the post list
async function loadWriting() {
    const chips = document.getElementById('chips');
    if (!chips) return;

    const response = await fetch('/posts.json');
    const posts = await response.json();
    const tags = ["all", ...new Set(posts.map(p => p.tag))];

    if (posts.length > 0) {
        document.getElementById('latest').href = `/post/${encodeURIComponent(posts[0].slug)}`;
    }

    chips.innerHTML = tags.map(t => {
        const count = t === "all" ? posts.length : posts.filter(p => p.tag === t).length;
        return `<button class="chip" data-tag="${escapeHtml(t)}"><span class="sq" aria-hidden="true"></span>${escapeHtml(t)}<sup>${count}</sup></button>`;
    }).join('');

    const buttons = chips.querySelectorAll('.chip');

    function select(tag) {
        buttons.forEach(b => {
            const on = b.dataset.tag === tag;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on);
        });
        renderPosts(posts, tag);
    }

    buttons.forEach(b => b.addEventListener('click', () => select(b.dataset.tag)));
    select("all");
}

// Function re-types an element's label through random glyphs on hover and focus
function addScramble(el) {
    const label = el.firstChild;
    const text = label.textContent;
    const glyphs = '!<>-_/\\[]{}=+*^?#01';
    let timer = null;

    function run() {
        if (timer) return;
        let p = 0;
        timer = setInterval(() => {
            p += 0.45;
            if (p >= text.length) {
                label.textContent = text;
                clearInterval(timer);
                timer = null;
                return;
            }
            label.textContent = text.split('').map((ch, i) =>
                ch === ' ' || i < p ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]
            ).join('');
        }, 28);
    }

    el.addEventListener('mouseenter', run);
    el.addEventListener('focus', run);
}

// Function makes the code block's copy button copy the code
function addCopyButton(btn) {
    const code = btn.closest('figure').querySelector('pre');
    const label = btn.querySelector('.cp-label');
    let timer = null;

    btn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(code.textContent);
        } catch (error) {
            console.error('Copy failed:', error);
            return;
        }
        btn.classList.add('ok');
        label.textContent = 'copied';
        clearTimeout(timer);
        timer = setTimeout(() => {
            btn.classList.remove('ok');
            label.textContent = 'copy';
        }, 1600);
    });
}

// Function sends the contact form to Netlify without leaving the page
function addContactForm(form) {
    const button = form.querySelector('button');
    const status = form.querySelector('.form-status');

    form.addEventListener('submit', async event => {
        event.preventDefault();
        button.disabled = true;
        status.textContent = 'sending…';

        try {
            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(new FormData(form)).toString()
            });
            if (!response.ok) throw new Error(`status ${response.status}`);
            form.reset();
            status.textContent = 'sent. thanks for writing.';
        } catch (error) {
            console.error('Could not send message:', error);
            status.textContent = 'could not send. please try again.';
        } finally {
            button.disabled = false;
        }
    });
}

// Function wires the notes page: topic chips filter the log, and older notes show a page at a time.
// Without JavaScript every note is simply shown.
function addNotesLog() {
    const chips = document.getElementById('note-chips');
    const list = document.getElementById('notes');
    if (!chips || !list) return;

    const PAGE = 10;
    const entries = [...list.querySelectorAll('.en')];
    const buttons = chips.querySelectorAll('.chip');
    const more = document.getElementById('more');
    const end = document.getElementById('end');
    let tag = 'all';
    let shown = PAGE;

    function update() {
        const matching = entries.filter(e => tag === 'all' || e.dataset.tag === tag);
        entries.forEach(e => { e.hidden = true; });
        matching.slice(0, shown).forEach(e => { e.hidden = false; });
        more.hidden = matching.length <= shown;
        end.hidden = matching.length === 0 || !more.hidden;
    }

    buttons.forEach(b => b.addEventListener('click', () => {
        tag = b.dataset.tag;
        shown = PAGE;
        buttons.forEach(other => {
            const on = other === b;
            other.classList.toggle('on', on);
            other.setAttribute('aria-pressed', on);
        });
        update();
    }));

    more.addEventListener('click', () => {
        shown += PAGE;
        update();
    });

    update();
}

loadWriting().catch(error => console.error('Could not load posts:', error));
addNotesLog();

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-scramble]').forEach(addScramble);
}

document.querySelectorAll('[data-copy]').forEach(addCopyButton);
document.querySelectorAll('[data-contact]').forEach(addContactForm);
