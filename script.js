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

const ckuBreeds = Array.isArray(window.CKU_BREEDS) ? window.CKU_BREEDS : [];
const groupFeatureTitle = document.querySelector("#groupFeatureTitle");
const groupFeatureText = document.querySelector("#groupFeatureText");

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
  const text = `${breed.chineseName || ""} ${breed.englishName || ""} ${breed.alias || ""}`;

  const smallKeywords = [
    "玩具", "迷你", "吉娃娃", "马尔济", "约克夏", "博美", "蝴蝶", "比熊", "西施", "巴哥", "北京犬", "狆", "toy", "miniature"
  ];
  const largeKeywords = [
    "大丹", "圣伯纳", "纽芬兰", "獒", "伯恩山", "阿拉斯加", "高加索", "中亚", "德国牧羊", "金毛", "拉布拉多", "杜宾", "罗威纳", "猎狼", "mastiff", "great dane", "newfoundland", "saint"
  ];

  if (smallKeywords.some((k) => text.toLowerCase().includes(k.toLowerCase()))) {
    return "small";
  }
  if (largeKeywords.some((k) => text.toLowerCase().includes(k.toLowerCase()))) {
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

function renderSizeFeature(filter = "all") {
  if (!groupFeatureTitle || !groupFeatureText) {
    return;
  }

  const featureMap = {
    all: {
      title: "体型特点",
      text: "小型犬通常更适合紧凑居住空间；中型犬在体能与陪伴间更平衡；大型犬通常运动、空间和训练投入更高。"
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

function renderBreedCards(filter = "all") {
  if (!cardsContainer) {
    return;
  }

  const visible = ckuBreeds.filter((breed) => {
    const size = classifySize(breed);
    return filter === "all" || size === filter;
  });

  cardsContainer.innerHTML = visible
    .map((breed) => {
      const alias = breed.alias ? `（别名：${escapeHtml(breed.alias)}）` : "";
      return `
      <article class="card">
        <div class="card__icon">${iconByGroup(breed.groupNo)}</div>
        <h3>${escapeHtml(breed.chineseName)}</h3>
        <p class="tag">CKU编号 ${escapeHtml(breed.typeNo)} · 第${escapeHtml(Number(breed.groupNo))}组</p>
        <p>${escapeHtml(breed.englishName)}${alias}</p>
        <p>段别：${escapeHtml(breed.sectionNameCn)}</p>
      </article>
    `;
    })
    .join("");

  if (breedCount) {
    breedCount.textContent = String(visible.length);
  }
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
