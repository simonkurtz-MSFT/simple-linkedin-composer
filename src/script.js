///////////////////////////////////////////////////////////////////////////////////////////////////
// Declarations
///////////////////////////////////////////////////////////////////////////////////////////////////

// Key for storing LinkedIn user ID in localStorage
const LINKEDIN_USER_ID_KEY = 'linkedin_id';
const LINKEDIN_POST_URL_TEMPLATE = `https://www.linkedin.com/in/<user>/overlay/create-post`;

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
        { "insert": "Emojis are supported via through Nolan Lawson's " }, { "attributes": { "italic": true }, "insert": "emoji-picker" }, { "insert": " which even supports emoji search! Thank you for this cool module, Nolan!" }, { "attributes": { "list": "bullet" }, "insert": "\\n" },
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

// Save LinkedIn user ID to localStorage when it changes
$('#linkedin-user-id').on('input', () => {
    const userId = $(this).val().trim();
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



///////////////////////////////////////////////////////////////////////////////////////////////////
// Hashtag Functions
///////////////////////////////////////////////////////////////////////////////////////////////////

// Function to extract hashtags from a string
function extractHashtags(text) {
    const hashtagRegex = /#\w+/g;
    return (text.match(hashtagRegex) || []);
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

let sortNameAsc = true; // Toggle state for name sorting
let sortCountAsc = true; // Toggle state for count sorting

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
                .attr('src', 'linkedin-icon.svg')
                .attr('alt', 'LinkedIn')
                .addClass('linkedin-icon'));

        // Add the ➕️ symbol, LinkedIn icon, and hashtag text to the item
        $hashtagItem.append($addButton, $linkedinLink, `${tag} (${count})`);
        $hashtagList.append($hashtagItem);
    });
}

// Event listener for sorting by name
$('#sort-name').on('click', () => {
    const hashtags = JSON.parse(localStorage.getItem('hashtags')) || {};
    const sortedHashtags = Object.entries(hashtags).sort(([tagA], [tagB]) => {
        return sortNameAsc ? tagA.localeCompare(tagB) : tagB.localeCompare(tagA);
    });
    sortNameAsc = !sortNameAsc; // Toggle sorting order
    renderHashtagList(Object.fromEntries(sortedHashtags));
});

// Event listener for sorting by count with tie-breaking by name
$('#sort-count').on('click', () => {
    const hashtags = JSON.parse(localStorage.getItem('hashtags')) || {};
    const sortedHashtags = Object.entries(hashtags).sort(([tagA, countA], [tagB, countB]) => {
        if (countA === countB) {
            return tagA.localeCompare(tagB); // Tie-breaking: Sort by name ascending
        }
        return sortCountAsc ? countA - countB : countB - countA;
    });
    sortCountAsc = !sortCountAsc; // Toggle sorting order
    renderHashtagList(Object.fromEntries(sortedHashtags));
});

