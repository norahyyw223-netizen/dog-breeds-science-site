const sizeFilters = document.querySelector("#sizeFilters");
const cardsContainer = document.querySelector(".cards");
const breedCount = document.querySelector("#breedCount");

const openFeedbackButtons = document.querySelectorAll("[data-open-feedback]");
const closeFeedbackButton = document.querySelector("#closeFeedback");
const feedbackDialog = document.querySelector("#feedbackDialog");
const feedbackForm = document.querySelector("#feedbackForm");
const formStatus = document.querySelector("#formStatus");
const submitButton = feedbackForm?.querySelector("button[type='submit']");
const apiBaseUrl = (window.APP_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");

const ckuGroups = Array.isArray(window.CKU_GROUPS) ? window.CKU_GROUPS : [];
const ckuBreeds = Array.isArray(window.CKU_BREEDS) ? window.CKU_BREEDS : [];

const groupFeatureTitle = document.querySelector("#groupFeatureTitle");
const groupFeatureText = document.querySelector("#groupFeatureText");

const wikiCacheKey = "wiki_summary_cache_v1";
const wikiCache = new Map();
const wikiPending = new Set();
const wikiQueue = [];
let wikiActiveCount = 0;
const maxWikiConcurrency = 3;

const sizeMeta = {
  small: { label: "小型犬" },
  medium: { label: "中型犬" },
  large: { label: "大型犬" }
};

const commonBreedRank = {
  柯基犬: 1,
  贵宾犬: 2,
  博美犬: 3,
  吉娃娃犬: 4,
  比熊犬: 5,
  柴犬: 6,
  边境牧羊犬: 7,
  西伯利亚哈士奇: 8,
  比格犬: 9,
  金毛寻回犬: 10,
  拉布拉多寻回犬: 11,
  拉布拉多: 11,
  德国牧羊犬: 12,
  阿拉斯加雪橇犬: 13,
  罗威纳犬: 14,
  杜宾犬: 15,
  大丹犬: 16,
  伯恩山犬: 17,
  圣伯纳犬: 18,
  法国斗牛犬: 19,
  巴哥犬: 20
};

let currentFilter = "all";

try {
  const cached = JSON.parse(localStorage.getItem(wikiCacheKey) || "{}");
  Object.entries(cached).forEach(([k, v]) => wikiCache.set(k, v));
} catch (_error) {
  // ignore invalid cache
}

function persistWikiCache() {
  const obj = {};
  wikiCache.forEach((v, k) => {
    obj[k] = v;
  });
  try {
    localStorage.setItem(wikiCacheKey, JSON.stringify(obj));
  } catch (_error) {
    // ignore storage failure
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function iconByGroup(groupNo) {
  const icons = {
    "01": "🐑",
    "02": "🛡️",
    "03": "⚡",
    "04": "🌭",
    "05": "❄️",
    "06": "👃",
    "07": "🎯",
    "08": "💦",
    "09": "🏠",
    "10": "💨",
    "11": "🌐"
  };
  return icons[groupNo] || "🐾";
}

function groupIntroShort(groupNo) {
  const group = ckuGroups.find((g) => String(g.group_no) === String(groupNo));
  if (!group || !group.introduction) {
    return "该组强调稳定训练与科学社交。";
  }
  const text = String(group.introduction).replace(/\s+/g, " ").trim();
  const first = text.split(/[。.!?]/)[0];
  return first ? `${first}。` : text;
}

function classifySize(breed) {
  const text = `${breed.chineseName || ""} ${breed.englishName || ""} ${breed.alias || ""}`.toLowerCase();

  const smallKeywords = [
    "玩具", "迷你", "吉娃娃", "马尔济", "约克夏", "博美", "蝴蝶", "比熊", "西施", "巴哥", "北京犬", "狆", "toy", "miniature"
  ];
  const largeKeywords = [
    "大丹", "圣伯纳", "纽芬兰", "獒", "伯恩山", "阿拉斯加", "高加索", "中亚", "德国牧羊", "金毛", "拉布拉多", "杜宾", "罗威纳", "猎狼", "mastiff", "great dane", "newfoundland", "saint"
  ];

  if (smallKeywords.some((k) => text.includes(k.toLowerCase()))) {
    return "small";
  }
  if (largeKeywords.some((k) => text.includes(k.toLowerCase()))) {
    return "large";
  }

  const groupDefaults = {
    "01": "medium",
    "02": "large",
    "03": "small",
    "04": "small",
    "05": "medium",
    "06": "medium",
    "07": "medium",
    "08": "medium",
    "09": "small",
    "10": "large",
    "11": "medium"
  };

  return groupDefaults[String(breed.groupNo)] || "medium";
}

function breedSort(a, b) {
  const ra = commonBreedRank[a.chineseName] || 9999;
  const rb = commonBreedRank[b.chineseName] || 9999;
  if (ra !== rb) {
    return ra - rb;
  }
  return Number(a.typeNo) - Number(b.typeNo);
}

function getBreedsBySize(size) {
  return ckuBreeds
    .filter((breed) => classifySize(breed) === size)
    .sort(breedSort);
}

function renderSizeFeature(filter = "all") {
  if (!groupFeatureTitle || !groupFeatureText) {
    return;
  }

  const featureMap = {
    all: {
      title: "体型特点",
      text: "每个体型默认展示5个常见犬种，点击“更多”可进入二级页面查看全部。小型犬更适配紧凑空间；中型犬较均衡；大型犬对空间与训练投入要求更高。"
    },
    small: {
      title: "小型犬特点",
      text: "体型小、空间占用少，适合公寓；通常更需要稳定社交与情绪管理，避免过度敏感和吠叫。"
    },
    medium: {
      title: "中型犬特点",
      text: "体能和陪伴属性较均衡，适配面广；建议保持规律运动与基础服从训练，减少行为问题。"
    },
    large: {
      title: "大型犬特点",
      text: "力量和活动需求更高，对空间、牵引管理和关节健康要求更严格，需长期稳定训练。"
    }
  };

  const data = featureMap[filter] || featureMap.all;
  groupFeatureTitle.textContent = data.title;
  groupFeatureText.textContent = data.text;
}

function normalizeWikiText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\[[^\]]*\]/g, "")
    .trim();
}

