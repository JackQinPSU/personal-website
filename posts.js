const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { Marked } = require('marked');
const hljs = require('highlight.js/lib/common');

const POSTS_DIR = path.join(__dirname, 'posts');

// gray-matter runs a post's header as code if it starts with ---js, so turn that off
const MATTER_OPTIONS = {
    engines: {
        javascript: {
            parse() {
                throw new Error('JavaScript front matter is not allowed');
            }
        }
    }
};

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Reads every post, newest first. A broken file is skipped so it can't take the site down.
// Files starting with _ (like _template.md) are ignored.
function loadPosts() {
    const posts = [];

    fs.readdirSync(POSTS_DIR)
        .filter(file => file.endsWith('.md') && !file.startsWith('_'))
        .forEach(file => {
            try {
                const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'), MATTER_OPTIONS);
                const date = new Date(data.date);
                if (!data.title || isNaN(date)) {
                    throw new Error('needs a title and a date');
                }
                posts.push({
                    slug: file.slice(0, -3),
                    title: String(data.title),
                    date: date.toISOString().slice(0, 10),
                    tag: String(data.tag || 'notes'),
                    summary: data.summary ? String(data.summary) : '',
                    content
                });
            } catch (error) {
                console.error(`Skipping post ${file}:`, error.message);
            }
        });

    return posts.sort((a, b) => b.date.localeCompare(a.date));
}

function highlight(text, language) {
    if (language && hljs.getLanguage(language)) {
        return hljs.highlight(text, { language }).value;
    }
    return escapeHtml(text);
}

// Function makes the markdown renderer used by posts.
// Each h2 it renders is added to `headings`, for the table of contents.
function createMarked(headings = []) {
    return new Marked({
        // Images sit next to the posts, so a bare file name points at /post/<name>
        walkTokens(token) {
            if (token.type === 'image' && !/^([a-z][a-z0-9+.-]*:|\/)/i.test(token.href)) {
                token.href = `/post/${token.href}`;
            }
        },
        renderer: {
            heading({ tokens, depth }) {
                const html = this.parser.parseInline(tokens);
                if (depth !== 2) return `<h${depth}>${html}</h${depth}>\n`;

                // The id comes from the heading text, so a post can link to #troubleshooting
                const text = html.replace(/<[^>]+>/g, '').replace(/&[#\w]+;/g, ' ');
                const base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
                let id = base;
                for (let n = 2; headings.some(h => h.id === id); n++) id = `${base}-${n}`;
                headings.push({ id, text: html.replace(/<[^>]+>/g, '').toLowerCase() });
                return `<h2 id="${id}">${html}</h2>\n`;
            },
            // A code fence can name a file after its language: ```c ring.c
            code({ text, lang }) {
                const [language, filename] = (lang || '').trim().split(/\s+/);
                return `<figure class="code-block">
    <figcaption>
        <span class="mono label">${escapeHtml(filename || language || 'code')}</span>
        <button class="cp" data-copy aria-live="polite">
            <svg class="icon-done" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"></path></svg>
            <svg class="icon-copy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="12"></rect><path d="M4 16V4h12"></path></svg>
            <span class="cp-label">copy</span>
        </button>
    </figcaption>
<pre class="mono">${highlight(text, language)}</pre>
</figure>\n`;
            }
        }
    });
}

// Function turns a post's markdown into HTML, and collects its h2s for the table of contents
function renderMarkdown(content) {
    const headings = [];
    const html = createMarked(headings).parse(content);
    return { html, headings };
}

function renderToc(headings) {
    if (headings.length === 0) return '';

    const links = headings.map((h, i) =>
        `<a href="#${h.id}">${String(i + 1).padStart(2, '0')} — ${h.text}</a>`
    ).join('\n');
    return `<nav class="toc rv" aria-label="Contents" style="--i: 2">\n${links}\n</nav>`;
}

function renderNext(next) {
    if (!next) return '';

    return `<div class="post-next rv" style="--i: 4">
    <div>
        <span class="mono label">next post</span>
        <span class="post-next-title">${escapeHtml(next.title)}</span>
    </div>
    <a class="btn" href="/post/${encodeURIComponent(next.slug)}">read next<span class="arr" aria-hidden="true">→</span></a>
</div>`;
}

// Function fills in the post page template, or returns null if there's no such post
function renderPostPage(slug) {
    const posts = loadPosts();
    const index = posts.findIndex(p => p.slug === slug);
    if (index === -1) return null;

    const post = posts[index];
    const { html, headings } = renderMarkdown(post.content);
    const words = post.content.split(/\s+/).filter(Boolean).length;
    const values = {
        title: escapeHtml(post.title),
        date: post.date,
        tag: escapeHtml(post.tag),
        minutes: Math.max(1, Math.ceil(words / 200)),
        summary: post.summary ? `<p class="lede">${escapeHtml(post.summary)}</p>` : '',
        toc: renderToc(headings),
        content: html,
        next: renderNext(posts[index + 1])
    };

    const template = fs.readFileSync(path.join(__dirname, 'views', 'post.html'), 'utf8');
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key]);
}

function listPosts() {
    return loadPosts().map(({ slug, title, date, tag }) => ({ slug, title, date, tag }));
}

module.exports = { POSTS_DIR, listPosts, renderPostPage };
