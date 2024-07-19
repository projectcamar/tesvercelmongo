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
let currentPage = 1;
const postsPerPage = 10;
let isLoading = false;

const categories = ['internship', 'competitions', 'scholarships', 'volunteers', 'events'];
const mentorCategory = 'mentors';
const labels = {
    'Mentors': {
        'Field': ['Business And Management', 'Engineering, Technology & Data', 'General', 'Product & Design'],
        'Mentoring Topic': []
    }
};

document.querySelectorAll('.category-button').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.textContent.trim().toLowerCase();
        filterOpportunities(category);
    });
});

function filterOpportunities(category) {
    const opportunities = document.querySelectorAll('.opportunity');
    opportunities.forEach(opportunity => {
        if (category === 'all opportunities' || opportunity.dataset.category.toLowerCase() === category) {
            opportunity.style.display = 'block';
        } else {
            opportunity.style.display = 'none';
        }
    });
}

async function fetchAllPosts() {
    try {
        const res = await fetch('/api/all');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
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
    currentPage = 1;
    loadMorePosts();
}

function loadMorePosts() {
    if (isLoading) return;
    isLoading = true;

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

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToDisplay = sortedPosts.slice(startIndex, endIndex);

    postsToDisplay.forEach(post => {
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

    currentPage++;
    isLoading = false;

    if (endIndex >= sortedPosts.length) {
        // No more posts to load
        titlesContainer.removeEventListener('scroll', handleScroll);
    }
}

function handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = titlesContainer;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
        loadMorePosts();
    }
}

function displayFullPost(post) {
    // ... (rest of the displayFullPost function remains unchanged)
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
    currentPage = 1;
    posts = filteredPosts;
    loadMorePosts();
}

function createLabelFilters(labels) {
    // ... (rest of the createLabelFilters function remains unchanged)
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

titlesContainer.addEventListener('scroll', handleScroll);

fetchAllPosts();

// Disable right-click
document.addEventListener('contextmenu', event => event.preventDefault());

// Disable Ctrl+U and F12
document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === 'u' || event.keyCode === 123) {
        event.preventDefault();
    }
});
