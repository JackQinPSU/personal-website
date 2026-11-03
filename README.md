# Personal Website

Technical blog by Jack Qin. Posts are Markdown files, built into a static site and hosted on Netlify.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Add a post

1. Copy `posts/_template.md` to `posts/my-post.md` and edit it. The file name sets the URL: `/post/my-post`.
2. Commit it to `master`, or upload it to `posts/` on GitHub. Put images in the same folder.

Netlify rebuilds the site on each commit. A post with an invalid header is skipped, and the reason appears in the deploy log.

## Build

```bash
npm run build
```

Output goes to `dist/`.
