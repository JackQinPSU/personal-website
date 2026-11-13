const express = require('express');
const path = require('path');
const { POSTS_DIR, listPosts, renderPostPage } = require('./posts');
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Images and files uploaded next to the posts
app.use('/post', express.static(POSTS_DIR, { index: false }));

// List of posts for the home page
app.get('/posts.json', (req, res) => {
    res.json(listPosts());
});

// A single post
app.get('/post/:slug', (req, res) => {
    const page = renderPostPage(req.params.slug);
    if (!page) {
        return res.status(404).send('Post not found.');
    }
    res.send(page);
});

// Start the local preview server, reachable only from this computer
const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
