let is24HourFormat = false;
let activeDraggable = null;
let offsetX, offsetY;
let openPopups = {};
let userName = '';



// Time and Date Functions
function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    const timeString = is24HourFormat
        ? `${hours}:${minutes}`
        : `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;

    document.getElementById('time').textContent = timeString;
    updateGreeting();
}


function toggleTimeFormat() {
    is24HourFormat = !is24HourFormat;
    updateTime();
    chrome.storage.sync.set({ 'is24HourFormat': is24HourFormat });
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString('en-US', options);
}

// Quote Functions
async function fetchQuote() {
    try {
        const response = await fetch('https://api.quotable.io/random');
        const data = await response.json();
        const quoteElement = document.getElementById('quote');
        quoteElement.textContent = `"${data.content}" — ${data.author}`;
        chrome.storage.sync.set({ 'lastQuote': quoteElement.textContent });
    } catch (error) {
        console.error('Error fetching quote:', error);
        document.getElementById('quote').textContent = 'Could not fetch quote. Please try again later.';
    }
}

// List Functions
function toggleList() {
    const listContent = document.getElementById('list-content');
    const listIcon = document.getElementById('list-icon');
    const isVisible = listContent.style.display !== 'none';

    listContent.style.display = isVisible ? 'none' : 'flex';
    listIcon.src = `src/assets/add-icon/angle-${isVisible ? 'down' : 'up'}.svg`;
}

function addListItem(event) {
    if (event.key === 'Enter') {
        const input = event.target;
        const newItemText = input.value.trim();
        if (newItemText !== '') {
            const listItemContainer = createListItem(newItemText);
            document.getElementById('list-content').appendChild(listItemContainer);
            input.value = '';
            saveList();
        }
    }
}

function createListItem(text) {
    const listItemContainer = document.createElement('div');
    listItemContainer.className = 'list-item-container';

    const listItem = document.createElement('div');
    listItem.className = 'list-item';

    const checklist = document.createElement('span');
    checklist.className = 'checklist';
    checklist.innerHTML = '&#x2713;';
    checklist.onclick = function() { toggleCheck(this); };

    const itemText = document.createElement('span');
    itemText.className = 'list-item-text';
    itemText.textContent = text;

    const deleteButton = document.createElement('span');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = '&#x2715;';
    deleteButton.onclick = function() { deleteListItem(this); };

    listItem.append(checklist, itemText, deleteButton);
    listItemContainer.appendChild(listItem);

    return listItemContainer;
}

function toggleCheck(element) {
    element.classList.toggle('checked');
    saveList();
}

function deleteListItem(element) {
    element.closest('.list-item-container').remove();
    saveList();
}

function saveList() {
    const listItems = document.querySelectorAll('.list-item-container');
    const listData = Array.from(listItems).map(item => ({
        text: item.querySelector('.list-item-text').textContent,
        checked: item.querySelector('.checklist').classList.contains('checked')
    }));

    chrome.storage.sync.set({ 'listItems': listData });
}

function loadList() {
    chrome.storage.sync.get('listItems', function(data) {
        const listItems = data.listItems || [];
        const listContent = document.getElementById('list-content');
        
        listItems.forEach(item => {
            const listItemContainer = createListItem(item.text);
            if (item.checked) {
                listItemContainer.querySelector('.checklist').classList.add('checked');
            }
            listContent.appendChild(listItemContainer);
        });
    });
}

// Search Function
function searchEngine() {
    const searchInput = document.getElementById('search-input').value.trim();
    if (searchInput !== '') {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(searchInput)}`, '_blank');
    }
}

// Iframe Functions
function toggleIframe() {
    const iframeContainer = document.getElementById('iframe-container');
    const mainContent = document.getElementById('main-content');
    const exploreButton = document.getElementById('explore-opportunity');

    const isIframeVisible = iframeContainer.style.display !== 'none';
    iframeContainer.style.display = isIframeVisible ? 'none' : 'block';
    mainContent.style.display = isIframeVisible ? 'flex' : 'none';
    exploreButton.textContent = isIframeVisible ? 'EXPLORE OPPORTUNITY' : 'RETURN TO HOME';

    // Ensure the name is updated in the iframe header
    document.getElementById('user-name-small').textContent = userName;
}

