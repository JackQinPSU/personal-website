const projects = [
    {
        title: "predict.gg",
        link: "https://predictgg.vercel.app/",
        description: "A platform for predicting League of Legends match outcomes using machine learning algorithms.",
        tags: ["Machine Learning", "Web Development", "Data Science", "Python"],
        image: "./images/predictgg.jpg"
    },
    {
        title: "booksmart",
        link: "",
        description: "An AI-powered book recommendation system that suggests books based on user preferences and reading history.",
        tags: ["AI", "Recommender Systems", "Web Development", "Full-Stack"],
        image: "./images/booksmart.jpg"
    }
];

// Function adds the projects to the HTML
function loadProjects() {
    const container = document.getElementById('projects');

    projects.forEach(p => {

        const tagsHTML = p.tags.map(t => 
            `<span class="tag">${t}</span>`
        ).join('');

        container.innerHTML += `
            <div class="project-card">
                <img src="${p.image}" class="project-img" />
                <h2>${p.title}</h2>
                <p>${p.description}</p>
                <a href="${p.link}" target="_blank">View Project</a>
                <div class="tags">${tagsHTML}</div>
            </div>
        `;
    });
}

loadProjects();