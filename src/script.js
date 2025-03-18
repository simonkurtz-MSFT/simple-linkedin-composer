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

quill.focus();