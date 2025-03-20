///////////////////////////////////////////////////////////////////////////////////////////////////
// Declarations
///////////////////////////////////////////////////////////////////////////////////////////////////

// Key for storing LinkedIn user ID in localStorage
const LINKEDIN_USER_ID_KEY = 'linkedin_id';
const LINKEDIN_POST_URL_TEMPLATE = `https://www.linkedin.com/in/<user>/overlay/create-post`;

// Mappings of original Latin to Mathematical Sans Serif (plain), bold, italic, and bold & italic characters.
const latinToMathSansSerif = {
    'A': '\u{1D5A0}', 'B': '\u{1D5A1}', 'C': '\u{1D5A2}', 'D': '\u{1D5A3}', 'E': '\u{1D5A4}',
    'F': '\u{1D5A5}', 'G': '\u{1D5A6}', 'H': '\u{1D5A7}', 'I': '\u{1D5A8}', 'J': '\u{1D5A9}',
    'K': '\u{1D5AA}', 'L': '\u{1D5AB}', 'M': '\u{1D5AC}', 'N': '\u{1D5AD}', 'O': '\u{1D5AE}',
    'P': '\u{1D5AF}', 'Q': '\u{1D5B0}', 'R': '\u{1D5B1}', 'S': '\u{1D5B2}', 'T': '\u{1D5B3}',
    'U': '\u{1D5B4}', 'V': '\u{1D5B5}', 'W': '\u{1D5B6}', 'X': '\u{1D5B7}', 'Y': '\u{1D5B8}',
    'Z': '\u{1D5B9}', 'a': '\u{1D5BA}', 'b': '\u{1D5BB}', 'c': '\u{1D5BC}', 'd': '\u{1D5BD}',
    'e': '\u{1D5BE}', 'f': '\u{1D5BF}', 'g': '\u{1D5C0}', 'h': '\u{1D5C1}', 'i': '\u{1D5C2}',
    'j': '\u{1D5C3}', 'k': '\u{1D5C4}', 'l': '\u{1D5C5}', 'm': '\u{1D5C6}', 'n': '\u{1D5C7}',
    'o': '\u{1D5C8}', 'p': '\u{1D5C9}', 'q': '\u{1D5CA}', 'r': '\u{1D5CB}', 's': '\u{1D5CC}',
    't': '\u{1D5CD}', 'u': '\u{1D5CE}', 'v': '\u{1D5CF}', 'w': '\u{1D5D0}', 'x': '\u{1D5D1}',
    'y': '\u{1D5D2}', 'z': '\u{1D5D3}'
};

const latinToMathBold = {
    'A': '\u{1D400}', 'B': '\u{1D401}', 'C': '\u{1D402}', 'D': '\u{1D403}', 'E': '\u{1D404}',
    'F': '\u{1D405}', 'G': '\u{1D406}', 'H': '\u{1D407}', 'I': '\u{1D408}', 'J': '\u{1D409}',
    'K': '\u{1D40A}', 'L': '\u{1D40B}', 'M': '\u{1D40C}', 'N': '\u{1D40D}', 'O': '\u{1D40E}',
    'P': '\u{1D40F}', 'Q': '\u{1D410}', 'R': '\u{1D411}', 'S': '\u{1D412}', 'T': '\u{1D413}',
    'U': '\u{1D414}', 'V': '\u{1D415}', 'W': '\u{1D416}', 'X': '\u{1D417}', 'Y': '\u{1D418}',
    'Z': '\u{1D419}', 'a': '\u{1D41A}', 'b': '\u{1D41B}', 'c': '\u{1D41C}', 'd': '\u{1D41D}',
    'e': '\u{1D41E}', 'f': '\u{1D41F}', 'g': '\u{1D420}', 'h': '\u{1D421}', 'i': '\u{1D422}',
    'j': '\u{1D423}', 'k': '\u{1D424}', 'l': '\u{1D425}', 'm': '\u{1D426}', 'n': '\u{1D427}',
    'o': '\u{1D428}', 'p': '\u{1D429}', 'q': '\u{1D42A}', 'r': '\u{1D42B}', 's': '\u{1D42C}',
    't': '\u{1D42D}', 'u': '\u{1D42E}', 'v': '\u{1D42F}', 'w': '\u{1D430}', 'x': '\u{1D431}',
    'y': '\u{1D432}', 'z': '\u{1D433}'
};

