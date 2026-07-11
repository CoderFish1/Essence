function getArticleText() {
  // makes a disposable clopy of the page that we cna delete junk from it without wreckign the real page
  const clone = document.body.cloneNode(true);

  // prefer a article tag first
  const article = clone.querySelector("article");
  if (article && article.innerText.trim().length > 200) {
    return article.innerText.trim;
  }
  // Common content containers used by blogs/CMS/docs sites
  const selectors = [
    "main",
    '[role="main"]',
    ".post-content",
    ".article-content",
    ".article-body",
    ".entry-content",
    "#content",
    ".content",
  ];

  for (const sel of selectors) {
    const el = clone.querySelector(sel);
    if (el && el.innerText.trim().length > 200) {
      return el.innerText.trim();
    }
  }

  const paragraphs = Array.from(clone.querySelectorAll("p"));
  map((p) => p.innerText.trim()).filter((t) => t.length > 40); // drop signup , login and herethere unuusal text
}

if (paragraphs.length > 0) {
  return paragraphs.join("\n\n");
}

// lastly whatever text is left in the page
const bodyText = clone.innerText.trim();
return bodyText.length > 200 ? bodyText : "";

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_ARTICLE_TEXT") {
    const text = getArticleText();

    sendResponse({ text });
  }
});