async function fetchWikiSummaryByTitle(title) {
  if (!title) {
    return "";
  }

  const url = `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) {
    return "";
  }

  const data = await res.json();
  if (!data || !data.extract || data.type === "disambiguation") {
    return "";
  }

  return normalizeWikiText(data.extract);
}

async function fetchWikiSummaryBySearch(query) {
  if (!query) {
    return "";
  }

  const searchUrl = `https://zh.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=1&origin=*&srsearch=${encodeURIComponent(query)}`;
  const res = await fetch(searchUrl);
  if (!res.ok) {
    return "";
  }

  const data = await res.json();
  const title = data?.query?.search?.[0]?.title;
  if (!title) {
    return "";
  }

  return fetchWikiSummaryByTitle(title);
}

async function getWikiSummary(breed) {
  const cacheValue = wikiCache.get(breed.typeNo);
  if (cacheValue) {
    return cacheValue;
  }

  const candidates = [
    breed.chineseName,
    String(breed.chineseName || "").replace(/犬$/u, ""),
    breed.englishName
  ];

  let summary = "";
  for (const title of candidates) {
    summary = await fetchWikiSummaryByTitle(title);
    if (summary) {
      break;
    }
  }

  if (!summary) {
    summary = await fetchWikiSummaryBySearch(breed.chineseName || breed.englishName || "");
  }

  if (!summary) {
    summary = "维基百科暂无可用摘要。";
  }

  const clipped = summary.length > 110 ? `${summary.slice(0, 110)}...` : summary;
  wikiCache.set(breed.typeNo, clipped);
  persistWikiCache();
  return clipped;
}

function enqueueWikiTask(breed, node) {
  if (!node || wikiPending.has(breed.typeNo)) {
    return;
  }

  wikiPending.add(breed.typeNo);
  wikiQueue.push({ breed, node });
  runWikiQueue();
}

function runWikiQueue() {
  while (wikiActiveCount < maxWikiConcurrency && wikiQueue.length > 0) {
    const task = wikiQueue.shift();
    wikiActiveCount += 1;

    getWikiSummary(task.breed)
      .then((text) => {
        if (task.node && task.node.isConnected) {
          task.node.textContent = `维基百科：${text}`;
        }
      })
      .finally(() => {
        wikiPending.delete(task.breed.typeNo);
        wikiActiveCount -= 1;
        runWikiQueue();
      });
  }
}