function createDraggableIframe(title, src) {
    if (title === "Kanban Tracker") {
        document.getElementById('fullscreen-kanban').style.display = 'block';
        return;
    }

    if (openPopups[title]) {
        openPopups[title].style.display = 'block';
        openPopups[title].querySelector('iframe').style.display = 'block';
        openPopups[title].focus();
        return;
    }

    const template = document.getElementById('draggable-iframe-template');
    const draggable = template.cloneNode(true);
    draggable.id = `draggable-iframe-${Date.now()}`;
    draggable.style.display = 'block';
    
    const titleElement = draggable.querySelector('.draggable-title');
    titleElement.textContent = title;
    
    const iframe = draggable.querySelector('iframe');
    iframe.src = src;
    iframe.style.display = 'block'; // Ensure iframe is visible from the start

    setupDraggableButtons(draggable, iframe);
    setupResizer(draggable);

    document.body.appendChild(draggable);
    positionDraggable(draggable);

    makeDraggable(draggable);
    openPopups[title] = draggable;
    
    savePopupState();
}




function setupDraggableButtons(draggable, iframe) {
    const minimizeBtn = draggable.querySelector('.minimize-btn');
    minimizeBtn.addEventListener('click', () => toggleIframeMinimize(draggable, iframe));

    const closeBtn = draggable.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        draggable.style.display = 'none';
        savePopupState();
    });
}



function toggleIframeMinimize(draggable, iframe) {
    const isMinimized = draggable.style.height === '40px';
    if (isMinimized) {
        draggable.style.height = '400px';
        iframe.style.display = 'block';
    } else {
        draggable.style.height = '40px';
        iframe.style.display = 'none';
    }
    savePopupState();
}



function setupResizer(draggable) {
    const resizer = document.createElement('div');
    resizer.className = 'resizer';
    draggable.appendChild(resizer);
    makeResizable(draggable);
}

function positionDraggable(draggable) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const draggableWidth = draggable.offsetWidth;
    const draggableHeight = draggable.offsetHeight;

    draggable.style.left = `${(windowWidth - draggableWidth) / 2}px`;
    draggable.style.top = `${(windowHeight - draggableHeight) / 2}px`;
}

function makeDraggable(element) {
    const header = element.querySelector('.draggable-header');
    
    header.addEventListener('mousedown', (e) => {
        activeDraggable = element;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        element.style.transition = 'none';
    });
}

function makeResizable(element) {
    const resizer = element.querySelector('.resizer');
    let originalWidth, originalHeight, originalX, originalY;

    resizer.addEventListener('mousedown', initResize);

    function initResize(e) {
        e.preventDefault();
        originalWidth = element.offsetWidth;
        originalHeight = element.offsetHeight;
        originalX = e.clientX;
        originalY = e.clientY;

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }

    function resize(e) {
        const width = originalWidth + (e.clientX - originalX);
        const height = originalHeight + (e.clientY - originalY);
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
    }

    function stopResize() {
        savePopupState();
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }
}

// Storage Functions
function savePopupState() {
    const draggables = document.querySelectorAll('.draggable');
    const popupsData = Array.from(draggables).map(draggable => {
        const iframe = draggable.querySelector('iframe');
        return {
            id: draggable.id,
            title: draggable.querySelector('.draggable-title').textContent,
            src: iframe.src,
            left: draggable.style.left,
            top: draggable.style.top,
            width: draggable.style.width,
            height: draggable.style.height,
            display: draggable.style.display
        };
    });

    chrome.storage.sync.set({ 'popups': popupsData }, function() {
        if (chrome.runtime.lastError) {
            console.error('Error saving popup state:', chrome.runtime.lastError);
        } else {
            console.log('Popup state saved successfully');
        }
    });
}

function loadPopupState() {
    chrome.storage.sync.get('popups', function(data) {
        const popups = data.popups || [];
        
        popups.forEach(popup => {
            if (popup.id === 'draggable-iframe-template') return;
            if (popup.title === 'Kanban Tracker') return;
            
            const draggable = recreateDraggable(popup);
            document.body.appendChild(draggable);

            makeDraggable(draggable);
            openPopups[popup.title] = draggable;
        });
    });
}

