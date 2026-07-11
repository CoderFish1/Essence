function getArticleText() {
  // makes a disposable copy of the page so we can delete junk
  // from it without wrecking the real page
  const clone = document.body.cloneNode(true);

  // strip elements that are never real content
  clone
    .querySelectorAll(
      "script, style, nav, footer, header, aside, iframe, noscript, form",
    )
    .forEach((el) => el.remove());

  // prefer an <article> tag first
  const article = clone.querySelector("article");
  if (article && article.innerText.trim().length > 200) {
    return article.innerText.trim();
  }

  // common content containers used by blogs/CMS/docs sites
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

  // fallback: all <p> tags, dropping short/nav-like fragments
  const paragraphs = Array.from(clone.querySelectorAll("p"))
    .map((p) => p.innerText.trim())
    .filter((t) => t.length > 40);

  if (paragraphs.length > 0) {
    return paragraphs.join("\n\n");
  }

  // last resort: whatever text is left in the page
  const bodyText = clone.innerText.trim();
  return bodyText.length > 200 ? bodyText : "";
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_ARTICLE_TEXT") {
    const text = getArticleText();
    sendResponse({ text });
  }
});
