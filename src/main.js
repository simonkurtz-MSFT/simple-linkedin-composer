import emojiDataUrl from "emoji-picker-element-data/en/emojibase/data.json?url";
import "emoji-picker-element";
import "quill/dist/quill.snow.css";
import "./style.css";

document.querySelector("emoji-picker").dataSource = emojiDataUrl;

await import("./app.js");
