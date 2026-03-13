const pageRoot = document.querySelector("[data-size-page]");
const currentSize = pageRoot?.dataset.sizePage;

const subpageTitle = document.querySelector("#subpageTitle");
const subpageDesc = document.querySelector("#subpageDesc");
const subpageCards = document.querySelector("#subpageCards");

const ckuBreeds = Array.isArray(window.CKU_BREEDS) ? window.CKU_BREEDS : [];

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

try {
  const cached = JSON.parse(localStorage.getItem(wikiCacheKey) || "{}");
  Object.entries(cached).forEach(([k, v]) => wikiCache.set(k, v));
} catch (_error) {
  // ignore
}

function persistWikiCache() {
  const obj = {};
  wikiCache.forEach((v, k) => {
    obj[k] = v;
  });
  try {
    localStorage.setItem(wikiCacheKey, JSON.stringify(obj));
  } catch (_error) {
    // ignore
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

function classifySize(breed) {
  const text = `${breed.chineseName || ""} ${breed.englishName || ""} ${breed.alias || ""}`.toLowerCase();

  const smallKeywords = [
    "玩具", "迷你", "吉娃娃", "马尔济", "约克夏", "博美", "蝴蝶", "比熊", "西施", "巴哥", "北京犬", "狆", "toy", "miniature"
  ];
  const largeKeywords = [
    "大丹", "圣伯纳", "纽芬兰", "獒", "伯恩山", "阿拉斯加", "高加索", "中亚", "德国牧羊", "金毛", "拉布拉多", "杜宾", "罗威纳", "猎狼", "mastiff", "great dane", "newfoundland", "saint"
  ];

  if (smallKeywords.some((k) => text.includes(k.toLowerCase()))) return "small";
  if (largeKeywords.some((k) => text.includes(k.toLowerCase()))) return "large";

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
  if (ra !== rb) return ra - rb;
  return Number(a.typeNo) - Number(b.typeNo);
}

function normalizeWikiText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\[[^\]]*\]/g, "")
    .trim();
}

async function fetchWikiSummaryByTitle(title) {
  if (!title) return "";
  const url = `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) return "";
  const data = await res.json();
  if (!data || !data.extract || data.type === "disambiguation") return "";
  return normalizeWikiText(data.extract);
}

async function fetchWikiSummaryBySearch(query) {
  if (!query) return "";
  const searchUrl = `https://zh.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=1&origin=*&srsearch=${encodeURIComponent(query)}`;
  const res = await fetch(searchUrl);
  if (!res.ok) return "";
  const data = await res.json();
  const title = data?.query?.search?.[0]?.title;
  if (!title) return "";
  return fetchWikiSummaryByTitle(title);
}

async function getWikiSummary(breed) {
  const cached = wikiCache.get(breed.typeNo);
  if (cached) return cached;

  const candidates = [breed.chineseName, String(breed.chineseName || "").replace(/犬$/u, ""), breed.englishName];
  let summary = "";
  for (const t of candidates) {
    summary = await fetchWikiSummaryByTitle(t);
    if (summary) break;
  }
  if (!summary) {
    summary = await fetchWikiSummaryBySearch(breed.chineseName || breed.englishName || "");
  }
  if (!summary) summary = "暂无可用摘要。";

  const clipped = summary.length > 110 ? `${summary.slice(0, 110)}...` : summary;
  wikiCache.set(breed.typeNo, clipped);
  persistWikiCache();
  return clipped;
}

function enqueueWikiTask(breed, node) {
  if (!node || wikiPending.has(breed.typeNo)) return;
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
          task.node.textContent = `特征：${text}`;
        }
      })
      .finally(() => {
        wikiPending.delete(task.breed.typeNo);
        wikiActiveCount -= 1;
        runWikiQueue();
      });
  }
}

function render(size) {
  if (!sizeMeta[size]) {
    return;
  }

  const list = ckuBreeds.filter((b) => classifySize(b) === size).sort(breedSort);

  subpageTitle.textContent = `${sizeMeta[size].label}详情`;
  subpageDesc.textContent = `本页包含全部${sizeMeta[size].label}，共 ${list.length} 种（CKU标准）`;

  document.querySelectorAll("[data-link-size]").forEach((el) => {
    const active = el.getAttribute("data-link-size") === size;
    el.classList.toggle("is-active", active);
  });

  subpageCards.innerHTML = list
    .map((breed) => {
      const alias = breed.alias ? `（别名：${escapeHtml(breed.alias)}）` : "";
      return `
      <article class="card" data-type-no="${escapeHtml(breed.typeNo)}">
        <div class="card__icon">${iconByGroup(breed.groupNo)}</div>
        <h3>${escapeHtml(breed.chineseName)}</h3>
        <p class="tag">CKU编号 ${escapeHtml(breed.typeNo)} · 第${escapeHtml(Number(breed.groupNo))}组</p>
        <p>${escapeHtml(breed.englishName)}${alias}</p>
        <p>段别：${escapeHtml(breed.sectionNameCn)}</p>
        <div class="breed-features">
          <p class="feature-item wiki-snippet" data-type-no="${escapeHtml(breed.typeNo)}">特征：加载中...</p>
        </div>
      </article>
      `;
    })
    .join("");

  subpageCards.querySelectorAll(".wiki-snippet").forEach((node) => {
    const typeNo = node.getAttribute("data-type-no");
    const breed = list.find((item) => String(item.typeNo) === String(typeNo));
    if (!breed) return;
    const cached = wikiCache.get(breed.typeNo);
    if (cached) {
      node.textContent = `特征：${cached}`;
      return;
    }
    enqueueWikiTask(breed, node);
  });
}

render(currentSize || "small");