const latinToMathItalic = {
    'A': '\u{1D434}', 'B': '\u{1D435}', 'C': '\u{1D436}', 'D': '\u{1D437}', 'E': '\u{1D438}',
    'F': '\u{1D439}', 'G': '\u{1D43A}', 'H': '\u{1D43B}', 'I': '\u{1D43C}', 'J': '\u{1D43D}',
    'K': '\u{1D43E}', 'L': '\u{1D43F}', 'M': '\u{1D440}', 'N': '\u{1D441}', 'O': '\u{1D442}',
    'P': '\u{1D443}', 'Q': '\u{1D444}', 'R': '\u{1D445}', 'S': '\u{1D446}', 'T': '\u{1D447}',
    'U': '\u{1D448}', 'V': '\u{1D449}', 'W': '\u{1D44A}', 'X': '\u{1D44B}', 'Y': '\u{1D44C}',
    'Z': '\u{1D44D}', 'a': '\u{1D44E}', 'b': '\u{1D44F}', 'c': '\u{1D450}', 'd': '\u{1D451}',
    'e': '\u{1D452}', 'f': '\u{1D453}', 'g': '\u{1D454}', 'h': '\u{210E}', 'i': '\u{1D456}',
    'j': '\u{1D457}', 'k': '\u{1D458}', 'l': '\u{1D459}', 'm': '\u{1D45A}', 'n': '\u{1D45B}',
    'o': '\u{1D45C}', 'p': '\u{1D45D}', 'q': '\u{1D45E}', 'r': '\u{1D45F}', 's': '\u{1D460}',
    't': '\u{1D461}', 'u': '\u{1D462}', 'v': '\u{1D463}', 'w': '\u{1D464}', 'x': '\u{1D465}',
    'y': '\u{1D466}', 'z': '\u{1D467}'
};

const latinToMathBoldItalic = {
    'A': '\u{1D468}', 'B': '\u{1D469}', 'C': '\u{1D46A}', 'D': '\u{1D46B}', 'E': '\u{1D46C}',
    'F': '\u{1D46D}', 'G': '\u{1D46E}', 'H': '\u{1D46F}', 'I': '\u{1D470}', 'J': '\u{1D471}',
    'K': '\u{1D472}', 'L': '\u{1D473}', 'M': '\u{1D474}', 'N': '\u{1D475}', 'O': '\u{1D476}',
    'P': '\u{1D477}', 'Q': '\u{1D478}', 'R': '\u{1D479}', 'S': '\u{1D47A}', 'T': '\u{1D47B}',
    'U': '\u{1D47C}', 'V': '\u{1D47D}', 'W': '\u{1D47E}', 'X': '\u{1D47F}', 'Y': '\u{1D480}',
    'Z': '\u{1D481}', 'a': '\u{1D482}', 'b': '\u{1D483}', 'c': '\u{1D484}', 'd': '\u{1D485}',
    'e': '\u{1D486}', 'f': '\u{1D487}', 'g': '\u{1D488}', 'h': '\u{1D489}', 'i': '\u{1D48A}',
    'j': '\u{1D48B}', 'k': '\u{1D48C}', 'l': '\u{1D48D}', 'm': '\u{1D48E}', 'n': '\u{1D48F}',
    'o': '\u{1D490}', 'p': '\u{1D491}', 'q': '\u{1D492}', 'r': '\u{1D493}', 's': '\u{1D494}',
    't': '\u{1D495}', 'u': '\u{1D496}', 'v': '\u{1D497}', 'w': '\u{1D498}', 'x': '\u{1D499}',
    'y': '\u{1D49A}', 'z': '\u{1D49B}'
};

