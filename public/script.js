const titlesContainer = document.getElementById('titles-container');
const postContainer = document.getElementById('post-container');
const search = document.getElementById('search');
const categoryButtons = document.querySelectorAll('.category-btn');
const allOpportunitiesButton = document.getElementById('all-opportunities');
const labelFiltersContainer = document.getElementById('label-filters');
const banner = document.getElementById('banner');

let posts = [];
let currentCategory = '';
let selectedPostTitle = null;

const categories = ['internship', 'competitions', 'scholarships', 'volunteers', 'events'];
const mentorCategory = 'mentors';
const labels = {
    '': {
        'Field': ['Business And Management', 'Engineering, Technology & Data', 'General', 'Product & Design'],
        'Mentoring Topic': []  // Empty since you want to remove the filter
    }
};

async function fetchAllPosts() {
    try {
        const res = await fetch('http://localhost:3000/api/all');
        const data = await res.json();

        posts = Object.entries(data).flatMap(([category, categoryPosts]) =>
            categoryPosts.map(post => ({
                ...post,
                category,
                expired: new Date(post.deadline) < new Date(),
                daysLeft: Math.ceil((new Date(post.deadline) - new Date()) / (1000 * 60 * 60 * 24))
            }))
        );

        const mentorPosts = posts.filter(post => post.category === mentorCategory);
        const uniqueMentoringTopics = [...new Set(mentorPosts.map(post => post.labels['Mentoring Topic']).flat())];
        labels['Mentors']['Mentoring Topic'] = uniqueMentoringTopics;

        displayPosts();
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

function displayPosts() {
    titlesContainer.innerHTML = '';
    let filteredPosts = posts.filter(post => 
        (currentCategory === '' && post.category !== mentorCategory) || 
        post.category === currentCategory
    );

    // Sort posts if necessary
    filteredPosts = filteredPosts.sort((a, b) => b.id - a.id); // Default sorting by ID (or any other default order)

    const activePosts = filteredPosts.filter(post => !post.expired);
    const expiredPosts = filteredPosts.filter(post => post.expired);

    const sortedPosts = [...activePosts, ...expiredPosts];

    sortedPosts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.classList.add('post');
        if (post.expired) postEl.classList.add('expired');
        if (selectedPostTitle === post.title) postEl.classList.add('clicked');
        postEl.innerHTML = `
            ${post.category === 'mentors' ? `<img src="${post.image}" alt="${post.title}" class="mentor-img">` : `<img src="${post.image}" alt="${post.title}" class="post-logo">`}
            <div class="post-details">
                <h3 class="post-title ${selectedPostTitle === post.title ? 'clicked' : ''}">
                    ${post.title}
                </h3>
                <div class="labels-container">
                    ${post.category === 'mentors' ? `<span class="label">${post.labels['Organization']}</span>` : 
                    post.category !== 'internship' ? Object.entries(post.labels).map(([key, value]) => 
                      Array.isArray(value) ? value.map(v => `<span class="label">${v}</span>`).join('') :
                      `<span class="label">${value}</span>`
                    ).join('') : `<span class="label">${post.labels['Company']}</span>`}
                </div>
                ${post.expired ? '<span class="status-label expired-label">Expired</span>' : 
                (post.category !== 'mentors' && post.category !== 'internship' ? `<span class="status-label days-left-label">${post.daysLeft} days left</span>` : '')}
            </div>
            <span class="category">${post.category}</span>
        `;
        postEl.addEventListener('click', () => {
            selectedPostTitle = post.title;
            displayFullPost(post);
            displayPosts();
            banner.style.display = 'none';
        });
        titlesContainer.appendChild(postEl);
    });
}

function displayFullPost(post) {
    const additionalInfo = post.category === 'internship' ? Object.entries(post.labels).map(([key, value]) => {
        if (key !== 'Company' && key !== 'Position' && key !== 'Status') {
            return Array.isArray(value) ? value.map(v => `<span class="label">${v}</span>`).join('') :
            `<span class="label">${value}</span>`;
        }
        return '';
    }).join('') : '';

    postContainer.innerHTML = `
        <div class="post-header">
            <img src="${post.image || ''}" alt="${post.title}" class="post-logo">
            <div class="post-title-company">
                <h2>${post.title || 'Untitled Post'}</h2>
                <p class="company-name">${post.category === 'mentors' ? (post.labels['Organization'] || 'Organization Name') : (post.labels['Company'] || 'Company Name')}</p>
            </div>
        </div>
        <div class="post-actions">
            ${post.category === 'mentors' ? `
            <div class="action-icons">
                <a href="${post.linkedin || '#'}" target="_blank" class="linkedin-button">LinkedIn</a>
                <a href="${post.instagram || '#'}" target="_blank" class="instagram-button">Instagram</a>
            </div>
            <a href="${post.link || '#'}" target="_blank" class="schedule-mentoring-button">Schedule Mentoring</a>
            ` : `
            <a href="${post.link || '#'}" target="_blank" class="apply-button">Apply here</a>
            `}
        </div>
        ${post.category === 'mentors' ? `
        <div class="section-divider"></div>
        <div class="post-section mentoring-topic">
            <h3>Mentoring Topic</h3>
            <div class="mentoring-topic-labels">
                ${post.labels && post.labels['Mentoring Topic'] ? post.labels['Mentoring Topic'].map(topic => `<span class="label">${topic}</span>`).join('') : 'No topics available'}
            </div>
        </div>
        <div class="section-divider"></div>
        <div class="post-section">
            <h3>Experience</h3>
            <ul>
                ${post.experience ? post.experience.map(exp => `<li>${exp}</li>`).join('') : '<li>No experience listed</li>'}
            </ul>
        </div>
        <div class="post-section">
            <h3>Education</h3>
            <ul>
                ${post.education ? post.education.map(edu => `<li>${edu}</li>`).join('') : '<li>No education listed</li>'}
            </ul>
        </div>` : post.category === 'internship' ? `
        <div class="section-divider"></div>
        <div class="post-section">
            <h3>Responsibilities</h3>
            <ul>${post.responsibilities ? post.responsibilities.map(res => `<li>${res}</li>`).join('') : '<li>No responsibilities listed</li>'}</ul>
        </div>
        <div class="post-section">
            <h3>Requirements</h3>
            <ul>${post.requirements ? post.requirements.map(req => `<li>${req}</li>`).join('') : '<li>No requirements listed</li>'}</ul>
        </div>
        <div class="post-section">
            <h3>Additional Information</h3>
            <p>${additionalInfo || 'No additional information available'}</p>
        </div>
        ` : `
        <div class="section-divider"></div>
        <div class="post-section">
            <h3>${post.category.charAt(0).toUpperCase() + post.category.slice(1)} Details</h3>
            ${Array.isArray(post.body) ? post.body.map(line => `<p>${line}</p>`).join('') : '<p>No details available</p>'}
        </div>
        <div class="section-divider"></div>
        <div class="post-section">
            <h3>Additional Information</h3>
            <p>Deadline: ${post.deadline || 'Not specified'}</p>
            <p>Location: ${post.location || 'Not specified'}</p>
            <p>Contact: ${post.email || 'No email provided'}${post.phone ? `, ${post.phone}` : ''}</p>
        </div>
        `}
    `;
}

