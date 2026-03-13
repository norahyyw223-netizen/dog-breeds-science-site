const suggestionsList = document.querySelector("#suggestionsList");
const suggestionsStatus = document.querySelector("#suggestionsStatus");
const refreshButton = document.querySelector("#refreshSuggestions");
const apiBaseUrl = (window.APP_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

function itemHtml(item) {
  const nickname = item.nickname ? escapeHtml(item.nickname) : "匿名用户";
  const sourcePath = item.sourcePath ? escapeHtml(item.sourcePath) : "未知页面";
  const suggestion = escapeHtml(item.suggestion || "");
  const createdAt = formatTime(item.created_at);

  return `
    <article class="suggestion-item">
      <div class="suggestion-item__meta">
        <strong>#${item.id}</strong>
        <span>${nickname}</span>
        <span>${createdAt}</span>
      </div>
      <p class="suggestion-item__content">${suggestion}</p>
      <p class="suggestion-item__source">来源：${sourcePath}</p>
    </article>
  `;
}

async function loadSuggestions() {
  if (!suggestionsList || !suggestionsStatus) {
    return;
  }

  suggestionsStatus.textContent = "加载中...";
  suggestionsStatus.className = "form-status";

  try {
    const response = await fetch(`${apiBaseUrl}/api/suggestions?limit=100`);
    if (!response.ok) {
      throw new Error("request failed");
    }

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    if (items.length === 0) {
      suggestionsList.innerHTML = "<p class='suggestions-empty'>还没有用户提交建议。</p>";
      suggestionsStatus.textContent = "暂无数据";
      return;
    }

    suggestionsList.innerHTML = items.map(itemHtml).join("");
    suggestionsStatus.textContent = `共 ${items.length} 条`;
  } catch (_error) {
    suggestionsList.innerHTML = "<p class='suggestions-empty'>加载失败，请稍后重试。</p>";
    suggestionsStatus.textContent = "加载失败";
    suggestionsStatus.className = "form-status is-error";
  }
}

if (refreshButton) {
  refreshButton.addEventListener("click", loadSuggestions);
}

loadSuggestions();
