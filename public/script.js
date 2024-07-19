const titlesContainer = document.getElementById('titles-container');
const postContainer = document.getElementById('post-container');
const search = document.getElementById('search');
const categoryButtons = document.querySelectorAll('.category-btn');
const allOpportunitiesButton = document.getElementById('all-opportunities');
const labelFiltersContainer = document.getElementById('label-filters');
const banner = document.getElementById('banner');
const sortBySelect = document.getElementById('sort-by');

let posts = [];
let currentCategory = '';
let selectedPostTitle = null;

const categories = ['internship', 'competitions', 'scholarships', 'volunteers', 'events'];
const mentorCategory = 'mentors';
const labels = {
    'Mentors': {
        'Field': ['Business And Management', 'Engineering, Technology & Data', 'General', 'Product & Design'],
        'Mentoring Topic': []
    }
};

async function fetchAllPosts() {
    try {
        const res = await fetch('/api/all');
        const data = await res.json();
async function fetchAllPosts() {
  try {
    const res = await fetch('/api/all');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    // ... rest of the function
  } catch (error) {
    console.error('Error fetching posts:', error);
    // Maybe update the UI to show an error message
  }
}
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

    if (sortBySelect.value === 'days-left') {
        filteredPosts = filteredPosts.sort((a, b) => a.daysLeft - b.daysLeft);
    } else {
        filteredPosts = filteredPosts.sort((a, b) => b.id - a.id);
    }

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
        const matchesSearch = post.title.toLowerCase().includes(searchTerm) || (post.body && post.body.toLowerCase().includes(searchTerm));
        const matchesCategory = (currentCategory === '' && post.category !== mentorCategory) || post.category === currentCategory;
        const matchesLabels = Object.entries(selectedLabels).every(([key, value]) => 
            value === '' || (Array.isArray(post.labels[key]) ? post.labels[key].includes(value) : post.labels[key] === value)
        );
        return matchesSearch && matchesCategory && matchesLabels;
    });

    titlesContainer.innerHTML = '';
    let activePosts = filteredPosts.filter(post => !post.expired);
    let expiredPosts = filteredPosts.filter(post => post.expired);

    if (sortBySelect.value === 'days-left') {
        activePosts = activePosts.sort((a, b) => a.daysLeft - b.daysLeft);
        expiredPosts = expiredPosts.sort((a, b) => a.daysLeft - b.daysLeft);
    }

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
                  (post.category !== 'mentors' ? `<span class="status-label days-left-label">${post.daysLeft} days left</span>` : '')}
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

function createLabelFilters(labels) {
    labelFiltersContainer.innerHTML = '';

    Object.entries(labels).forEach(([labelCategory, labelValues]) => {
        const filterContainer = document.createElement('div');
        filterContainer.classList.add('label-filter-container');

        const filterLabel = document.createElement('label');
        filterLabel.textContent = labelCategory;
        filterContainer.appendChild(filterLabel);

        const filterSelect = document.createElement('select');
        filterSelect.classList.add('label-filter');
        filterSelect.id = labelCategory;
        filterSelect.addEventListener('change', filterPosts);

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `Select ${labelCategory}`;
        filterSelect.appendChild(defaultOption);

        labelValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            filterSelect.appendChild(option);
        });

        filterContainer.appendChild(filterSelect);
        labelFiltersContainer.appendChild(filterContainer);
    });
}

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentCategory = button.dataset.category;
        displayPosts();
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        if (currentCategory === mentorCategory) {
            createLabelFilters(labels['Mentors']);
        } else {
            labelFiltersContainer.innerHTML = '';
        }
    });
});

allOpportunitiesButton.addEventListener('click', () => {
    currentCategory = '';
    displayPosts();
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    allOpportunitiesButton.classList.add('active');
    labelFiltersContainer.innerHTML = '';
});

sortBySelect.addEventListener('change', displayPosts);
search.addEventListener('input', filterPosts);

fetchAllPosts();

// Disable right-click
document.addEventListener('contextmenu', event => event.preventDefault());

// Disable Ctrl+U and F12
document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === 'u' || event.keyCode === 123) {
        event.preventDefault();
    }
});
