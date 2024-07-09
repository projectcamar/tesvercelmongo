const titlesContainer = document.getElementById('titles-container');
const postContainer = document.getElementById('post-container');
const search = document.getElementById('search');
const categoryButtons = document.querySelectorAll('.category-btn');
const allOpportunitiesButton = document.getElementById('all-opportunities');
const labelFiltersContainer = document.getElementById('label-filters');

let posts = [];
let currentCategory = '';
let selectedPostTitle = null;

const categories = ['internship', 'competitions', 'scholarships', 'volunteers', 'events'];
const mentorCategory = 'mentors';
const labels = {
    'Mentors': {
        'Field': ['Business And Management', 'Engineering, Technology & Data', 'General', 'Product & Design'],
        'Skills': [],
        'Organization': []
    }
};

async function fetchPosts(category = '') {
    let data = [];
    if (category && category !== mentorCategory) {
        const res = await fetch(`/api/${category}`);
        data = await res.json();
    } else if (category === mentorCategory) {
        const res = await fetch(`/api/${mentorCategory}`);
        data = await res.json();
    } else {
        const res = await Promise.all(categories.map(cat => fetch(`/api/${cat}`)));
        data = (await Promise.all(res.map(r => r.json()))).flat();
    }

    posts = data.map(post => ({
        ...post,
        expired: new Date(post.deadline) < new Date()
    }));

    // Populate unique companies and skills for Mentors
    if (category === mentorCategory) {
        const uniqueSkills = [...new Set(posts.map(post => post.labels['Skills']).flat())];
        const uniqueOrganizations = [...new Set(posts.map(post => post.labels['Organization']))];
        labels['Mentors']['Skills'] = uniqueSkills;
        labels['Mentors']['Organization'] = uniqueOrganizations;
    }

    displayPosts();
}

function displayPosts() {
    titlesContainer.innerHTML = '';
    const filteredPosts = posts.filter(post => currentCategory === '' || post.category.replace(/ /g, '_').toLowerCase() === currentCategory);
    
    // Sort posts by ID in descending order to display latest first
    filteredPosts.sort((a, b) => b.id - a.id);

    const activePosts = filteredPosts.filter(post => !post.expired);
    const expiredPosts = filteredPosts.filter(post => post.expired);

    const sortedPosts = [...activePosts, ...expiredPosts]; // Ensure expired posts are at the bottom

    sortedPosts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.classList.add('post');
        if (post.expired) postEl.classList.add('expired');
        if (selectedPostTitle === post.title) postEl.classList.add('clicked');
        postEl.innerHTML = `
            <img src="${post.image}" alt="${post.title}" class="mentor-img">
            <h3 class="post-title ${selectedPostTitle === post.title ? 'clicked' : ''}">
                ${post.title}
                ${post.expired ? '<span class="expired-label">Expired</span>' : ''}
            </h3>
            <span class="category">${post.category}</span>
            ${Object.entries(post.labels).map(([key, value]) => `<span class="label">${value}</span>`).join('')}
        `;
        postEl.addEventListener('click', () => {
            selectedPostTitle = post.title;
            displayFullPost(post);
            displayPosts();
        });
        titlesContainer.appendChild(postEl);
    });
}

