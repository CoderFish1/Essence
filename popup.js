document.getElementById("summarize").addEventListener("click", async () => {
  const btn = document.getElementById("summarize")
  const result = document.getElementById("result");
  const summaryType = document.getElementById("summary-type").value;

  btn.disabled= true; // disabling summarize button while process 
  result.innerHTML = '<div class="loader"></div>';

  // get the user's api key
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      result.innerText = "No API key selected! Use the gear icon to add one.";
      btn.disabled = false;
      return;
    }

    // ask content.js for the page text
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_TEXT" },
        async ({ text } = {}) => {
          if (chrome.runtime.lastError) {
            result.innerText =
              "Couldn't reach this page. Try refreshing the tab.";
              btn.disabled = false;
            return;
          }

          if (!text) {
            result.innerText = "Couldn't extract text from this page!!";
            btn.disabled = false;
            return;
          }

          try {
            const summary = await getGeminiSummary(
              text,
              summaryType,
              geminiApiKey,
            );
            result.innerText = summary;
          } catch (error) {
            result.innerText = "Gemini error: " + error.message;
          }
          finally{
            btn.disabled = false;
          }
        },
      );
    });
  });
});

async function getGeminiSummary(rawText, type, apiKey) {
  const max = 20000;
  const text = rawText.length > max ? rawText.slice(0, max) + "..." : rawText;

  const promptMap = {
    concise: `Summarize in 2-3 sentences. Do not use markdown formatting (no asterisks, headers, or bullet symbols) — plain text only:\n\n${text}`,
    detailed: `Give a detailed summary. Do not use markdown formatting (no asterisks, headers, or bullet symbols) — plain text only:\n\n${text}`,
    bullets: `Summarize in 5-7 bullet points, each starting with "- " on its own line. Do not use any other markdown formatting (no asterisks, no bold, no headers):\n\n${text}`,
  };

  const maxTokensMap = {
    concise: 150,
    detailed: 800,
    bullets: 350,
  };

  const prompt = promptMap[type] || promptMap.concise;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: maxTokensMap[type] || maxTokensMap.concise,
        },
      }),
    },
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Request failed (${res.status})`,
    );
  }

  const data = await res.json();
  const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!summary) {
    throw new Error("No summary returned by Gemini");
  }

  return summary.trim();
}

// copying logic 
document.getElementById("copy-btn").addEventListener('click',()=>{
  const txt = document.getElementById("result").innerText;

  if(!txt) return;

  navigator.clipboard.writeText(txt).then(()=>{
    const btn = document.getElementById("copy-btn");
    const old  = btn.textContent;
    btn.textContent = "Copied !!!";

    setTimeout(() => {
      btn.textContent = old;
    }, 1200);
  })
})

// dark-light theme toggle logic
const themeBtn = document.getElementById("theme-toggle");
themeBtn.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
  themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});
