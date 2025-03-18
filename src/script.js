// Add fonts to whitelist
const Font = Quill.import('formats/font');
Font.whitelist = ['Source Sans Pro', 'Arial', 'sans-serif'];

// Register the font emoji module
Quill.register(Font, true);

// Toolbar options
const toolbarOptions = {
    container: [
        ['bold', 'italic', 'underline', 'strike'], // toggled buttons
        [{ 'font': Font.whitelist }],
        [{ 'header': 1 }, { 'header': 2 }], // custom button values
        [{ 'size': ['small', false, 'large', 'huge'] }], // custom dropdown
        [{ 'color': [] }, { 'background': [] }], // dropdown with defaults from theme
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }], // outdent/indent
        [{ 'align': [] }],
        ['emoji'], // Custom emoji button
        ['clean'], // remove formatting button
    ],
    handlers: {
        emoji: function () {
            // Toggle the emoji picker visibility
            const emojiPickerContainer = document.querySelector('.emoji-picker-container');
            const isHidden = window.getComputedStyle(emojiPickerContainer).display === 'none';
            if (isHidden) {
                emojiPickerContainer.style.display = 'block';
            } else {
                emojiPickerContainer.style.display = 'none';
            }
        },
    },
};

// Initialize Quill
const quill = new Quill('#editor-container', {
    modules: {
        toolbar: {
            container: toolbarOptions.container,
            handlers: toolbarOptions.handlers
        }
    },
    placeholder: 'Compose your LinkedIn post...',
    theme: 'snow',
});

// Get the emoji picker
const emojiPicker = document.querySelector('emoji-picker');
const emojiPickerContainer = document.querySelector('.emoji-picker-container');

// Listen for emoji selection
emojiPicker.addEventListener('emoji-click', (event) => {
    const emoji = event.detail.unicode;
    const range = quill.getSelection(); // Get the current cursor position
    if (range) {
        quill.insertText(range.index, emoji); // Insert the emoji at the cursor position
    }
    // Hide the emoji picker after selection
    emojiPickerContainer.style.display = 'none';
});

// Hide the emoji picker if clicked outside
document.addEventListener('click', (event) => {
    if (!emojiPickerContainer.contains(event.target) && !event.target.closest('.ql-emoji')) {
        emojiPickerContainer.style.display = 'none';
    }
});

const saveButton = document.getElementById('save-button');
const snippetsList = document.getElementById('snippets-list');

// Function to sanitize and generate a key from the first 50 alphanumeric characters
function generateKey(content) {
    const sanitizedContent = content.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50).trim(); // Keep spaces for now
    const key = sanitizedContent.replace(/\s+/g, '-'); // Replace spaces with hyphens
    return key || 'Untitled';
}

// Save the content to local storage
saveButton.addEventListener('click', () => {
    const content = quill.getText().trim(); // Get plain text from the editor
    if (!content) {
        alert('The editor is empty. Please write something to save.');
        return;
    }

    const key = generateKey(content);
    const delta = quill.getContents(); // Get Quill's Delta format for saving
    const timestamp = new Date().toISOString(); // Get the current timestamp

    // Save the snippet as an object with content and timestamp
    const snippet = {
        delta,
        timestamp,
    };
    localStorage.setItem(key, JSON.stringify(snippet));

    updateSnippetsList();
});

// Load saved snippets into the list
function updateSnippetsList() {
    snippetsList.innerHTML = ''; // Clear the list
    Object.keys(localStorage).forEach((key) => {
        const snippet = JSON.parse(localStorage.getItem(key));
        const li = document.createElement('li');
        const date = new Date(snippet.timestamp).toLocaleString(); // Format the timestamp
        li.textContent = `${key} (Saved on: ${date})`;
        li.addEventListener('click', () => loadSnippet(key));
        snippetsList.appendChild(li);
    });
}

// Load a snippet into the editor
function loadSnippet(key) {
    const savedSnippet = localStorage.getItem(key);
    if (savedSnippet) {
        const { delta } = JSON.parse(savedSnippet); // Extract the Delta format
        quill.setContents(delta); // Load the Delta format into the editor
    } else {
        alert('Snippet not found.');
    }
}

const clearButton = document.getElementById('clear-button');

// Clear all saved snippets from local storage
clearButton.addEventListener('click', () => {
    const confirmation = confirm('Are you sure you want to clear all saved snippets? This action cannot be undone.');
    if (confirmation) {
        localStorage.clear(); // Clear all items from local storage
        updateSnippetsList(); // Update the snippets list to reflect the changes
    }
});

// Initialize the snippets list on page load
updateSnippetsList();

quill.focus();