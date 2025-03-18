// Initialize Quill
const quill = new Quill('#editor-container', {
    modules: {
        toolbar: {
            container: [
                ['bold', 'italic', 'underline', 'strike'], // toggled buttons
                [{ 'font': ['Source Sans Pro', 'Arial', 'sans-serif'] }],
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
                emoji: toggleEmojiPicker,
            },
        },
    },
    placeholder: 'Compose your post, then copy/paste to LinkedIn...',
    theme: 'snow',
});

// Toggle the emoji picker visibility
function toggleEmojiPicker() {
    $('.emoji-picker-container').toggle();
}

// Listen for emoji selection
$('emoji-picker').on('emoji-click', (event) => {
    const emoji = event.detail.unicode;
    const range = quill.getSelection();
    if (range) {
        quill.insertText(range.index, emoji);
    }
    $('.emoji-picker-container').hide();
});

// Hide the emoji picker if clicked outside
$(document).on('click', (event) => {
    if (
        !$(event.target).closest('.emoji-picker-container').length &&
        !$(event.target).closest('.ql-emoji').length
    ) {
        $('.emoji-picker-container').hide();
    }
});

// Generate a key from the first 50 alphanumeric characters
function generateKey(content) {
    return content.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50).trim().replace(/\s+/g, '-') || 'Untitled';
}

// Save the content to local storage
$('#save-button').on('click', () => {
    const content = quill.getText().trim();
    if (!content) {
        alert('The editor is empty. Please write something to save.');
        return;
    }

    const key = generateKey(content);
    const snippet = {
        delta: quill.getContents(),
        timestamp: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(snippet));
    updateSnippetsList();
});

// Update the snippets list
function updateSnippetsList() {
    const $snippetsList = $('#snippets-list');
    $snippetsList.empty();

    Object.keys(localStorage).forEach((key) => {
        const snippet = JSON.parse(localStorage.getItem(key));
        const date = new Date(snippet.timestamp).toLocaleString();

        // Create list item
        const $li = $('<li></li>')
            .text(`${key} (Saved on: ${date})`)
            .on('click', () => loadSnippet(key)); // Attach loadSnippet to the list item

        // Create delete button
        const $deleteButton = $('<button></button>')
            .text('Delete')
            .addClass('delete-button')
            .on('click', (e) => {
                e.stopPropagation(); // Prevent triggering the loadSnippet event
                deleteSnippet(key);
            });

        // Append the delete button to the list item
        $li.append($deleteButton);

        // Append the list item to the snippets list
        $snippetsList.append($li);
    });
}

// Load a snippet into the editor
function loadSnippet(key) {
    const savedSnippet = localStorage.getItem(key);
    if (savedSnippet) {
        const { delta } = JSON.parse(savedSnippet);
        quill.setContents(delta);
    } else {
        alert('Snippet not found.');
    }
}

// Delete a specific snippet from local storage
function deleteSnippet(key) {
    if (confirm(`Are you sure you want to delete the snippet "${key}"? This action cannot be undone.`)) {
        localStorage.removeItem(key); // Remove the snippet from local storage
        updateSnippetsList(); // Refresh the snippets list
    }
}

// Clear all saved snippets from local storage
$('#clear-button').on('click', () => {
    if (Object.keys(localStorage).length === 0)
        return;

    if (confirm('Are you sure you want to clear all saved snippets? This action cannot be undone.')) {
        localStorage.clear();
        updateSnippetsList();
    }
});

// Initialize the snippets list on page load
updateSnippetsList();
quill.focus();