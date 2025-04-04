///////////////////////////////////////////////////////////////////////////////////////////////////
// Declarations
///////////////////////////////////////////////////////////////////////////////////////////////////

// Key for storing LinkedIn user ID in localStorage
const LINKEDIN_USER_ID_KEY = 'linkedin_id';
const LINKEDIN_BASE_URL = 'https://www.linkedin.com/in/';

const GITHUB_API_URL = 'https://api.github.com/repos/simonkurtz-MSFT/simple-linkedin-composer';

const KEY_PREFIX = "snippet-";

// Sample text to load into the editor
const samplePostJson = `{
    "ops": [
        { "insert": "😀 " }, { "attributes": { "bold": true }, "insert": "Hello!" },
        { "insert": "\\n\\nI hope this very " }, { "attributes": { "bold": true }, "insert": "simple" }, { "insert": " " }, { "attributes": { "italic": true }, "insert": "LinkedIn post composer" }, { "insert": " is useful to you. It supports " }, { "attributes": { "bold": true }, "insert": "bold" }, { "insert": ", " }, { "attributes": { "italic": true }, "insert": "italic" }, { "insert": ", emojis 😁, and lists. The paragraph format and indentations are mostly preserved. You can also use hashtags.\\n\\n" },
        { "attributes": { "bold": true }, "insert": "📝 " }, { "attributes": { "italic": true, "bold": true }, "insert": "Instructions" },
        { "insert": "\\n\\nEnter your LinkedIn user id" }, { "attributes": { "list": "ordered" }, "insert": "\\n" },
        { "insert": "Compose your post" }, { "attributes": { "list": "ordered" }, "insert": "\\n" },
        { "insert": "Click \\\"Copy to Clipboard\\\"" }, { "attributes": { "list": "ordered" }, "insert": "\\n" },
        { "insert": "Click \\\"Create a new LinkedIn post\\\"" }, { "attributes": { "list": "ordered" }, "insert": "\\n" },
        { "insert": "Paste into the textbox, then post it." }, { "attributes": { "list": "ordered" }, "insert": "\\n" }, { "insert": "\\n" },
        { "attributes": { "bold": true }, "insert": "⚙️ " }, { "attributes": { "italic": true, "bold": true }, "insert": "Features" },
        { "insert": "\\n\\nI'm using Jason Chen's free rich-text editor, " }, { "attributes": { "italic": true }, "insert": "Quill" }, { "insert": ". Thank you for creating an awesome product, Jason!" }, { "attributes": { "list": "bullet" }, "insert": "\\n" },
        { "insert": "Emojis are supported via Nolan Lawson's " }, { "attributes": { "italic": true }, "insert": "emoji-picker" }, { "insert": " which even supports emoji search! Thank you for this cool module, Nolan!" }, { "attributes": { "list": "bullet" }, "insert": "\\n" },
        { "insert": "You can use local storage to save and load composed posts with full formatting. You can easily clear the list, too. This makes reusing snippets simpler." }, { "attributes": { "list": "bullet" }, "insert": "\\n" },
        { "attributes": { "bold": true }, "insert": "No data leaves your device. There are no trackers, etc. " }, { "attributes": { "list": "bullet" }, "insert": "\\n" },
        { "insert": "Pressing Enter does " }, { "attributes": { "italic": true }, "insert": "not" }, { "insert": " save the post and make it live on LinkedIn. 🤣" }, { "attributes": { "list": "bullet" }, "insert": "\\n" },
        { "insert": " \\nTry it out on the GitHub page: \\nhttps://simonkurtz-msft.github.io/simple-linkedin-composer\\n\\n🐛 " },
        { "attributes": { "bold": true }, "insert": "Bugs" },
        { "insert": "\\n\\nI'm sure there are bugs and improvements to be made. If you can, please submit an issue on GitHub, and if you have it in you, I would be grateful for a PR. Thank you!\\n\\n#linkedin\\n" }
    ]
}`;