function filterPosts() {
    const searchTerm = search.value.toLowerCase();
    const selectedLabels = Array.from(document.querySelectorAll('.label-filter')).reduce((acc, filter) => {
        acc[filter.id] = filter.value;
        return acc;
    }, {});

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm) ||
            (post.description && post.description.toLowerCase().includes(searchTerm));
        const matchesCategory = currentCategory === '' || post.category === currentCategory;
        const matchesLabels = Object.keys(selectedLabels).every(key => 
            selectedLabels[key] === '' || (post.labels[key] ? Array.isArray(post.labels[key]) ? post.labels[key].includes(selectedLabels[key]) : post.labels[key] === selectedLabels[key] : false)
        );
        return matchesSearch && matchesCategory && matchesLabels;
    });

    titlesContainer.innerHTML = '';
    let activePosts = filteredPosts.filter(post => !post.expired);
    let expiredPosts = filteredPosts.filter(post => post.expired);

    const sortedFilteredPosts = [...activePosts, ...expiredPosts];

    sortedFilteredPosts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.classList.add('post');
        if (post.expired) postEl.classList.add('expired');
        if (selectedPostTitle === post.title) postEl.classList.add('clicked');
        postEl.innerHTML = `
            ${post.category === 'mentors' ? `<img src="${post.image}" alt="${post.title}" class="mentor-img">` : `<img src="${post.image}" alt="${post.title}" class="post-logo">`}
            <div class="post-details">
                <h3 class="post-title ${selectedPostTitle === post.title ? 'clicked' : ''}">
                    ${post.title}
                </h3>
                <div class="labels-container">
                    ${post.category === 'mentors' ? `<span class="label">${post.labels['Organization']}</span>` : 
                    post.category !== 'internship' ? Object.entries(post.labels).map(([key, value]) => 
                      Array.isArray(value) ? value.map(v => `<span class="label">${v}</span>`).join('') :
                      `<span class="label">${value}</span>`
                    ).join('') : `<span class="label">${post.labels['Company']}</span>`}
                </div>
                ${post.expired ? '<span class="status-label expired-label">Expired</span>' : 
                (post.category !== 'mentors' && post.category !== 'internship' ? `<span class="status-label days-left-label">${post.daysLeft} days left</span>` : '')}
            </div>
            <span class="category">${post.category}</span>
        `;
        postEl.addEventListener('click', () => {
            selectedPostTitle = post.title;
            displayFullPost(post);
            displayPosts();
            banner.style.display = 'none';
        });
        titlesContainer.appendChild(postEl);
    });
}

function updateCategory(event) {
    currentCategory = event.target.dataset.category || '';
    selectedPostTitle = null;
    displayPosts();
}

function updateLabels() {
    filterPosts();
}

function updateSearch() {
    filterPosts();
}

function setupLabelFilters() {
    Object.keys(labels).forEach(category => {
        const categoryFilters = labels[category];
        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('label-category');
        categoryContainer.innerHTML = `<h3>${category}</h3>`;

        Object.entries(categoryFilters).forEach(([labelKey, labelValues]) => {
            if (labelKey === 'Mentoring Topic' || labelKey === 'Field') return; // Skip unwanted filters

            const filterContainer = document.createElement('div');
            filterContainer.classList.add('label-filter-group');
            filterContainer.innerHTML = `<label for="${labelKey}">${labelKey}</label>`;

            const selectElement = document.createElement('select');
            selectElement.id = labelKey;
            selectElement.classList.add('label-filter');
            selectElement.addEventListener('change', updateLabels);

            selectElement.insertAdjacentHTML('beforeend', `<option value="">Any</option>`);
            labelValues.forEach(value => {
                selectElement.insertAdjacentHTML('beforeend', `<option value="${value}">${value}</option>`);
            });

            filterContainer.appendChild(selectElement);
            categoryContainer.appendChild(filterContainer);
        });

        labelFiltersContainer.appendChild(categoryContainer);
    });
}

search.addEventListener('input', updateSearch);
categoryButtons.forEach(button => button.addEventListener('click', updateCategory));
allOpportunitiesButton.addEventListener('click', () => {
    currentCategory = '';
    selectedPostTitle = null;
    displayPosts();
});

setupLabelFilters();
fetchAllPosts();
