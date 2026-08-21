export const samplePost = {
  ops: [
    { insert: "😀 " },
    { attributes: { bold: true }, insert: "Hello!" },
    { insert: "\n\nI hope this very " },
    { attributes: { bold: true }, insert: "simple" },
    { insert: " " },
    { attributes: { italic: true }, insert: "LinkedIn post composer" },
    { insert: " is useful to you. It supports " },
    { attributes: { bold: true }, insert: "bold" },
    { insert: ", " },
    { attributes: { italic: true }, insert: "italic" },
    {
      insert:
        ", emojis 😁, and lists. The paragraph format and indentations are mostly preserved. You can also use hashtags.\n\n",
    },
    { attributes: { bold: true }, insert: "📝 " },
    { attributes: { italic: true, bold: true }, insert: "Instructions" },
    { insert: "\n\nCompose your post" },
    { attributes: { list: "ordered" }, insert: "\n" },
    { insert: 'Select "Copy for LinkedIn"' },
    { attributes: { list: "ordered" }, insert: "\n" },
    { insert: 'Select "Open LinkedIn"' },
    { attributes: { list: "ordered" }, insert: "\n" },
    { insert: "Paste into the textbox, then post it." },
    { attributes: { list: "ordered" }, insert: "\n" },
    { insert: "\n" },
    { attributes: { bold: true }, insert: "⚙️ " },
    { attributes: { italic: true, bold: true }, insert: "Features" },
    { insert: "\n\nI'm using Jason Chen's free rich-text editor, " },
    { attributes: { italic: true }, insert: "Quill" },
    { insert: ". Thank you for creating an awesome product, Jason!" },
    { attributes: { list: "bullet" }, insert: "\n" },
    { insert: "Emojis are supported via Nolan Lawson's " },
    { attributes: { italic: true }, insert: "emoji-picker" },
    {
      insert:
        " which even supports emoji search! Thank you for this cool module, Nolan!",
    },
    { attributes: { list: "bullet" }, insert: "\n" },
    {
      insert:
        "You can use local storage to save and load composed posts with full formatting. You can easily clear the list, too. This makes reusing snippets simpler.",
    },
    { attributes: { list: "bullet" }, insert: "\n" },
    {
      attributes: { bold: true },
      insert:
        "Composer content remains in local browser storage and is not included in anonymous site analytics. ",
    },
    { attributes: { list: "bullet" }, insert: "\n" },
    { insert: "Pressing Enter does " },
    { attributes: { italic: true }, insert: "not" },
    { insert: " save the post and make it live on LinkedIn. 🤣" },
    { attributes: { list: "bullet" }, insert: "\n" },
    {
      insert:
        " \nTry it out: \nhttps://linkedin-composer.simondoescloud.com\n\n🐛 ",
    },
    { attributes: { bold: true }, insert: "Bugs" },
    {
      insert:
        "\n\nI'm sure there are bugs and improvements to be made. If you can, please submit an issue on GitHub, and if you have it in you, I would be grateful for a PR. Thank you!\n\n#linkedin\n",
    },
  ],
};
