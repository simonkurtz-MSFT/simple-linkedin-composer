(() => {
    'use strict';

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

    let sortNameAsc = true;             // Toggle state for name sorting
    let sortCountAsc = true;            // Toggle state for count sorting

    let quill;
    let snippetManager;
    let hashtagManager;



    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // HashtagManager Class
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    class HashtagManager {
        constructor() {
            this.hashtags = {};
        }

        extractHashtags(text) {
            const hashtagRegex = /#\w+/g;
            return (text.match(hashtagRegex) || []);
        }

        insertHashtagIntoEditor(hashtag) {
            const range = quill.getSelection();
            if (range) {
                quill.insertText(range.index, `${hashtag} `);
                quill.setSelection(range.index + hashtag.length + 1);
            }
        }

        renderHashtagList() {
            const $hashtagList = $('#hashtag-list');
            $hashtagList.empty();

            $.each(this.hashtags, (tag, count) => {
                const $hashtagItem = $('<div>').addClass('hashtag-item');

                // Create the clickable ➕️ symbol
                const $addButton = $('<a>')
                    .text('➕️')
                    .attr('href', '#')
                    .addClass('add-hashtag-button')
                    .attr('title', 'Add this hashtag to the editor')
                    .on('click', (event) => {
                        event.preventDefault();
                        this.insertHashtagIntoEditor(tag);
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

        sortHashtagsByCount(asc = true) {
            return Object.entries(this.hashtags).sort(([tagA, countA], [tagB, countB]) => {
                if (countA === countB) {
                    return tagA.localeCompare(tagB);
                }
                return asc ? countA - countB : countB - countA;
            });
        }

        sortHashtagsByName(asc = true) {
            return Object.entries(this.hashtags).sort(([tagA], [tagB]) => {
                return asc ? tagA.localeCompare(tagB) : tagB.localeCompare(tagA);
            });
        }

        updateHashtagCounts(snippetsData) {
            this.hashtags = {};
            Object.values(snippetsData).forEach(snippet => {
                const delta = snippet.delta || {};
                const ops = delta.ops || [];
                ops.forEach(op => {
                    if (op.insert && typeof op.insert === 'string') {
                        const snippetHashtags = this.extractHashtags(op.insert);
                        snippetHashtags.forEach(tag => {
                            this.hashtags[tag] = (this.hashtags[tag] || 0) + 1;
                        });
                    }
                });
            });
            localStorage.setItem("hashtags", JSON.stringify(this.hashtags));
        }
    }



    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // SnippetManager Class
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    class SnippetManager {
        constructor() {
            this.KEY_PREFIX = KEY_PREFIX;
            this.snippetsData = {};
        }

        clearAllSnippets() {
            const snippetKeys = Object.keys(localStorage).filter(key => key.startsWith(this.KEY_PREFIX));
            snippetKeys.forEach(key => localStorage.removeItem(key));
            this.snippetsData = {};
        }

        deleteSnippet(title) {
            const key = `${this.KEY_PREFIX}${title}`;
            localStorage.removeItem(key);
            delete this.snippetsData[title];
        }

        getSnippets() {
            return this.snippetsData;
        }

        loadSnippets() {
            this.snippetsData = {};
            const snippetKeys = Object.keys(localStorage).filter(key => key.startsWith(this.KEY_PREFIX));

            snippetKeys.forEach(key => {
                const snippet = JSON.parse(localStorage.getItem(key));
                const title = key.replace(this.KEY_PREFIX, '');
                this.snippetsData[title] = snippet;
            });
        }

        saveSnippet(title, content, isTemplate) {
            const key = `${this.KEY_PREFIX}${title}`;
            const snippet = {
                delta: content,
                timestamp: new Date().toISOString(),
                isTemplate: isTemplate
            };

            localStorage.setItem(key, JSON.stringify(snippet));
        }
    }



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

    function sortHashtagsByCount() {
        const sortedHashtags = hashtagManager.sortHashtagsByCount(sortCountAsc);
        sortCountAsc = !sortCountAsc; // Toggle sorting order
        hashtagManager.hashtags = Object.fromEntries(sortedHashtags);
        hashtagManager.renderHashtagList();
    }

    function sortHashtagsByName() {
        const sortedHashtags = hashtagManager.sortHashtagsByName(sortNameAsc);
        sortNameAsc = !sortNameAsc; // Toggle sorting order
        hashtagManager.hashtags = Object.fromEntries(sortedHashtags);
        hashtagManager.renderHashtagList();
    }

    // Function to update hashtag counts in local storage
    function updateHashtagCounts() {
        hashtagManager.updateHashtagCounts(snippetManager.getSnippets());
        hashtagManager.renderHashtagList();
    }



    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Snippet Functions
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    // Clear all saved snippets from local storage
    function clearAllData() {
        if (Object.keys(localStorage).length === 0) return;

        if (confirm('Are you sure you want to clear all Simple LinkedIn Composer data from your browser\'s storage? This includes snippets as well as any settings.\n\nConsider exporting your saved snippets first as this clear action cannot be undone.')) {
            // Clear all snippets from storage, the in-memory object, then refresh the snippets list (showing zero entries).
            snippetManager.clearAllSnippets();
            updateSnippetsList();

            // Clear all hashtags from storage, then render the hashtag list.
            localStorage.removeItem("hashtags");
            hashtagManager.renderHashtagList({});

            // Clear all remaining items for this web app from localstorage.
            localStorage.clear();
            alert('All localStorage data has been cleared.');
        }
    }

    function deleteSnippet(e) {
        const title = $(e.target).data('key');
        if (confirm(`Are you sure you want to delete this snippet?\n\n${title}`)) {
            snippetManager.deleteSnippet(title);
            updateSnippetsList();
            updateHashtagCounts();
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

    function filterTable(filter) {
        let table = $('#snippets-table').DataTable();
        let lowerCaseFilter = filter.trim().toLowerCase();
        console.log(lowerCaseFilter);
        table.column(0).search(lowerCaseFilter).draw(); // Search only the snippets title column

        updateSnippetsHeader();
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
        if (!confirmUnsavedChanges()) return;

        const savedSnippet = localStorage.getItem(key);
        if (savedSnippet) {
            const snippet = JSON.parse(savedSnippet);
            const { delta } = snippet;
            quill.setContents(delta);
            hasUnsavedChanges = false;
            $('#is-template').prop('checked', snippet.isTemplate === true);

            const snippetTitle = key.replace(KEY_PREFIX, '');
            $('#snippet-title').val(snippetTitle);
        } else {
            alert('Snippet not found.');
        }
    }

    function populateSnippetsTable() {
        const $snippetsTable = $('#snippets-table').DataTable();
        $snippetsTable.clear();

        Object.entries(snippetManager.getSnippets()).forEach(([title, snippet]) => {
            const isoTimestamp = new Date(snippet.timestamp).toISOString();
            const displayTimestamp = new Date(snippet.timestamp).toLocaleString(undefined, {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });

            const isTemplate = snippet.isTemplate === true ? '✔' : '';

            $snippetsTable.row.add([
                `<span class="snippet-link" data-key="${title}">${title}</span>`,
                `<span data-key="timestamp" data-value="${isoTimestamp}">${displayTimestamp}</span>`,
                `<span data-key="template" data-value="${snippet.isTemplate}">${isTemplate}</span>`,
                `<button class="delete-snippet" data-key="${title}">Delete</button>`
            ]);
        });

        $snippetsTable.draw();
    }

    function saveSnippet() {
        const content = quill.getText().trim();
        if (!content) {
            alert('The editor is empty. Please write something to save.');
            return;
        }

        let title = $('#snippet-title').val().trim();
        if (!title) {
            alert('Snippet title cannot be empty.');
            return;
        }

        title = title.substring(0, 50); // Limit the title to 50 characters
        const isTemplate = $('#is-template').is(':checked');

        if (snippetManager.getSnippets()[title]) {
            const confirmOverride = confirm(`A snippet with this title already exists. Do you want to overwrite it?\n\n${title}`);
            if (!confirmOverride) return;
        }

        snippetManager.saveSnippet(title, quill.getContents(), isTemplate);
        updateSnippetsList();
    }

    // Initialize the DataTable with custom search functionality
    function setupSnippetPaging() {
        let firstTemplateColumnSort = true;

        $('#snippets-table').DataTable({
            paging: true,
            pageLength: 10,
            searching: true,   // roll our own
            dom: '<"top"f>rt<"bottom"lp><"clear">',
            columnDefs: [
                { orderable: false, targets: 3 }, // Disable sorting for the "Delete" column
            ],
            order: [[1, 'desc']], // Set the initial sort order for the "timestamp" column (index 1) to descending
            initComplete: function () {
                // Customize the search to target only the first column (snippet title)
                const table = this.api();
                const $snippetsHeader = $('#snippets-header');

                // Update the total snippets count after the table is fully initialized
                table.on('draw', () => {
                    const totalSnippets = table.columns(0).data().count();
                    $snippetsHeader.text(`Snippets (${totalSnippets})`);
                });

                // Customize the click behavior for the "template" column
                $('#snippets-table thead th').on('click', function () {
                    const columnIndex = $(this).index();

                    if (columnIndex === 2) { // Template column index
                        if (firstTemplateColumnSort) {
                            firstTemplateColumnSort = false;
                            table.order([2, 'desc']).draw();    // makes the first click on the Template column descending
                        }
                    }
                });

                $('#snippets-table_filter input')
                    .addClass('form-control') // Add the same class as the snippets filter textbox
                    .attr('placeholder', 'Search snippets...') // Add a placeholder for better UX
                    .css({
                        fontSize: '1rem',
                        width: '200px', // Make it full width
                        margin: '0.5rem 0', // Add some spacing
                    }).on('input', (e) => filterTable($(e.target).val()));

                // Remove the "Search:" label
                $('#snippets-table_filter label').contents().filter((_, el) => el.nodeType === 3).remove();
            },
        });
    };

    function updateSnippetsHeader() {
        let table = $('#snippets-table').DataTable();
        // Get the count of visible rows after filtering
        const visibleCount = table.rows({ filter: 'applied' }).count();
        const totalSnippets = table.columns(0).data().count();

        // Update the Snippets header
        const $snippetsHeader = $('#snippets-header');
        if (visibleCount === totalSnippets) {
            $snippetsHeader.text(`Snippets (${totalSnippets})`);
        } else {
            $snippetsHeader.text(`Snippets (${visibleCount}/${totalSnippets})`);
        }

    }

    function updateSnippetsList() {
        snippetManager.loadSnippets(); // Load snippets into the manager
        populateSnippetsTable(); // Populate the table using the manager's data
        updateSnippetsHeader();
    }



    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Copy to Clipboard
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    async function copyToClipboard() {
        const semanticHtml = quill.getSemanticHTML().trim();
        console.log(`\n1/3) Semantic HTML input:\n\n${semanticHtml}`);

        // 1) String-replace spaces, apostrophes, and quotes. We can't replace the ampersand here as DOMParser would reverse that.
        let modifiedHtml = semanticHtml
            .replaceAll('<p>&nbsp;</p>', '<p></p>')
            .replaceAll('&nbsp;', ' ')
            .replaceAll('&#39;', "'")
            .replaceAll('&quot;', '"');

        console.log(`\n2/3) Modified HTML input:\n\n${modifiedHtml}`);

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

        console.log(`\n3/3) Modified output:\n\n${modifiedHtml}`);

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
        const quill = new Quill('#editor-container', {
            modules: {
                toolbar: {
                    container: [
                        ['bold', 'italic'/*, 'underline', 'strike'*/],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['clean', 'emoji', 'clear']
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

        // Add tooltips to the toolbar buttons
        const toolbar = quill.getModule('toolbar');
        const $toolbarButtons = $(toolbar.container).find('button, .ql-picker');

        $toolbarButtons.each((_, button) => {
            const $button = $(button);
            if ($button.hasClass('ql-bold')) {
                $button.attr('title', 'Bold (Ctrl+B)');
            } else if ($button.hasClass('ql-italic')) {
                $button.attr('title', 'Italic (Ctrl+I)');
            } else if ($button.hasClass('ql-list') && $button.attr('value') === 'ordered') {
                $button.attr('title', 'Ordered List');
            } else if ($button.hasClass('ql-list') && $button.attr('value') === 'bullet') {
                $button.attr('title', 'Bullet List');
            } else if ($button.hasClass('ql-clean')) {
                $button.attr('title', 'Remove Formatting from selected content');
            } else if ($button.hasClass('ql-emoji')) {
                $button.attr('title', 'Insert Emoji');
            } else if ($button.hasClass('ql-clear')) {
                $button.attr('title', 'Clear Editor');
            }
        });

        return quill;
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

    function checkFirstTimeUser() {
        const firstTimeUser = localStorage.getItem('firstTimeUser');
        if (!firstTimeUser) {
            $('div#instructions').addClass('open');
            alert('Welcome to Simple LinkedIn Composer! I hope you find this app useful. Please check the instructions to get started.');
            localStorage.setItem('firstTimeUser', 'false');
        }
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
        $('#linkedin-user-id').on('input', (e) => setLinkedInUserId(e)); // Set LinkedIn user ID on input change
        $('#sort-name').on('click', () => sortHashtagsByName());
        $('#sort-count').on('click', () => sortHashtagsByCount());

        // Snippets
        $('#clear-button').on('click', () => clearAllData());
        $('#save-button').on('click', () => saveSnippet());
        $('#export-data').on('click', () => exportSnippets());
        $('#import-data').on('click', () => importSnippets());
        $('#load-sample-button').on('click', () => loadSampleText());
        $(document).on('click', '.delete-snippet', (e) => deleteSnippet(e));
        $(document).on('click', '.snippet-link', function () {
            const title = $(this).data('key');
            const key = `${KEY_PREFIX}${title}`;
            loadSnippet(key);
        });

        // Clipboard
        $('#copy-button').on('click', async () => await copyToClipboard());

        // Editor
        $('emoji-picker').on('emoji-click', (e) => pickEmoji(e));
        $(document).on('click', (e) => hideEmojiPicker(e));
        $('#editor-container').on('copy', async () => await copyToClipboard());
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
        snippetManager = new SnippetManager();
        hashtagManager = new HashtagManager();
        quill = initializeQuill();

        // Fetch the stats on page load
        fetchGitHubStats();

        // Call the function to load the LinkedIn user ID on page load
        loadLinkedInUserId();

        // Set up the accordion behavior for expanding and collapsing the major sections
        accordionSetup();

        // Set up Snippets table for paging
        setupSnippetPaging();

        // Initialize the snippets list on page load. This also performs the initial sort by "Timestamp" in descending order.
        updateSnippetsList();

        // Update hashtags on page load
        updateHashtagCounts();

        // Set up the event listeners for various elements
        eventListenerSetup();

        checkFirstTimeUser();

        quill.focus();
    });
})();