export const extractHashtags = (text) => text.match(/#\w+/g) || [];

export const countSnippetHashtags = (snippets) => {
  const counts = {};

  Object.values(snippets).forEach((snippet) => {
    snippet.delta.ops.forEach((operation) => {
      if (typeof operation.insert !== "string") {
        return;
      }

      extractHashtags(operation.insert).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
  });

  return counts;
};

export const sortHashtagsByCount = (hashtags, ascending = true) =>
  Object.entries(hashtags).sort(([tagA, countA], [tagB, countB]) => {
    if (countA === countB) {
      return tagA.localeCompare(tagB);
    }
    return ascending ? countA - countB : countB - countA;
  });

export const sortHashtagsByName = (hashtags, ascending = true) =>
  Object.entries(hashtags).sort(([tagA], [tagB]) =>
    ascending ? tagA.localeCompare(tagB) : tagB.localeCompare(tagA),
  );
