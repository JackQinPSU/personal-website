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

loadWriting().catch(error => console.error('Could not load posts:', error));

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-scramble]').forEach(addScramble);
}

document.querySelectorAll('[data-copy]').forEach(addCopyButton);
