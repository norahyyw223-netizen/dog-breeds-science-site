const groupFilters = document.querySelector("#groupFilters");
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

const groupShortNameMap = {
  "01": "牧羊犬",
  "02": "宾莎/雪纳瑞/獒犬",
  "03": "梗犬",
  "04": "腊肠犬",
  "05": "尖嘴犬和原始犬种",
  "06": "嗅觉猎犬",
  "07": "指示猎犬",
  "08": "寻猎/搜寻/水猎犬",
  "09": "伴侣犬和玩具犬",
  "10": "灵缇犬",
  "11": "非FCI犬种"
};

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

function buildGroupFilters() {
  if (!groupFilters) {
    return;
  }

  const buttons = ckuGroups
    .map((group) => {
      const groupNo = String(group.group_no || "");
      const shortName = groupShortNameMap[groupNo] || group.chinese_group_name || `第${groupNo}组`;
      return `<button data-filter="${escapeHtml(groupNo)}">${escapeHtml(shortName)}</button>`;
    })
    .join("");

  groupFilters.innerHTML = `<button class="is-active" data-filter="all">全部组别</button>${buttons}`;
}

function renderGroupFeature(filter = "all") {
  if (!groupFeatureTitle || !groupFeatureText) {
    return;
  }

  if (filter === "all") {
    groupFeatureTitle.textContent = "CKU 分组特点";
    groupFeatureText.textContent =
      "CKU 将犬种按用途、体型、历史功能等标准分为 11 组。选择上方分组后可查看该组犬种的主要行为与功能特征。";
    return;
  }

  const group = ckuGroups.find((item) => String(item.group_no) === filter);
  if (!group) {
    groupFeatureTitle.textContent = "组别特点";
    groupFeatureText.textContent = "未找到该分组说明。";
    return;
  }

  const shortName = groupShortNameMap[String(group.group_no)] || group.chinese_group_name;
  groupFeatureTitle.textContent = `${shortName}（第${Number(group.group_no)}组）`;
  groupFeatureText.textContent = group.introduction || "该分组暂无详细说明。";
}

function renderBreedCards(filter = "all") {
  if (!cardsContainer) {
    return;
  }

  const visible = ckuBreeds.filter((breed) => filter === "all" || String(breed.groupNo) === filter);

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

buildGroupFilters();
renderBreedCards("all");
renderGroupFeature("all");

if (groupFilters) {
  groupFilters.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const filter = target.dataset.filter || "all";
    groupFilters.querySelectorAll("button").forEach((btn) => btn.classList.remove("is-active"));
    target.classList.add("is-active");
    renderBreedCards(filter);
    renderGroupFeature(filter);
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
