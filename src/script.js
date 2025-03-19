// Key for storing LinkedIn user ID in localStorage
const LINKEDIN_USER_ID_KEY = 'linkedin_id';
const LINKEDIN_POST_URL_TEMPLATE = `https://www.linkedin.com/in/<user>/overlay/create-post`;

// Load LinkedIn user ID from localStorage on page load
function loadLinkedInUserId() {
    const storedUserId = localStorage.getItem(LINKEDIN_USER_ID_KEY);
    if (storedUserId) {
        $('#linkedin-user-id').val(storedUserId); // Populate the input field
        updateLinkedInLink(storedUserId); // Update the LinkedIn link
    } else {
        updateLinkedInLink(null); // Hide the link if no user ID is present
    }
}

// Save LinkedIn user ID to localStorage when it changes
$('#linkedin-user-id').on('input', (event) => {
    const userId = event.target.value.trim();
    localStorage.setItem(LINKEDIN_USER_ID_KEY, userId);
    updateLinkedInLink(userId); // Update the LinkedIn link dynamically
});

// Update the LinkedIn link dynamically
function updateLinkedInLink(userId) {
    const $linkedinLink = $('#linkedin-link');
    if (userId) {
        const linkedinUrl = LINKEDIN_POST_URL_TEMPLATE.replace('<user>', userId);
        $linkedinLink.attr('href', linkedinUrl).show(); // Update the href and show the link
    } else {
        $linkedinLink.hide(); // Hide the link if no user ID is present
    }
}

// Call the function to load the LinkedIn user ID on page load
loadLinkedInUserId();

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
    placeholder: 'Compose your post, then follow instructions below...',
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
    return 'snippet-' + content.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50).trim().replace(/\s+/g, '-') || 'Untitled';
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

function updateSnippetsList() {
    const $snippetsTableBody = $('#snippets-table tbody');
    $snippetsTableBody.empty(); // Clear the table body

    Object.keys(localStorage).forEach((key) => {
        // Only process keys that start with "snippet-"
        if (!key.startsWith('snippet-')) return;

        const snippet = JSON.parse(localStorage.getItem(key));
        const date = new Date(snippet.timestamp).toLocaleString();

        // Remove the "snippet-" prefix for display
        const displayKey = key.replace('snippet-', '');

        // Create a table row
        const $row = $('<tr></tr>');

        // Create the "Snippet" cell
        const $snippetCell = $('<td></td>')
            .text(displayKey) // Display the key without the "snippet-" prefix
            .on('click', () => loadSnippet(key)); // Attach loadSnippet to the cell

        // Create the "Timestamp" cell
        const $timestampCell = $('<td></td>').text(date);

        // Create the "Delete" button cell
        const $deleteCell = $('<td></td>');
        const $deleteButton = $('<button></button>')
            .text('Delete')
            .addClass('delete-button')
            .on('click', (e) => {
                e.stopPropagation(); // Prevent triggering the loadSnippet event
                deleteSnippet(key);
            });
        $deleteCell.append($deleteButton);

        // Append cells to the row
        $row.append($snippetCell, $timestampCell, $deleteCell);

        // Append the row to the table body
        $snippetsTableBody.append($row);
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

<<<<<<< Updated upstream
=======
$('#copy-button').on('click', async () => {
    const semanticHtml = quill.getSemanticHTML();
    // console.log(semanticHtml);

    // Replaces spaces, apostrophes, and quotes.
    const modifiedHtml = semanticHtml
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&#39;', "'")
        .replaceAll('&quot;', '"');

    console.log(modifiedHtml);

    try {
        const clipboardItem = new ClipboardItem({
            'text/plain': new Blob([modifiedHtml], { type: 'text/plain' }),
        });

        // Write the ClipboardItem to the clipboard
        await navigator.clipboard.write([clipboardItem]);
    } catch (err) {
        console.error('Failed to copy content: ', err);
        alert('Failed to copy content. Please try again.');
    }
});

>>>>>>> Stashed changes
// Initialize the snippets list on page load
updateSnippetsList();
quill.focus();