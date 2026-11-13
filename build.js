const fs = require('fs');
const path = require('path');
const { POSTS_DIR, listPosts, renderPostPage } = require('./posts');

const DIST = path.join(__dirname, 'dist');
const ASSET_TYPES = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf'];

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(__dirname, 'public'), DIST, { recursive: true });

// A page for each post
const posts = listPosts();
posts.forEach(post => {
    const dir = path.join(DIST, 'post', post.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderPostPage(post.slug));
});

// List of posts for the home page
fs.writeFileSync(path.join(DIST, 'posts.json'), JSON.stringify(posts));

// Images and files uploaded next to the posts
fs.mkdirSync(path.join(DIST, 'post'), { recursive: true });
fs.readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isFile() && ASSET_TYPES.includes(path.extname(entry.name).toLowerCase()))
    .forEach(entry => fs.copyFileSync(path.join(POSTS_DIR, entry.name), path.join(DIST, 'post', entry.name)));

console.log(`Built ${posts.length} post(s) into dist/`);