// Sample text to load into the editor
const samplePostJson = `{"ops":[{"insert":"🎉 "},{"attributes":{"bold":true},"insert":"Simple LinkedIn Composer "},{"insert":"🎉\\n \\nStyle eludes me. Any tool that can help make these posts a little better for you to read is helpful. I haven't found any good, "},{"attributes":{"italic":true,"bold":true},"insert":"completely free"},{"insert":" LinkedIn post composers, so I'm rolling my own. Say hello to this low-budget, no-frills, single-purpose composer that you can use, if you like.\\n \\n"},{"attributes":{"bold":true},"insert":"⚙️ Some features"},{"insert":"\\n\\nI'm using Jason Chen's free rich-text editor, "},{"attributes":{"italic":true},"insert":"Quill"},{"insert":". Thank you for creating an awesome product, Jason!"},{"attributes":{"list":"bullet"},"insert":"\\n"},{"insert":"Emojis are supported via through Nolan Lawson's "},{"attributes":{"italic":true},"insert":"emoji-picker"},{"insert":" which even supports emoji search! Thank you for this cool module, Nolan!"},{"attributes":{"list":"bullet"},"insert":"\\n"},{"insert":"You can use local storage to save and load composed posts with full formatting. You can easily clear the list, too. This makes reusing snippets simpler."},{"attributes":{"list":"bullet"},"insert":"\\n"},{"attributes":{"bold":true},"insert":"No data leaves your device. There are no trackers, etc. "},{"attributes":{"list":"bullet"},"insert":"\\n"},{"insert":"Pressing Enter does "},{"attributes":{"italic":true},"insert":"not"},{"insert":" save the post and make it live on LinkedIn. 🤣"},{"attributes":{"list":"bullet"},"insert":"\\n"},{"insert":" \\nTry it out on the GitHub page: \\nhttps://simonkurtz-msft.github.io/simple-linkedin-composer\\n \\n🐛 "},{"attributes":{"bold":true},"insert":"Bugs"},{"insert":"\\n \\nI'm sure there are bugs and improvements to be made. If you can, please submit an issue on GitHub, and if you have it in you, I would be grateful for a PR. Thank you!\\n\\n#linkedin\\n"}]}`;



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



///////////////////////////////////////////////////////////////////////////////////////////////////
// Snippet Functions
///////////////////////////////////////////////////////////////////////////////////////////////////

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

        // Populate the snippet title textbox with the snippet name
        const snippetTitle = key.replace('snippet-', ''); // Remove the "snippet-" prefix
        $('#snippet-title').val(snippetTitle); // Set the snippet title in the textbox
    } else {
        alert('Snippet not found.');
    }
}

// Delete a specific snippet from local storage
function deleteSnippet(key) {
    if (confirm(`Are you sure you want to delete the snippet "${key}"? This action cannot be undone.`)) {
        localStorage.removeItem(key);
        updateSnippetsList();
    }
}

// Generate a key from the first 50 alphanumeric characters
function generateKey(content) {
    return 'snippet-' + content.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50).trim().replace(/\s+/g, '-') || 'Untitled';
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
    const key = `snippet-${title.replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-')}`;

    const snippet = {
        delta: quill.getContents(),
        timestamp: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(snippet));
    updateSnippetsList();
});



///////////////////////////////////////////////////////////////////////////////////////////////////
// Copy to Clipboard
///////////////////////////////////////////////////////////////////////////////////////////////////

$('#copy-button').on('click', async () => {
    const semanticHtml = quill.getSemanticHTML().trim();
    console.log(`\nSemantic HTML input:\n\n${semanticHtml}`);

    // 1) String-replace spaces, apostrophes, and quotes.
    var modifiedHtml = semanticHtml
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&#39;', "'")
        .replaceAll('&quot;', '"');

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
    const paragraphBreak = '\u2029'; // Unicode Paragraph Separator
    const newLine = '\n'; // Newline character
    modifiedHtml = modifiedHtml.replace(/<p>/g, paragraphBreak).replace(/<\/p>/g, newLine);

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
            return latinToMathBold[char] || char; // Bold
        } else if (isItalic) {
            return latinToMathItalic[char] || char; // Italic
        } else {
            return latinToMathSansSerif[char] || char; // Sans-Serif
        }
    }
    // Return the original character if it's not a Latin letter
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
// Startup
///////////////////////////////////////////////////////////////////////////////////////////////////

$(function () {
    // Call the function to load the LinkedIn user ID on page load
    loadLinkedInUserId();
    // Initialize the snippets list on page load
    updateSnippetsList();
    quill.focus();
});
