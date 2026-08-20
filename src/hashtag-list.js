const LINKEDIN_HASHTAG_URL = "https://www.linkedin.com/feed/hashtag/?keywords=";

export const renderHashtagList = ({ container, hashtags, onInsert }) => {
  const document = container.ownerDocument;
  container.replaceChildren();

  const entries = Object.entries(hashtags);
  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Hashtags from saved snippets will appear here.";
    container.append(empty);
    return;
  }

  entries.forEach(([tag, count]) => {
    const item = document.createElement("div");
    item.className = "hashtag-item";

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-hashtag-button";
    addButton.textContent = "+";
    addButton.setAttribute("aria-label", `Add ${tag} to the editor`);
    addButton.title = "Add this hashtag to the editor";
    addButton.addEventListener("click", () => onInsert(tag));

    const link = document.createElement("a");
    link.className = "linkedin-icon-link";
    link.href = `${LINKEDIN_HASHTAG_URL}${encodeURIComponent(tag.substring(1))}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = "View this hashtag on LinkedIn";
    const icon = document.createElement("img");
    icon.src = "images/linkedin-icon.svg";
    icon.alt = "LinkedIn";
    icon.className = "linkedin-icon";
    link.append(icon);

    const label = document.createElement("span");
    label.textContent = `${tag} (${count})`;

    item.append(addButton, link, label);
    container.append(item);
  });
};