// Function to insert a hashtag into the editor
function insertHashtagIntoEditor(hashtag) {
    const range = quill.getSelection(); // Get the current cursor position
    if (range) {
        quill.insertText(range.index, `${hashtag} `); // Insert the hashtag followed by a space
        quill.setSelection(range.index + hashtag.length + 1); // Move the cursor after the inserted text
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// Snippet Functions
///////////////////////////////////////////////////////////////////////////////////////////////////

function updateSnippetsList() {
    const $snippetsTableBody = $('#snippets-table tbody');
    $snippetsTableBody.empty(); // Clear the table body

    Object.keys(localStorage).forEach((key) => {
        // Only process keys that start with the key prefix
        if (!key.startsWith(KEY_PREFIX)) return;

        const snippet = JSON.parse(localStorage.getItem(key));
        const title = key.replace(KEY_PREFIX, ''); // Remove the key prefix

        addSnippetToTable(title, snippet.isTemplate, snippet.timestamp);
    });

    updateHashtagCounts(); // Update hashtag counts after loading snippets
}

// Load a snippet into the editor
function loadSnippet(key) {
    const savedSnippet = localStorage.getItem(key);

    if (savedSnippet) {
        snippet = JSON.parse(savedSnippet);
        const { delta } = snippet;
        quill.setContents(delta); // Load the snippet content into the editor
        $('#is-template').prop('checked', snippet.isTemplate === true);

        // Extract the snippet title from the key
        const snippetTitle = key.replace(KEY_PREFIX, ''); // Remove the key prefix
        $('#snippet-title').val(snippetTitle); // Set the snippet title in the textbox
    } else {
        alert('Snippet not found.');
    }
}

// Generate a key from the first 50 alphanumeric characters
function generateKey(content) {
    return KEY_PREFIX + content.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50).trim().replace(/\s+/g, '-') || 'Untitled';
}

// Clear all saved snippets from local storage
$('#clear-button').on('click', () => {
    if (Object.keys(localStorage).length === 0)
        return;

    if (confirm('Are you sure you want to clear all saved snippets? This action cannot be undone.')) {
        localStorage.clear();
        updateSnippetsList();

        localStorage.removeItem("hashtags");
        renderHashtagList({});
    }
});

// Save the content to local storage
$('#save-button').on('click', () => {
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
});

// Export functionality
$('#export-data').on('click', () => {
    const data = {};

    // Filter localStorage keys that start with "snippet-"
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('snippet-')) {
            data[key] = localStorage.getItem(key);
        }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `LinkedIn-Composer-Data-${timestamp}.json`;

    // Log and download the filtered data
    console.log(JSON.stringify(data, null, 2));
    downloadFile(filename, JSON.stringify(data, null, 2));
});

// Import functionality
$('#import-data').on('click', () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const content = await file.text();
        try {
            const importedData = JSON.parse(content);
            let i = 0;

            // Import data into localStorage
            for (let [key, value] of Object.entries(importedData)) {
                const existingItem = localStorage.getItem(key);

                if (existingItem) {
                    const existingData = JSON.parse(existingItem);
                    value = JSON.parse(value);
                    console.log(existingData.timestamp, value.timestamp, existingData.timestamp === value.timestamp);
                    if (existingData.timestamp === value.timestamp) {
                        console.warn(`Duplicate entry with key ${key}. Skipping.`);
                        continue;
                    } else if (existingData.timestamp > value.timestamp) {
                        console.warn(`Older entry with key ${key}. Skipping.`);
                        continue;
                    }
                }

                // Parse nested JSON strings if necessary
                const parsedValue = typeof value === 'string' && value.startsWith('{')
                    ? JSON.parse(value)
                    : value;

                localStorage.setItem(key, JSON.stringify(parsedValue));
                i++;
            }

            if (i > 0) {
                alert(`Successfully imported ${i} snippet(s).`);
                updateSnippetsList(); // Refresh the snippets list
            } else {
                alert('No new snippets were imported. The data may already exist in localStorage.');
            }
        } catch (error) {
            console.error("Error importing data:", error);
            alert("Failed to import data. Please check the file format.");
        }
    });

    input.click();
});

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