function recreateDraggable(popup) {
    const template = document.getElementById('draggable-iframe-template');
    const draggable = template.cloneNode(true);
    draggable.id = popup.id;
    Object.assign(draggable.style, {
        display: popup.display,
        left: popup.left,
        top: popup.top,
        width: popup.width,
        height: popup.height
    });

    const titleElement = draggable.querySelector('.draggable-title');
    titleElement.textContent = popup.title;

    const iframe = draggable.querySelector('iframe');
    iframe.src = popup.src;
    iframe.style.display = popup.display === 'none' ? 'none' : 'block';

    setupDraggableButtons(draggable, iframe);
    setupResizer(draggable);

    return draggable;
}

// Background Changer Functions
function initBackgroundChanger() {
    const backgroundChanger = document.getElementById('background-changer');
    const modal = document.getElementById('background-modal');
    const backgroundOptions = document.querySelectorAll('.background-option');
    const closeBtn = document.querySelector('.close');
    const customUpload = document.getElementById('custom-bg-upload');

    backgroundChanger.removeAttribute('data-iframe-src');

    backgroundChanger.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => modal.style.display = 'none');

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    backgroundOptions.forEach(option => {
        option.addEventListener('click', function() {
            if (this.classList.contains('add-custom')) {
                customUpload.click();
            } else {
                setBackground(this.getAttribute('data-bg'));
            }
        });
    });

    customUpload.addEventListener('change', handleCustomUpload);

    // Load saved background
    chrome.storage.local.get('background', function(data) {
        if (data.background) {
            setBackground(data.background);
        }
    });
}

function handleCustomUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setBackground(e.target.result);
        reader.readAsDataURL(file);
    }
}

function setBackground(bgImage) {
    document.getElementById('background-image').style.backgroundImage = `url('${bgImage}')`;
    chrome.storage.local.set({'background': bgImage}, () => console.log('Background saved'));
    document.getElementById('background-modal').style.display = 'none';
}

// Other Utility Functions
function loadIframeContent(iframe) {
    if (!iframe.src) {
        const loadingIndicator = iframe.parentElement.querySelector('.loading-indicator');
        loadingIndicator.style.display = 'block';
        iframe.src = iframe.getAttribute('data-src');
        iframe.onload = () => {
            loadingIndicator.style.display = 'none';
        };
    }
}

function disableIframeContextMenu(iframe) {
    iframe.addEventListener('load', function() {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        iframeDocument.addEventListener('contextmenu', (event) => event.preventDefault());
    });
}

// Event Listeners
document.addEventListener('mousemove', (e) => {
    if (activeDraggable) {
        activeDraggable.style.left = `${e.clientX - offsetX}px`;
        activeDraggable.style.top = `${e.clientY - offsetY}px`;
    }
});

document.addEventListener('mouseup', () => {
    if (activeDraggable) {
        savePopupState();
    }
    activeDraggable = null;
});

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e);
});

document.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
});

// Prevent default actions for specific key combinations
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey && event.key === 'u') || event.key === 'F12') {
        event.preventDefault();
    }
});

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initWelcomeScreen();
    initTimeAndDate();
    initQuote();
    initList();
    initSearch();
    initSearch();
    initIframe();
    initBackgroundChanger();
    initContextMenu();
    loadPopupState();
    initNameEditing();
    
    
    // Apply context menu disabling to all iframes
    document.querySelectorAll('iframe').forEach(disableIframeContextMenu);
});




// Initialization functions
function initTimeAndDate() {
    document.getElementById('time').addEventListener('click', toggleTimeFormat);
    updateTime();
    updateDate();
    setInterval(updateTime, 1000);
    setInterval(updateDate, 60000);

    chrome.storage.sync.get('is24HourFormat', function(data) {
        is24HourFormat = data.is24HourFormat || false;
        updateTime();
    });
}


function initQuote() {
    document.getElementById('quote').addEventListener('click', fetchQuote);
    chrome.storage.sync.get('lastQuote', function(data) {
        if (data.lastQuote) {
            document.getElementById('quote').textContent = data.lastQuote;
        } else {
            fetchQuote();
        }
    });
}