// The Unicode code points are starting points for the ranges in hexadecimal format in their Mathematical variants (https://www.unicode.org/charts/PDF/U1D400.pdf).
// Enter the hex code here (without leading `0x`): https://unicodeplus.com
// Generate specific Unicode maps
const latinToMathSansSerif = generateUnicodeMap(0x1D5A0);           // Mathematical Sans-Serif
const latinToMathBold = generateUnicodeMap(0x1D400);                // Mathematical Bold
const latinToMathItalic = generateUnicodeMap(0x1D434);              // Mathematical Italic
const latinToMathBoldItalic = generateUnicodeMap(0x1D468);          // Mathematical Bold Italic
// Generate specific Unicode maps for digits
const digitsToMathSansSerif = generateDigitUnicodeMap(0x1D7E2);     // Mathematical Sans-Serif
const digitsToMathBold = generateDigitUnicodeMap(0x1D7CE);          // Mathematical Bold

// Add special cases for specific characters (e.g., 'h' in italic)
latinToMathItalic['h'] = '\u210E';

let hasUnsavedChanges = false;      // Flag to track unsaved changes

let currentSortKey = 'timestamp';   // Default sort key
let currentSortOrder = false;       // Default sort order (false = descending, true = ascending)

let sortNameAsc = true;             // Toggle state for name sorting
let sortCountAsc = true;            // Toggle state for count sorting

let quill;

///////////////////////////////////////////////////////////////////////////////////////////////////
// GitHub Stats
///////////////////////////////////////////////////////////////////////////////////////////////////