function displayFullPost(post) {
    postContainer.innerHTML = `
        <div class="post-header">
            <img src="${post.image}" alt="Company Logo" class="post-logo">
            <div class="post-title-company">
                <h2>${post.title}</h2>
                <p class="company-name">${post.labels['Organization'] || 'Company Name'}</p>
            </div>
        </div>
        <div class="post-labels">
            ${Object.entries(post.labels).map(([key, value]) => `<span class="label">${value}</span>`).join('')}
        </div>
        <div class="post-actions">
            ${post.category === 'Mentors' ? `
            <div class="action-icons">
                <a href="${post.linkedin}" target="_blank" class="linkedin-button">LinkedIn</a>
                <a href="${post.instagram}" target="_blank" class="instagram-button">Instagram</a>
            </div>
            <a href="${post.link}" target="_blank" class="schedule-mentoring-button">Schedule Mentoring</a>
            ` : `
            <a href="${post.link}" target="_blank" class="apply-button">Apply here</a>
            `}
        </div>
        ${post.category === 'Mentors' ? `
        <div class="section-divider"></div>
        <div class="post-section">
            <h3>Experience</h3>
            <ul>
                ${post.experience.map(exp => `<li>${exp}</li>`).join('')}
            </ul>
        </div>
        <div class="post-section">
            <h3>Education</h3>
            <ul>
                ${post.education.map(edu => `<li>${edu}</li>`).join('')}
            </ul>
        </div>` : `
        <div class="section-divider"></div>
        <div class="post-section">
            <h3>Category</h3>
            <p>${post.category}</p>
        </div>
        <div class="post-section">
            <h3>Description</h3>
            <p>${post.body}</p>
        </div>
        `}
        <div class="section-divider"></div>
        <div class="post-section">
            <h3>Company Information</h3>
            <div class="company-info">
                <div class="company-info-item">
                    <strong>Location:</strong> ${post.location}
                </div>
                <div class="company-info-item">
                    <strong>Email:</strong> ${post.email}
                </div>
                <div class="company-info-item">
                    <strong>Phone:</strong> ${post.phone}
                </div>
            </div>
        </div>
    `;
}

function filterPosts() {
    const searchTerm = search.value.toLowerCase();
    const selectedLabels = Array.from(document.querySelectorAll('.label-filter')).reduce((acc, filter) => {
        acc[filter.id] = filter.value;
        return acc;
    }, {});

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm) || post.body.toLowerCase().includes(searchTerm);
        const matchesCategory = currentCategory === '' || post.category.replace(/ /g, '_').toLowerCase() === currentCategory;
        const matchesLabels = Object.entries(selectedLabels).every(([key, value]) => value === '' || post.labels[key] === value);
        return matchesSearch && matchesCategory && matchesLabels;
    });

    titlesContainer.innerHTML = '';
    const activePosts = filteredPosts.filter(post => !post.expired);
    const expiredPosts = filteredPosts.filter(post => post.expired);

    const sortedFilteredPosts = [...activePosts, ...expiredPosts]; // Ensure expired posts are at the bottom

    sortedFilteredPosts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.classList.add('post');
        if (post.expired) postEl.classList.add('expired');
        if (selectedPostTitle === post.title) postEl.classList.add('clicked');
        postEl.innerHTML = `
            <img src="${post.image}" alt="${post.title}" class="mentor-img">
            <h3 class="post-title ${selectedPostTitle === post.title ? 'clicked' : ''}">
                ${post.title}
                ${post.expired ? '<span class="expired-label">Expired</span>' : ''}
            </h3>
            <span class="category">${post.category}</span>
            ${Object.entries(post.labels).map(([key, value]) => `<span class="label">${value}</span>`).join('')}
        `;
        postEl.addEventListener('click', () => {
            selectedPostTitle = post.title;
            displayFullPost(post);
            displayPosts();
        });
        titlesContainer.appendChild(postEl);
    });
}

function updateLabelFilters(category) {
    labelFiltersContainer.innerHTML = '';
    if (labels[category]) {
        Object.entries(labels[category]).forEach(([key, values]) => {
            const select = document.createElement('select');
            select.id = key;
            select.classList.add('label-filter');
            select.innerHTML = `
                <option value="">All ${key}</option>
                ${values.map(value => `<option value="${value}">${value}</option>`).join('')}
            `;
            select.addEventListener('change', filterPosts);
            labelFiltersContainer.appendChild(select);
        });
    }
}

search.addEventListener('input', filterPosts);

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentCategory = button.dataset.category;
        selectedPostTitle = null; // Reset selected post
        updateLabelFilters(currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1));
        fetchPosts(currentCategory);
    });
});

// Load all opportunities when the page first loads
window.addEventListener('DOMContentLoaded', () => {
    allOpportunitiesButton.classList.add('active');
    fetchPosts();
});

allOpportunitiesButton.addEventListener('click', () => {
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    allOpportunitiesButton.classList.add('active');
    currentCategory = '';
    selectedPostTitle = null; // Reset selected post
    fetchPosts();
});
