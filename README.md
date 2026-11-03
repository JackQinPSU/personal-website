# Personal Website - Jack Qin

A personal technical blog.

## 🚀 Demo
You can view the site live at: https://personal-website-y4yz.onrender.com/


## ✍️ Adding a post

Posts are Markdown files in the `posts/` folder. To add one from the GitHub website:

1. Copy `posts/_template.md` to a new file on your computer, like `my-post.md`, and write the post. The file name becomes the link: `/post/my-post`. Avoid spaces in file names.
2. Open the `posts` folder on GitHub, choose **Add file > Upload files**, and upload it, along with any images it uses.
3. Commit to `master`. Netlify rebuilds the site and the post appears.

Each post starts with its title, date and tag. Keep the title in quotes. A post with a missing title or date, or broken quoting, is skipped, and the reason is printed in the Netlify deploy log.

To remove a post, delete its file.

## 🛠 Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Posts:** Markdown (marked, gray-matter, highlight.js)

## 🧑‍💻 Getting Started

To run locally:

```bash
git clone https://github.com/JackQinPSU/personal-website.git
cd personal-website
npm install
npm run dev
```
