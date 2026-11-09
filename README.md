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

## Add a daily note

1. Copy `notes/_template.md` to `notes/2026-11-09.md` (the file name is the day) and edit it. Each paragraph is one takeaway; a code block after a paragraph belongs to it.
2. Set `tag:` in the header. If the note became a full post, add `post: <post-slug>` to link it.

Notes appear newest first at `/notes`, with an activity grid and streak counts. These are worked out at build time, so they update on each deploy.

## Contact form

Messages are stored by Netlify Forms. In the Netlify dashboard, open **Forms**, select **Enable form detection**, and redeploy. To get messages by email, add one under **Forms > Submission notifications**.

## Newsletter

Sign-ups go to [Buttondown](https://buttondown.com). Replace `YOUR_BUTTONDOWN_USERNAME` in `public/index.html` with your username.

To email subscribers about a new post, do one of these after it deploys:

- **By hand (free):** write an email in Buttondown with the post's title, summary, and link.
- **Automatically (paid add-on):** turn on Buttondown's RSS-to-email and point it at `/feed.xml`.

## Build

```bash
npm run build
```

Output goes to `dist/`.