function sortTableByColumn(sortKey, isAscending) {
    const $table = $('#snippets-table');
    const $tbody = $table.find('tbody');
    const $rows = $tbody.find('tr').get();

    $rows.sort((rowA, rowB) => {
        const cellA = $(rowA).find(`td[data-key="${sortKey}"]`).text().trim();
        const cellB = $(rowB).find(`td[data-key="${sortKey}"]`).text().trim();

        if (sortKey === 'timestamp') {
            // Parse timestamps for comparison
            return isAscending
                ? new Date(cellA) - new Date(cellB)
                : new Date(cellB) - new Date(cellA);
        } else {
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
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// Copy to Clipboard
///////////////////////////////////////////////////////////////////////////////////////////////////

$('#copy-button').on('click', async () => {
    const semanticHtml = quill.getSemanticHTML().trim();
    console.log(`\nSemantic HTML input:\n\n${semanticHtml}`);

    // 1) String-replace spaces, apostrophes, and quotes.
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
    const unorderedLists = doc.querySelectorAll('ul');
    unorderedLists.forEach((ul) => {
        const listItems = Array.from(ul.querySelectorAll('li')).map((li) => {
            const paragraph = document.createElement('p');
            paragraph.textContent = `   • ${li.textContent.trim()}`;
            return paragraph;
        });
        ul.replaceWith(...listItems); // Replace the <ul> with individual <p> elements
    });

    // 4) Process ordered lists (<ol>) into individual paragraphs
    const orderedLists = doc.querySelectorAll('ol');
    orderedLists.forEach((ol) => {
        const listItems = Array.from(ol.querySelectorAll('li')).map((li, index) => {
            const paragraph = document.createElement('p');
            paragraph.textContent = `   ${index + 1}. ${li.textContent.trim()}`;
            return paragraph;
        });
        ol.replaceWith(...listItems); // Replace the <ol> with individual <p> elements
    });

    // 5) Serialize the modified DOM back to a string
    modifiedHtml = doc.body.innerHTML.trim();

    // 6) Remove <strong>, <b>, <em>, and <i> tags using regex
    modifiedHtml = modifiedHtml.replace(/<\/?(strong|b|em|i)>/g, '');

    // 7) Replace <p> and </p> with Unicode paragraphBreak and newLine
    const newLine = '\n'; // Newline character
    modifiedHtml = modifiedHtml.replace(/<p>/g, '').replace(/<\/p>/g, newLine);

    // 8) Append link to Simple LinkedIn Composer
    if (!modifiedHtml.includes("✒️")) {
        modifiedHtml += `${newLine}${newLine}✒️ Post written in Simple LinkedIn Composer ✒️${newLine}https://linkedin-composer.simondoescloud.com`;
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
});

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



///////////////////////////////////////////////////////////////////////////////////////////////////
// Quill Setup
///////////////////////////////////////////////////////////////////////////////////////////////////

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
function clearEditor() {
    quill.setText('');
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

// Initialize Quill
const quill = new Quill('#editor-container', {
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

$('#load-sample-button').on('click', () => {
    quill.setContents(JSON.parse(samplePostJson)); // Populate the editor with the sample text
});



///////////////////////////////////////////////////////////////////////////////////////////////////
// Utility Functions
///////////////////////////////////////////////////////////////////////////////////////////////////

// Generate Unicode translations for Latin characters
function generateUnicodeMap(baseCodePoint) {
    const map = {};

    for (let i = 0; i < 26; i++) {
        map[String.fromCharCode(65 + i)] = String.fromCodePoint(baseCodePoint + i);         // Uppercase A-Z
        map[String.fromCharCode(97 + i)] = String.fromCodePoint(baseCodePoint + 26 + i);    // Lowercase a-z
    }

    return map;
}

function generateDigitUnicodeMap(baseCodePoint) {
    const map = {};

    for (let i = 0; i < 10; i++) {
        map[String.fromCharCode(48 + i)] = String.fromCodePoint(baseCodePoint + i);         // Digits 0-9
    }

    return map;
}

// Utility function to download a file
function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// Startup
///////////////////////////////////////////////////////////////////////////////////////////////////

$(function () {
    // Fetch the stats on page load
    fetchGitHubStats();

    // Call the function to load the LinkedIn user ID on page load
    loadLinkedInUserId();

    // Initialize the snippets list on page load
    updateSnippetsList();

    // Perform initial sort by "Timestamp" in descending order
    sortTableByColumn('timestamp', false);

    quill.focus();

    const $table = $('#snippets-table');

    // Add click event to sortable headers
    $table.find('th[data-sort]').on('click', function () {
        const $header = $(this);
        const sortKey = $header.data('sort');
        const isAscending = !$header.hasClass('asc'); // Toggle sort direction

        // Sort the table by the selected column
        sortTableByColumn(sortKey, isAscending);
    });
});