async function fetchGitHubStats() {
    try {
        const response = await fetch(GITHUB_API_URL);

        if (!response.ok) {
            throw new Error('Failed to fetch GitHub stats');
        }

        const data = await response.json();
        $('#star-count').text(data.stargazers_count);
        $('#fork-count').text(data.forks_count);
        $('#watcher-count').text(data.subscribers_count); // it's actually subscribers, not watchers/watchers_count
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// LinkedIn Functions
///////////////////////////////////////////////////////////////////////////////////////////////////

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

function setLinkedInUserId(event) {
    const userId = $(event.target).val().trim();
    localStorage.setItem(LINKEDIN_USER_ID_KEY, userId);
    updateLinkedInLink(userId); // Update the LinkedIn link dynamically
}

// Update the LinkedIn link dynamically
function updateLinkedInLink(userId) {
    if (userId) {
        const LINKEDIN_USER_BASE_URL = `${LINKEDIN_BASE_URL}${encodeURIComponent(userId)}/`;

        $('#linkedin-create-post').attr('href', `${LINKEDIN_USER_BASE_URL}overlay/create-post`); // Update the href
        $('#linkedin-my-posts').attr('href', `${LINKEDIN_USER_BASE_URL}recent-activity/all/`); // Update the href

        $('#linkedin-links').show(); // Show the LinkedIn links section
    } else {
        $('#linkedin-links').hide(); // Hide the LinkedIn links section
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// Hashtag Functions
///////////////////////////////////////////////////////////////////////////////////////////////////

// Function to extract hashtags from a string
function extractHashtags(text) {
    const hashtagRegex = /#\w+/g;
    return (text.match(hashtagRegex) || []);
}

// Function to insert a hashtag into the editor
function insertHashtagIntoEditor(hashtag) {
    const range = quill.getSelection(); // Get the current cursor position
    if (range) {
        quill.insertText(range.index, `${hashtag} `); // Insert the hashtag followed by a space
        quill.setSelection(range.index + hashtag.length + 1); // Move the cursor after the inserted text
    }
}

// Function to render the hashtag list in the UI
function renderHashtagList(hashtags) {
    const $hashtagList = $('#hashtag-list');
    $hashtagList.empty(); // Clear existing list

    $.each(hashtags, (tag, count) => {
        const $hashtagItem = $('<div>').addClass('hashtag-item');

        // Create the clickable ➕️ symbol
        const $addButton = $('<a>')
            .text('➕️')
            .attr('href', '#')
            .addClass('add-hashtag-button')
            .attr('title', 'Add this hashtag to the editor')
            .on('click', (event) => {
                event.preventDefault();
                insertHashtagIntoEditor(tag);
            });

        // Create the LinkedIn icon link
        const $linkedinLink = $('<a>')
            .attr('href', `https://www.linkedin.com/feed/hashtag/?keywords=${tag.substring(1)}`)
            .attr('target', '_blank')
            .addClass('linkedin-icon-link')
            .attr('title', 'View this hashtag on LinkedIn')
            .append($('<img>')
                .attr('src', 'images/linkedin-icon.svg')
                .attr('alt', 'LinkedIn')
                .addClass('linkedin-icon'));

        // Add the ➕️ symbol, LinkedIn icon, and hashtag text to the item
        $hashtagItem.append($addButton, $linkedinLink, `${tag} (${count})`);
        $hashtagList.append($hashtagItem);
    });
}

// Event listener for sorting by count with tie-breaking by name
function sortHashtagsByCount() {
    const hashtags = JSON.parse(localStorage.getItem('hashtags')) || {};

    const sortedHashtags = Object.entries(hashtags).sort(([tagA, countA], [tagB, countB]) => {
        if (countA === countB) {
            return tagA.localeCompare(tagB); // Tie-breaking: Sort by name ascending
        }
        return sortCountAsc ? countA - countB : countB - countA;
    });
    sortCountAsc = !sortCountAsc; // Toggle sorting order
    renderHashtagList(Object.fromEntries(sortedHashtags));
}

function sortHashtagsByName() {
    const hashtags = JSON.parse(localStorage.getItem('hashtags')) || {};

    const sortedHashtags = Object.entries(hashtags).sort(([tagA], [tagB]) => {
        return sortNameAsc ? tagA.localeCompare(tagB) : tagB.localeCompare(tagA);
    });
    sortNameAsc = !sortNameAsc; // Toggle sorting order
    renderHashtagList(Object.fromEntries(sortedHashtags));
}

// Function to update hashtag counts in local storage
function updateHashtagCounts() {
    const hashtags = JSON.parse(localStorage.getItem("hashtags")) || {};
    const snippetKeys = Object.keys(localStorage).filter(key => key.startsWith("snippet-"));

    // Reset hashtag counts
    Object.keys(hashtags).forEach(tag => hashtags[tag] = 0);

    // Count hashtags from all snippets
    snippetKeys.forEach(key => {
        const snippet = JSON.parse(localStorage.getItem(key));
        const delta = snippet.delta || {};
        const ops = delta.ops || [];

        // Extract hashtags from each insert property in the ops array
        ops.forEach(op => {
            if (op.insert && typeof op.insert === "string") {
                const snippetHashtags = extractHashtags(op.insert);
                snippetHashtags.forEach(tag => {
                    hashtags[tag] = (hashtags[tag] || 0) + 1;
                });
            }
        });
    });

    // Save updated hashtags to local storage
    localStorage.setItem("hashtags", JSON.stringify(hashtags));
    renderHashtagList(hashtags);
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// Snippet Functions
///////////////////////////////////////////////////////////////////////////////////////////////////

function addSnippetToTable(title, isTemplate, timestamp) {
    const $tbody = $('#snippets-table tbody');
    const isoTimestamp = new Date(timestamp).toISOString(); // ISO format for sorting
    const templateCell = isTemplate === true ? '✔' : '';
    const displayTimestamp = new Date(timestamp).toLocaleString(); // Human-readable format

    const $row = $(`
        <tr>
            <td data-key="snippet" class="snippet-link">${title}</td>
            <td data-key="timestamp" data-value="${isoTimestamp}">${displayTimestamp}</td>
            <td data-key="template" data-value="${isTemplate}">${templateCell}</td>
            <td>
                <button class="delete-snippet">Delete</button>
            </td>
        </tr>
    `);

    // Add click functionality to load the snippet into the editor
    $row.find('.snippet-link').on('click', function () {
        const key = `${KEY_PREFIX}${title}`;
        loadSnippet(key); // Call loadSnippet with the correct key
    });

    // Add delete functionality to the button
    $row.find('.delete-snippet').on('click', function () {
        if (confirm(`Are you sure you want to delete this snippet?\n\n${title}`)) {
            const key = `${KEY_PREFIX}${title}`;
            localStorage.removeItem(key);
            $row.remove(); // Remove the row from the table

            updateHashtagCounts();
        }
    });

    $tbody.append($row);
}

// Clear all saved snippets from local storage
function clearSnippetsFromStorage() {
    if (Object.keys(localStorage).length === 0)
        return;

    if (confirm('Are you sure you want to clear all saved snippets? This action cannot be undone.')) {
        localStorage.clear();
        updateSnippetsList();

        localStorage.removeItem("hashtags");
        renderHashtagList({});
    }
}

// Export functionality
function exportSnippets() {
    const data = {};

    // Filter localStorage keys that start with "snippet-"
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('snippet-')) {
            data[key] = localStorage.getItem(key);
        }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `LinkedIn-Composer-Data-${timestamp}.json`;

    // Download the filtered data
    downloadFile(filename, JSON.stringify(data, null, 2));
}

const filterSnippets = (filterText) => {
    const $rows = $('#snippets-table tbody tr');
    const lowerCaseFilter = filterText.toLowerCase();

    let visibleCount = 0;

    $rows.each((_, row) => {
        const snippetName = $(row).find('td[data-key="snippet"]').text().toLowerCase();
        if (snippetName.includes(lowerCaseFilter)) {
            $(row).show(); // Show rows that match the filter
            visibleCount++;
        } else {
            $(row).hide(); // Hide rows that don't match the filter
        }
    });

    // Update the Snippets header
    const totalSnippets = $rows.length;
    const $snippetsHeader = $('#snippets-header');
    if (visibleCount === totalSnippets) {
        $snippetsHeader.text(`Snippets (${totalSnippets})`);
    } else {
        $snippetsHeader.text(`Snippets (${visibleCount}/${totalSnippets})`);
    }
};

// Generate a key from the first 50 alphanumeric characters
function generateKey(content) {
    return KEY_PREFIX + content.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50).trim().replace(/\s+/g, '-') || 'Untitled';
}

// Import functionality
function importSnippets() {
    if (!confirmUnsavedChanges()) {
        return; // Exit if the user cancels
    }

    const $input = $('<input>', {
        type: 'file',
        accept: 'application/json',
    });

    $input.on('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const content = await file.text();
            const importedData = JSON.parse(content);
            let importedCount = 0;

            // Import data into localStorage
            $.each(importedData, (key, value) => {
                const existingItem = localStorage.getItem(key);

                if (existingItem) {
                    const existingData = JSON.parse(existingItem);
                    value = JSON.parse(value);

                    if (existingData.timestamp === value.timestamp) {
                        console.warn(`Duplicate entry with key ${key}. Skipping.`);
                        return;
                    } else if (existingData.timestamp > value.timestamp) {
                        console.warn(`Older entry with key ${key}. Skipping.`);
                        return;
                    }
                }

                // Parse nested JSON strings if necessary
                const parsedValue = typeof value === 'string' && value.startsWith('{')
                    ? JSON.parse(value)
                    : value;

                localStorage.setItem(key, JSON.stringify(parsedValue));
                importedCount++;
            });

            if (importedCount > 0) {
                alert(`Successfully imported ${importedCount} snippet(s).`);
                updateSnippetsList(); // Refresh the snippets list
            } else {
                alert('No new snippets were imported. The data may already exist in localStorage.');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Failed to import data. Please check the file format.');
        }
    });

    $input.trigger('click');
};

// Load a snippet into the editor
function loadSnippet(key) {
    if (!confirmUnsavedChanges()) {
        return; // Exit if the user cancels
    }

    const savedSnippet = localStorage.getItem(key);

    if (savedSnippet) {
        snippet = JSON.parse(savedSnippet);
        const { delta } = snippet;
        quill.setContents(delta); // Load the snippet content into the editor
        $('#is-template').prop('checked', snippet.isTemplate === true);

        // Extract the snippet title from the key
        const snippetTitle = key.replace(KEY_PREFIX, ''); // Remove the key prefix
        $('#snippet-title').val(snippetTitle); // Set the snippet title in the textbox

        hasUnsavedChanges = false; // Reset the flag since new content is loaded
    } else {
        alert('Snippet not found.');
    }
}

// Save the content to local storage
function saveSnippet() {
    const content = quill.getText().trim();
    if (!content) {
        alert('The editor is empty. Please write something to save.');
        return;
    }

    // Get the custom snippet title
    let title = $('#snippet-title').val().trim();
    if (!title) {
        alert('Snippet title cannot be empty.');
        return;
    }

    // Limit the title to 50 characters
    title = title.substring(0, 50);

    // Generate a key for the snippet
    const key = `${KEY_PREFIX}${title.replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-')}`;

    // Check if the snippet already exists in localStorage
    if (localStorage.getItem(key)) {
        const confirmOverride = confirm(`A snippet with this title already exists. Do you want to overwrite it?\n\n${title}`);
        if (!confirmOverride) {
            return; // Exit if the user does not confirm
        }
    }

    // Save the snippet to localStorage
    const snippet = {
        delta: quill.getContents(),
        timestamp: new Date().toISOString(),
        isTemplate: $('#is-template').is(':checked')
    };

    localStorage.setItem(key, JSON.stringify(snippet));

    updateSnippetsList();

    // Apply the filter if the filter input is not empty
    const filterText = $('#snippet-filter').val().trim();

    if (filterText) {
        filterSnippets(filterText);
    }
}

function setupSnippetSort() {
    $('#snippets-table th[data-sort]').on('click', function () {
        const sortKey = $(this).data('sort');
        const isAscending = $(this).hasClass('asc');
        sortTableByColumn(sortKey, !isAscending); // Toggle the sorting order
    });
}

function sortTableByColumn(sortKey, isAscending) {
    const $table = $('#snippets-table');
    const $tbody = $table.find('tbody');
    const $rows = $tbody.find('tr').get();

    $rows.sort((rowA, rowB) => {
        if (sortKey === 'timestamp') {
            const cellA = $(rowA).find(`td[data-key="${sortKey}"]`).text().trim();
            const cellB = $(rowB).find(`td[data-key="${sortKey}"]`).text().trim();

            // Parse timestamps for comparison
            return isAscending
                ? new Date(cellA) - new Date(cellB)
                : new Date(cellB) - new Date(cellA);
        } else if (sortKey === 'template') {
            const cellA = $(rowA).find(`td[data-key="${sortKey}"]`).data('value');
            const cellB = $(rowB).find(`td[data-key="${sortKey}"]`).data('value');

            // Sort by isTemplate (true first on the first click)
            const valueA = cellA === true ? 0 : 1;
            const valueB = cellB === true ? 0 : 1;
            return isAscending ? valueA - valueB : valueB - valueA;
        } else {
            const cellA = $(rowA).find(`td[data-key="${sortKey}"]`).text().trim();
            const cellB = $(rowB).find(`td[data-key="${sortKey}"]`).text().trim();

            // Compare strings for "Snippet"
            return isAscending
                ? cellA.localeCompare(cellB)
                : cellB.localeCompare(cellA);
        }
    });

    // Re-append sorted rows to the table body
    $.each($rows, function (index, row) {
        $tbody.append(row);
    });

    // Update header classes for visual feedback
    const $header = $table.find(`th[data-sort="${sortKey}"]`);
    $table.find('th').removeClass('asc desc');
    $header.addClass(isAscending ? 'asc' : 'desc');

    // Store the current sort key and order
    currentSortKey = sortKey;
    currentSortOrder = isAscending;
}

function updateSnippetsList() {
    const $snippetsTableBody = $('#snippets-table tbody');
    $snippetsTableBody.empty(); // Clear the table body

    const snippetKeys = Object.keys(localStorage).filter(key => key.startsWith(KEY_PREFIX));
    const totalSnippets = snippetKeys.length;

    snippetKeys.forEach((key) => {
        const snippet = JSON.parse(localStorage.getItem(key));
        const title = key.replace(KEY_PREFIX, ''); // Remove the key prefix

        addSnippetToTable(title, snippet.isTemplate, snippet.timestamp);
    });

    updateHashtagCounts(); // Update hashtag counts after loading snippets

    // Reapply the current sort order
    sortTableByColumn(currentSortKey, currentSortOrder);

    // Update the Snippets header
    const visibleSnippets = $snippetsTableBody.find('tr:visible').length;
    const $snippetsHeader = $('#snippets-header'); // Assuming the h2 has an ID of "snippets-header"
    if (visibleSnippets === totalSnippets) {
        $snippetsHeader.text(`Snippets (${totalSnippets})`);
    } else {
        $snippetsHeader.text(`Snippets (${visibleSnippets}/${totalSnippets})`);
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// Copy to Clipboard
///////////////////////////////////////////////////////////////////////////////////////////////////

async function copyToClipboard() {
    const semanticHtml = quill.getSemanticHTML().trim();
    console.log(`\nSemantic HTML input:\n\n${semanticHtml}`);

    // 1) String-replace spaces, apostrophes, and quotes. We can't replace the ampersand here as DOMParser would reverse that.
    let modifiedHtml = semanticHtml
        .replaceAll('<p>&nbsp;</p>', '<p></p>')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&#39;', "'")
        .replaceAll('&quot;', '"');

    console.log(`\nModified HTML input:\n\n${modifiedHtml}`);

    const parser = new DOMParser();
    const doc = parser.parseFromString(modifiedHtml, 'text/html');

    // 2) Modify Bold and italic text
    Array.from(doc.body.childNodes).forEach(processNode);

    // 3) Process unordered lists (<ul>) into plain text with bullet points
    const unorderedLists = $(doc).find('ul');
    unorderedLists.each((_, ul) => {
        const $ul = $(ul);
        const listItems = $ul.find('li').map((_, li) => {
            const $paragraph = $('<p>').text(`   • ${$(li).text().trim()}`);
            return $paragraph.get(0); // Return the DOM element for replaceWith
        }).get();
        $ul.replaceWith(...listItems); // Replace the <ul> with individual <p> elements
    });

    // 4) Process ordered lists (<ol>) into individual paragraphs
    const orderedLists = $(doc).find('ol');
    orderedLists.each((_, ol) => {
        const $ol = $(ol);
        const listItems = $ol.find('li').map((index, li) => {
            const $paragraph = $('<p>').text(`   ${index + 1}. ${$(li).text().trim()}`);
            return $paragraph.get(0); // Return the DOM element for replaceWith
        }).get();
        $ol.replaceWith(...listItems); // Replace the <ol> with individual <p> elements
    });

    // 5) Serialize the modified DOM back to a string and replace the special encoded ampersand character with the actual character.
    modifiedHtml = doc.body.innerHTML.trim()
        .replaceAll('&amp;', '&');

    // 6) Remove <strong>, <b>, <em>, and <i> tags using regex
    modifiedHtml = modifiedHtml.replace(/<\/?(strong|b|em|i)>/g, '');

    // 7) Replace <p> and </p> with Unicode paragraphBreak and newLine
    const newLine = '\n'; // Newline character
    modifiedHtml = modifiedHtml.replace(/<p>/g, '').replace(/<\/p>/g, newLine);

    // 8) Append link to Simple LinkedIn Composer
    if (!modifiedHtml.includes("✒️")) {
        modifiedHtml += `${newLine}${newLine}✒️ Post written in Simple LinkedIn Composer. Always free, never tracked. ✒️${newLine}https://linkedin-composer.simondoescloud.com`;
    }

    console.log(`\nModified output:\n\n${modifiedHtml}`);

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
}

// Function to get styled Unicode character
function getStyledUnicode(char, isBold, isItalic) {
    // Check if the character is a Latin letter (A-Z or a-z)
    if ((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z')) {
        if (isBold && isItalic) {
            return latinToMathBoldItalic[char] || char; // Bold Italic
        } else if (isBold) {
            return latinToMathBold[char] || char;       // Bold
        } else if (isItalic) {
            return latinToMathItalic[char] || char;     // Italic
        } else {
            return latinToMathSansSerif[char] || char;  // Sans-Serif
        }
    }

    // Check if the character is a digit (0-9).
    // There are no italic Mathematical variants, so we only check for bold and sans-serif.
    if (char >= '0' && char <= '9') {
        if (isBold) {
            return digitsToMathBold[char] || char;      // Bold
        } else {
            return digitsToMathSansSerif[char] || char; // Sans-Serif
        }
    }

    // Return the original character if it's not a Latin letter or digit
    return char;
}

function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        // For text nodes, determine the formatting of the parent element
        const parent = node.parentElement;

        // Skip processing if the parent is an anchor tag (<a>) or if the text contains a URL. Otherwise, URLs will be
        // converted to Unicode characters and not be interpreted correctly as links.
        if (parent && parent.tagName === 'A') {
            return; // Skip processing links
        }
        if (node.textContent.match(/https?:\/\/[^\s]+/)) {
            return; // Skip processing text nodes containing URLs
        }

        const isBold = parent && (parent.tagName === 'B' || parent.tagName === 'STRONG');
        const isItalic = parent && (parent.tagName === 'I' || parent.tagName === 'EM');

        // Transform the text content based on the formatting
        node.textContent = Array.from(node.textContent)
            .map((char) => getStyledUnicode(char, isBold, isItalic))
            .join('');
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Recursively process child nodes
        Array.from(node.childNodes).forEach(processNode);
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// Quill Setup
///////////////////////////////////////////////////////////////////////////////////////////////////

function clearEditor() {
    quill.setText('');
    hasUnsavedChanges = false; // Reset the flag since the editor is cleared intentionally
}

// Function to check for unsaved changes and prompt for confirmation
function confirmUnsavedChanges() {
    if (hasUnsavedChanges) {
        return confirm('You have unsaved changes. Do you want to discard them and proceed?');
    }
    return true;
}

// Hide the emoji picker if clicked outside
function hideEmojiPicker(event) {
    if (
        !$(event.target).closest('.emoji-picker-container').length &&
        !$(event.target).closest('.ql-emoji').length
    ) {
        $('.emoji-picker-container').hide();
    }
}

// Update the "load-sample-button" click handler to include the confirmation prompt
function loadSampleText() {
    if (!confirmUnsavedChanges()) {
        return; // Exit if the user cancels
    }

    quill.setContents(JSON.parse(samplePostJson)); // Populate the editor with the sample text
    hasUnsavedChanges = false; // Reset the flag since new content is loaded
}

// Listen for emoji selection
function pickEmoji(event) {
    const emoji = event.detail.unicode;
    const range = quill.getSelection();
    if (range) {
        quill.insertText(range.index, emoji);
    }
    $('.emoji-picker-container').hide();
}

// Toggle the emoji picker visibility
function toggleEmojiPicker() {
    const $emojiPicker = $('.emoji-picker-container');
    const editorOffset = $('#editor-container').offset();

    // Position the emoji picker above the editor
    $emojiPicker.css({
        top: editorOffset.top + 10,
        left: editorOffset.left + 10,
    });

    $emojiPicker.toggle(); // Toggle visibility
}

// Initialize Quill
function initializeQuill() {
    return new Quill('#editor-container', {
        modules: {
            toolbar: {
                container: [
                    ['bold', 'italic'/*, 'underline', 'strike'*/],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['emoji'], // Custom emoji button
                    ['clean', 'clear']
                ],
                handlers: {
                    emoji: toggleEmojiPicker,
                    clear: clearEditor
                },
            },
            clipboard: {
                matchers: [], // Allow all content by default
            },
        },
        placeholder: 'Compose your post, then follow instructions below...',
        theme: 'snow',
    });
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// Utility Functions
///////////////////////////////////////////////////////////////////////////////////////////////////

function accordionSetup() {
    // Accordion functionality
    $('.accordion-header').on('click', function () {
        const $content = $(this).siblings('.accordion-content'); // Find the sibling content

        // Toggle the "open" class on the content
        $content.toggleClass('open');

        // Optionally, close other accordions (if needed)
        // $('.accordion-content').not($content).removeClass('open');
    });
}

// Utility function to download a file
function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "application/json" });
    const $link = $('<a>', {
        href: URL.createObjectURL(blob),
        download: filename,
    });

    $link.appendTo('body'); // Temporarily add the link to the DOM
    $link[0].click(); // Trigger the download
    $link.remove(); // Remove the link from the DOM
    URL.revokeObjectURL($link.attr('href')); // Revoke the object URL
};

function eventListenerSetup() {
    // LinkedIn
    $('#linkedin-user-id').on('input', (event) => setLinkedInUserId(event)); // Set LinkedIn user ID on input change
    $('#sort-name').on('click', () => sortHashtagsByName());
    $('#sort-count').on('click', () => sortHashtagsByCount());

    // Snippets
    $('#clear-button').on('click', () => clearSnippetsFromStorage());
    $('#save-button').on('click', () => saveSnippet());
    $('#export-data').on('click', () => exportSnippets());
    $('#import-data').on('click', () => importSnippets());
    $('#snippet-filter').on('input', (e) => filterSnippets($(e.target).val()));
    $('#load-sample-button').on('click', () => loadSampleText());

    // Clipboard
    $('#copy-button').on('click', async () => await copyToClipboard());

    // Editor
    $('emoji-picker').on('emoji-click', (e) => pickEmoji(e));
    $(document).on('click', (e) => hideEmojiPicker(e));
    quill.on('text-change', () => hasUnsavedChanges = true);
}

// Generate Unicode translations for Latin characters
function generateDigitUnicodeMap(baseCodePoint) {
    const map = {};

    for (let i = 0; i < 10; i++) {
        map[String.fromCharCode(48 + i)] = String.fromCodePoint(baseCodePoint + i);         // Digits 0-9
    }

    return map;
}

function generateUnicodeMap(baseCodePoint) {
    const map = {};

    for (let i = 0; i < 26; i++) {
        map[String.fromCharCode(65 + i)] = String.fromCodePoint(baseCodePoint + i);         // Uppercase A-Z
        map[String.fromCharCode(97 + i)] = String.fromCodePoint(baseCodePoint + 26 + i);    // Lowercase a-z
    }

    return map;
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// Startup
///////////////////////////////////////////////////////////////////////////////////////////////////

$(() => {
    quill = initializeQuill();

    // Fetch the stats on page load
    fetchGitHubStats();

    // Call the function to load the LinkedIn user ID on page load
    loadLinkedInUserId();

    // Set up the accordion behavior for expanding and collapsing the major sections
    accordionSetup();

    // Initialize the snippets list on page load. This also performs the initial sort by "Timestamp" in descending order.
    updateSnippetsList();

    // Set up snippet sort upon column header click
    setupSnippetSort();

    // Set up the event listeners for various elements
    eventListenerSetup();

    quill.focus();
});