function cardHtml(breed) {
  const alias = breed.alias ? `（别名：${escapeHtml(breed.alias)}）` : "";
  const intro = groupIntroShort(breed.groupNo);
  return `
    <article class="card" data-type-no="${escapeHtml(breed.typeNo)}">
      <div class="card__icon">${iconByGroup(breed.groupNo)}</div>
      <h3>${escapeHtml(breed.chineseName)}</h3>
      <p class="tag">CKU编号 ${escapeHtml(breed.typeNo)} · 第${escapeHtml(Number(breed.groupNo))}组</p>
      <p>${escapeHtml(breed.englishName)}${alias}</p>
      <p>段别：${escapeHtml(breed.sectionNameCn)}</p>
      <div class="breed-features">
        <p class="feature-item">组别特征：${escapeHtml(intro)}</p>
        <p class="feature-item">功能定位：${escapeHtml(breed.groupNameCn)} · ${escapeHtml(breed.sectionNameCn)}</p>
        <p class="feature-item wiki-snippet" data-type-no="${escapeHtml(breed.typeNo)}">维基百科：加载中...</p>
      </div>
    </article>
  `;
}

function renderBreedCards(filter = "all") {
  if (!cardsContainer) {
    return;
  }

  const sizesToRender = filter === "all" ? ["small", "medium", "large"] : [filter];
  let shownCount = 0;

  cardsContainer.innerHTML = sizesToRender
    .map((size) => {
      const fullList = getBreedsBySize(size);
      const list = fullList.slice(0, 5);
      shownCount += list.length;

      const moreButton =
        fullList.length > 5
          ? `<button class="more-btn" data-size="${size}" type="button">更多</button>`
          : "";

      return `
      <section class="breed-section" data-size="${size}">
        <div class="breed-section__head">
          <h3>${sizeMeta[size].label}（共 ${fullList.length} 种）</h3>
          ${moreButton}
        </div>
        <div class="cards-grid">
          ${list.map(cardHtml).join("")}
        </div>
      </section>
      `;
    })
    .join("");

  if (breedCount) {
    breedCount.textContent = String(shownCount);
  }

  cardsContainer.querySelectorAll(".more-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = btn.getAttribute("data-size");
      if (!sizeMeta[size]) {
        return;
      }
      window.location.href = `breeds.html?size=${encodeURIComponent(size)}`;
    });
  });

  cardsContainer.querySelectorAll(".wiki-snippet").forEach((node) => {
    const typeNo = node.getAttribute("data-type-no");
    const breed = ckuBreeds.find((item) => String(item.typeNo) === String(typeNo));
    if (!breed) {
      return;
    }

    const cached = wikiCache.get(breed.typeNo);
    if (cached) {
      node.textContent = `维基百科：${cached}`;
      return;
    }

    enqueueWikiTask(breed, node);
  });
}

renderBreedCards("all");
renderSizeFeature("all");

if (sizeFilters) {
  sizeFilters.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const filter = target.dataset.filter || "all";
    currentFilter = filter;
    sizeFilters.querySelectorAll("button").forEach((btn) => btn.classList.remove("is-active"));
    target.classList.add("is-active");

    renderBreedCards(filter);
    renderSizeFeature(filter);
  });
}

if (openFeedbackButtons.length > 0 && feedbackDialog) {
  openFeedbackButtons.forEach((button) => {
    button.addEventListener("click", () => {
      formStatus.textContent = "";
      formStatus.className = "form-status";
      feedbackDialog.showModal();
    });
  });
}

if (closeFeedbackButton && feedbackDialog) {
  closeFeedbackButton.addEventListener("click", () => {
    feedbackDialog.close();
  });
}

if (feedbackDialog) {
  feedbackDialog.addEventListener("click", (event) => {
    const rect = feedbackDialog.getBoundingClientRect();
    const inDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!inDialog) {
      feedbackDialog.close();
    }
  });
}

if (feedbackForm) {
  feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(feedbackForm);
    const payload = {
      nickname: String(formData.get("nickname") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      suggestion: String(formData.get("suggestion") || "").trim()
    };

    if (!payload.suggestion) {
      formStatus.textContent = "请填写建议内容。";
      formStatus.className = "form-status is-error";
      return;
    }

    submitButton.disabled = true;
    formStatus.textContent = "正在提交...";
    formStatus.className = "form-status";

    try {
      const response = await fetch(`${apiBaseUrl}/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("提交失败");
      }

      feedbackForm.reset();
      formStatus.textContent = "提交成功，感谢你的建议。";
      formStatus.className = "form-status is-success";
      setTimeout(() => feedbackDialog.close(), 700);
    } catch (_error) {
      formStatus.textContent = "提交失败，请稍后重试。";
      formStatus.className = "form-status is-error";
    } finally {
      submitButton.disabled = false;
    }
  });
}
