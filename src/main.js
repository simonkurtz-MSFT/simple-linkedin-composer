import $ from "jquery";
import Quill from "quill";
import toastr from "toastr";
import emojiDataUrl from "emoji-picker-element-data/en/emojibase/data.json?url";
import "datatables.net-dt";
import "emoji-picker-element";
import "datatables.net-dt/css/jquery.dataTables.css";
import "quill/dist/quill.snow.css";
import "toastr/build/toastr.min.css";
import "./style.css";

window.$ = $;
window.jQuery = $;
window.Quill = Quill;
window.toastr = toastr;

document.querySelector("emoji-picker").dataSource = emojiDataUrl;

await import("./script.js");