function initList() {
    document.querySelector('.add-item-input').addEventListener('keypress', addListItem);
    document.querySelector('.list-toggle-button').addEventListener('click', toggleList);
    loadList();
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const suggestionsContainer = document.getElementById('suggestions');

    searchInput.addEventListener('input', debounce(getSuggestions, 300));
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    searchButton.addEventListener('click', performSearch);

    document.addEventListener('click', function(e) {
        if (!suggestionsContainer.contains(e.target) && e.target !== searchInput) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

async function getSuggestions() {
    const searchInput = document.getElementById('search-input');
    const suggestionsContainer = document.getElementById('suggestions');
    const query = searchInput.value.trim();

    if (query.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`);
        const data = await response.json();
        displaySuggestions(data);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

function displaySuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('suggestions');
    suggestionsContainer.innerHTML = '';

    if (suggestions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    suggestions.slice(0, 5).forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion.word;
        li.addEventListener('click', () => {
            document.getElementById('search-input').value = suggestion.word;
            suggestionsContainer.style.display = 'none';
            performSearch();
        });
        suggestionsContainer.appendChild(li);
    });

    suggestionsContainer.style.display = 'block';
}

function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchEngine = document.getElementById('search-engine');
    const query = searchInput.value.trim();

    if (query === '') return;

    const searchUrls = {
        google: 'https://www.google.com/search?q=',
        bing: 'https://www.bing.com/search?q=',
        yahoo: 'https://search.yahoo.com/search?p=',
        duckduckgo: 'https://duckduckgo.com/?q='
    };

    const selectedEngine = searchEngine.value;
    const searchUrl = searchUrls[selectedEngine] + encodeURIComponent(query);

    window.open(searchUrl, '_blank');
    searchInput.value = '';
    document.getElementById('suggestions').style.display = 'none';
}


function initIframe() {
    document.getElementById('explore-opportunity').addEventListener('click', toggleIframe);
    document.getElementById('close-all-tabs').addEventListener('click', closeAllTabs);
    
    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        if (!icon.closest('#background-changer')) {
            icon.addEventListener('click', (e) => {
                const title = icon.getAttribute('alt');
                const src = icon.getAttribute('data-iframe-src');
                createDraggableIframe(title, src);
            });
        }
    });

    // Setup for fullscreen Kanban
    const kanbanIcon = document.querySelector('.sidebar-icon[alt="Kanban Tracker"]');
    const fullscreenKanban = document.getElementById('fullscreen-kanban');
    const closeFullscreen = fullscreenKanban.querySelector('.close-fullscreen');

    kanbanIcon.addEventListener('click', function(e) {
        e.preventDefault();
        fullscreenKanban.style.display = 'block';
    });

    closeFullscreen.addEventListener('click', function() {
        fullscreenKanban.style.display = 'none';
    });
}

function initContextMenu() {
    document.getElementById('minimize-all').addEventListener('click', minimizeAllPopups);
    document.getElementById('explore-opportunity-context').addEventListener('click', toggleIframe);
    document.getElementById('open-google-docs').addEventListener('click', () => createDraggableIframe('Google Docs', 'https://docs.google.com/document/u/0/'));
    document.getElementById('open-spotify').addEventListener('click', () => createDraggableIframe('Spotify', 'spotify.html'));
    document.getElementById('open-calculator').addEventListener('click', () => createDraggableIframe('Calculator', 'https://www.desmos.com/scientific'));
    document.getElementById('open-chatgpt').addEventListener('click', () => createDraggableIframe('ChatGPT', 'https://chatgpt.com'));
}

// Helper functions
function closeAllTabs() {
    Object.values(openPopups).forEach(popup => {
        popup.style.display = 'none';
    });
    savePopupState();
}

function minimizeAllPopups() {
    document.querySelectorAll('.draggable').forEach(draggable => {
        const iframe = draggable.querySelector('iframe');
        iframe.style.display = 'none';
        draggable.style.height = '40px';
    });
    savePopupState();
}

function showContextMenu(e) {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
}

// Override createElement to disable context menu on new iframes
const originalCreateElement = document.createElement;
document.createElement = function() {
    const element = originalCreateElement.apply(this, arguments);
    if (element.tagName === 'IFRAME') {
        disableIframeContextMenu(element);
    }
    return element;
};

document.head.appendChild(style);

// Handle messages from iframes
window.addEventListener('message', function(event) {
    if (event.data.type === 'playlistChange') {
        console.log('Playlist changed to:', event.data.src);
    }
});
function initContextMenu() {
    document.getElementById('minimize-all').addEventListener('click', minimizeAllPopups);
    document.getElementById('explore-opportunity-context').addEventListener('click', toggleIframe);
    document.getElementById('open-kanban').addEventListener('click', () => createDraggableIframe('Kanban Tracker', 'https://projectcamar.github.io/learnitab-kanban/'));
    document.getElementById('open-google-docs').addEventListener('click', () => createDraggableIframe('Google Docs', 'https://docs.google.com/document/u/0/'));
    document.getElementById('open-spotify').addEventListener('click', () => createDraggableIframe('Spotify', 'spotify.html'));
    document.getElementById('open-calculator').addEventListener('click', () => createDraggableIframe('Calculator', 'https://www.desmos.com/scientific'));
    document.getElementById('open-chatgpt').addEventListener('click', () => createDraggableIframe('ChatGPT', 'https://chatgpt.com'));
}
function initContextMenu() {
    document.getElementById('minimize-all').addEventListener('click', minimizeAllPopups);
    document.getElementById('explore-opportunity-context').addEventListener('click', toggleIframe);
    document.getElementById('open-kanban').addEventListener('click', () => createDraggableIframe('Kanban Tracker', 'https://projectcamar.github.io/learnitab-kanban/'));
    document.getElementById('open-google-docs').addEventListener('click', () => createDraggableIframe('Google Docs', 'https://docs.google.com/document/u/0/'));
    document.getElementById('open-spotify').addEventListener('click', () => createDraggableIframe('Spotify', 'spotify.html'));
    document.getElementById('open-calculator').addEventListener('click', () => createDraggableIframe('Calculator', 'https://www.desmos.com/scientific'));
    document.getElementById('open-chatgpt').addEventListener('click', () => createDraggableIframe('ChatGPT', 'https://chatgpt.com'));
    document.getElementById('change-background').addEventListener('click', openBackgroundModal);
    
    // Background option selection
    document.querySelectorAll('.background-option').forEach(option => {
        option.addEventListener('click', (event) => {
            const bg = event.target.dataset.bg;
            document.body.style.backgroundImage = `url(${bg})`; // Adjust if needed
            closeBackgroundModal(); // Optionally close modal after selection
        });
    });

    document.getElementById('custom-bg-upload').addEventListener('change', handleCustomBackgroundUpload);
}

function openBackgroundModal() {
    document.getElementById('background-modal').style.display = 'block';
}

function closeBackgroundModal() {
    document.getElementById('background-modal').style.display = 'none';
}

function handleCustomBackgroundUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.body.style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
        closeBackgroundModal(); // Optionally close modal after upload
    }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById('background-modal')) {
        closeBackgroundModal();
    }
};

function initWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainContent = document.getElementById('main-content');
    const nameInput = document.getElementById('name-input');
    const nameSubmit = document.getElementById('name-submit');
    const exploreButton = document.getElementById('explore-opportunity');


    chrome.storage.sync.get('userName', function(data) {
        if (data.userName) {
            userName = data.userName;
            welcomeScreen.style.display = 'none';
            mainContent.style.display = 'flex';
            exploreButton.style.display = 'block';
            updateGreeting();
        } else {
            welcomeScreen.style.display = 'flex';
            mainContent.style.display = 'none';
            exploreButton.style.display = 'none';
        }
    });

    nameSubmit.addEventListener('click', function() {
        userName = nameInput.value.trim();
        if (userName) {
            chrome.storage.sync.set({ 'userName': userName }, function() {
                welcomeScreen.style.display = 'none';
                mainContent.style.display = 'flex';
                exploreButton.style.display = 'block';
                updateGreeting();
            });
        }
    });
}


function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = '';

    if (hour < 12) {
        greeting = 'Good morning';
    } else if (hour < 18) {
        greeting = 'Good afternoon';
    } else {
        greeting = 'Good evening';
    }

    document.getElementById('greeting-text').textContent = `${greeting}, `;
    document.getElementById('user-name').textContent = userName;
}
function initNameEditing() {
    const userNameElement = document.getElementById('user-name');
    const nameEditContainer = document.getElementById('name-edit-container');
    const nameEditInput = document.getElementById('name-edit-input');
    const nameEditSave = document.getElementById('name-edit-save');
    const nameEditCancel = document.getElementById('name-edit-cancel');

    userNameElement.addEventListener('click', function() {
        nameEditInput.value = userName;
        nameEditContainer.style.display = 'block';
        nameEditInput.focus();
    });

    nameEditSave.addEventListener('click', function() {
        const newName = nameEditInput.value.trim();
        if (newName) {
            userName = newName;
            chrome.storage.sync.set({ 'userName': userName }, function() {
                updateGreeting();
                nameEditContainer.style.display = 'none';
            });
        }
    });

    nameEditCancel.addEventListener('click', function() {
        nameEditContainer.style.display = 'none';
    });
}
function focusSearchInput() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.focus();
    }
}

const backgrounds = [
    'images/1.png',
    'images/2.png',
    'images/3.png',
    'images/4.png',
    'images/5.png'
];

let currentBackgroundIndex = 0;

function initBackgroundNavigation() {
    const prevBtn = document.getElementById('prev-bg');
    const nextBtn = document.getElementById('next-bg');

    prevBtn.addEventListener('click', () => changeBackground(-1));
    nextBtn.addEventListener('click', () => changeBackground(1));

    // Load the last used background
    chrome.storage.sync.get('currentBackgroundIndex', (data) => {
        if (data.currentBackgroundIndex !== undefined) {
            currentBackgroundIndex = data.currentBackgroundIndex;
            setBackground(backgrounds[currentBackgroundIndex]);
        }
    });
}

function changeBackground(direction) {
    currentBackgroundIndex = (currentBackgroundIndex + direction + backgrounds.length) % backgrounds.length;
    setBackground(backgrounds[currentBackgroundIndex]);
    
    // Save the current background index
    chrome.storage.sync.set({ 'currentBackgroundIndex': currentBackgroundIndex });
}

function setBackground(bgImage) {
    document.getElementById('background-image').style.backgroundImage = `url('${bgImage}')`;
}
// Background Changer Functions
function initBackgroundChanger() {
    const backgroundChanger = document.getElementById('background-changer');
    const modal = document.getElementById('background-modal');
    const backgroundOptions = document.querySelectorAll('.background-option');
    const closeBtn = document.querySelector('.close');
    const customUpload = document.getElementById('custom-bg-upload');

    backgroundChanger.removeAttribute('data-iframe-src');

    backgroundChanger.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => modal.style.display = 'none');

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    backgroundOptions.forEach(option => {
        option.addEventListener('click', function() {
            if (this.classList.contains('add-custom')) {
                customUpload.click();
            } else {
                setBackground(this.getAttribute('data-bg'));
            }
        });
    });

    customUpload.addEventListener('change', handleCustomUpload);

    // Load saved background
    loadSavedBackground();
}

function handleCustomUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setBackground(e.target.result, true);
        reader.readAsDataURL(file);
    }
}

function setBackground(bgImage, isCustom = false) {
    document.getElementById('background-image').style.backgroundImage = `url('${bgImage}')`;
    saveBackground(bgImage, isCustom);
    document.getElementById('background-modal').style.display = 'none';
}

function saveBackground(bgImage, isCustom) {
    chrome.storage.local.set({
        'background': bgImage,
        'isCustomBackground': isCustom
    }, () => console.log('Background saved'));
}

function loadSavedBackground() {
    chrome.storage.local.get(['background', 'isCustomBackground'], function(data) {
        if (data.background) {
            document.getElementById('background-image').style.backgroundImage = `url('${data.background}')`;
        }
    });
}

// Make sure to call loadSavedBackground() when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // ... other initializations ...
    loadSavedBackground();
    // ... other initializations ...
});
