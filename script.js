const filterButtons = document.querySelectorAll("[data-filter]");
const cardsContainer = document.querySelector(".cards");
const breedCount = document.querySelector("#breedCount");

const openFeedbackButtons = document.querySelectorAll("[data-open-feedback]");
const closeFeedbackButton = document.querySelector("#closeFeedback");
const feedbackDialog = document.querySelector("#feedbackDialog");
const feedbackForm = document.querySelector("#feedbackForm");
const formStatus = document.querySelector("#formStatus");
const submitButton = feedbackForm?.querySelector("button[type='submit']");
const apiBaseUrl = (window.APP_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");

const breedCatalog = [
  { name: "柯基犬", size: "small", tag: "活泼", desc: "腿短但精力旺盛，喜欢互动游戏，需控制体重保护脊椎。" },
  { name: "贵宾犬", size: "small", tag: "聪明", desc: "学习能力强，掉毛相对少，适合重视训练和护理的家庭。" },
  { name: "吉娃娃", size: "small", tag: "警觉", desc: "体型小但自信，怕冷，社交与防护训练都很重要。" },
  { name: "博美犬", size: "small", tag: "外向", desc: "毛量丰富，互动欲望高，需规律梳毛与口腔护理。" },
  { name: "马尔济斯", size: "small", tag: "温和", desc: "亲人黏人，适合室内陪伴，眼周和被毛护理要细致。" },
  { name: "比熊犬", size: "small", tag: "开朗", desc: "性格友好，泪痕与毛发打理是长期重点。" },
  { name: "约克夏梗", size: "small", tag: "机灵", desc: "体型轻巧，精力不低，需稳定规则减少吠叫。" },
  { name: "腊肠犬", size: "small", tag: "勇敢", desc: "背长腿短，避免频繁跳高跳低，防止腰椎受压。" },
  { name: "巴哥犬", size: "small", tag: "憨厚", desc: "短鼻犬种，夏季注意散热，避免剧烈高温运动。" },
  { name: "法国斗牛犬", size: "small", tag: "友善", desc: "陪伴性强，呼吸道护理和体重管理尤为关键。" },
  { name: "西施犬", size: "small", tag: "亲人", desc: "适合家庭陪伴，需长期毛发护理和耳部清洁。" },
  { name: "北京犬", size: "small", tag: "独立", desc: "对陌生环境较谨慎，规律社交可提升稳定性。" },
  { name: "骑士查理王小猎犬", size: "small", tag: "温顺", desc: "对人友好，适合新手家庭，需关注心脏健康。" },
  { name: "迷你雪纳瑞", size: "small", tag: "警惕", desc: "聪明好训练，需稳定边界感与胡须口周清洁。" },
  { name: "日本尖嘴犬", size: "small", tag: "敏捷", desc: "精力充沛，需日常散步和脑力互动防无聊。" },
  { name: "迷你杜宾", size: "small", tag: "大胆", desc: "反应快且警觉，早期社会化可降低紧张行为。" },
  { name: "蝴蝶犬", size: "small", tag: "聪颖", desc: "服从性好，适合技巧训练和日常互动游戏。" },
  { name: "哈瓦那犬", size: "small", tag: "粘人", desc: "伴侣属性强，独处训练有助减少分离焦虑。" },
  { name: "玩具贵宾", size: "small", tag: "灵活", desc: "体型更小，骨骼较脆，互动时要避免粗暴拉扯。" },
  { name: "波士顿梗", size: "small", tag: "友好", desc: "对家庭成员友善，需控制体重和注意眼部保护。" },

  { name: "柴犬", size: "medium", tag: "独立", desc: "警觉性高，个性自主，社交训练不足时可能固执。" },
  { name: "边境牧羊犬", size: "medium", tag: "工作型", desc: "智商高，需大量脑力和体能消耗，不适合长期闲置。" },
  { name: "西伯利亚哈士奇", size: "medium", tag: "耐力强", desc: "运动需求高，掉毛季明显，需充足活动与梳毛。" },
  { name: "澳大利亚牧羊犬", size: "medium", tag: "执行力", desc: "学习速度快，适合规律训练和户外活动家庭。" },
  { name: "英国可卡犬", size: "medium", tag: "活力", desc: "运动和互动需求高，耳道护理需长期坚持。" },
  { name: "美国可卡犬", size: "medium", tag: "亲和", desc: "性格友好，需定期修剪与眼耳皮肤清洁。" },
  { name: "史宾格犬", size: "medium", tag: "外向", desc: "精力充沛，建议搭配嗅闻训练和服从训练。" },
  { name: "比格犬", size: "medium", tag: "嗅觉型", desc: "对气味敏感，外出需牵引管理，防止追踪走失。" },
  { name: "牛头梗", size: "medium", tag: "坚韧", desc: "体能与意志都强，需明确规则与持续训练。" },
  { name: "松狮犬", size: "medium", tag: "沉稳", desc: "相对独立，需早期社交和皮肤毛发管理。" },
  { name: "沙皮犬", size: "medium", tag: "安静", desc: "褶皱护理很关键，保持干燥可降低皮肤问题。" },
  { name: "惠比特犬", size: "medium", tag: "敏捷", desc: "短跑能力强，室内安静，外出需安全牵引。" },
  { name: "巴仙吉犬", size: "medium", tag: "独特", desc: "相对少吠叫，独立性强，训练需耐心和一致性。" },
  { name: "布列塔尼犬", size: "medium", tag: "运动型", desc: "需要大量活动，适合经常户外的家庭。" },
  { name: "标准雪纳瑞", size: "medium", tag: "机警", desc: "看家能力好，需早期建立礼貌社交习惯。" },
  { name: "葡萄牙水犬", size: "medium", tag: "擅水", desc: "体能高，喜欢任务型活动和陪伴互动。" },
  { name: "芬兰狐狸犬", size: "medium", tag: "活跃", desc: "精神需求高，建议搭配规律训练和探索活动。" },
  { name: "挪威猎鹿犬", size: "medium", tag: "耐寒", desc: "对环境变化适应力强，需中高强度运动。" },
  { name: "凯利蓝梗", size: "medium", tag: "警惕", desc: "学习能力好，需稳定边界和社交引导。" },
  { name: "贝灵顿梗", size: "medium", tag: "温顺", desc: "外观柔和但精力不错，适合家庭互动。" },

  { name: "金毛寻回犬", size: "large", tag: "亲人", desc: "情绪稳定，陪伴属性强，需关注关节发育和体重。" },
  { name: "拉布拉多", size: "large", tag: "友善", desc: "服从性强，食欲旺，需严格控制零食和总热量。" },
  { name: "德国牧羊犬", size: "large", tag: "忠诚", desc: "工作欲强，需规律训练和充分活动消耗。" },
  { name: "阿拉斯加犬", size: "large", tag: "耐力", desc: "体型大、活动量高，需较大空间和稳定运动。" },
  { name: "罗威纳犬", size: "large", tag: "自信", desc: "需高质量社会化和明确管理，适合有经验家庭。" },
  { name: "杜宾犬", size: "large", tag: "敏捷", desc: "反应快且忠诚，训练一致性和运动很关键。" },
  { name: "伯恩山犬", size: "large", tag: "温厚", desc: "性格稳重，需关注关节与高温季节散热。" },
  { name: "大丹犬", size: "large", tag: "高大", desc: "体型巨大但性格温和，居住空间和关节管理重要。" },
  { name: "圣伯纳犬", size: "large", tag: "沉稳", desc: "耐寒性好，毛量多，需加强梳理和环境管理。" },
  { name: "纽芬兰犬", size: "large", tag: "温柔", desc: "亲水性强，体重管理与皮肤干燥护理不可忽视。" },
  { name: "大白熊犬", size: "large", tag: "守护", desc: "警戒本能强，需从小建立稳定社交经验。" },
  { name: "秋田犬", size: "large", tag: "独立", desc: "自我意识强，训练要坚定且避免粗暴方式。" },
  { name: "巨型雪纳瑞", size: "large", tag: "工作型", desc: "精力与执行力都高，适合训练投入较多家庭。" },
  { name: "威玛猎犬", size: "large", tag: "运动型", desc: "速度快耐力好，需要高强度活动与陪伴。" },
  { name: "爱尔兰雪达犬", size: "large", tag: "热情", desc: "外向活跃，适合有充足户外时间的家庭。" },
  { name: "阿富汗猎犬", size: "large", tag: "优雅", desc: "被毛护理投入大，训练需耐心和正向反馈。" },
  { name: "灵缇犬", size: "large", tag: "速度型", desc: "短时爆发力强，日常环境下通常安静温和。" },
  { name: "苏俄猎狼犬", size: "large", tag: "安静", desc: "体型修长，需安全场地与规律运动。" },
  { name: "卡斯罗犬", size: "large", tag: "护卫", desc: "警惕性高，需专业训练和稳定管理。" },
  { name: "安纳托利亚牧羊犬", size: "large", tag: "守护", desc: "独立且警戒，适合有经验和空间的饲养环境。" }
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function iconBySize(size) {
  if (size === "small") return "🐕";
  if (size === "medium") return "🦮";
  return "🐕‍🦺";
}

function sizeLabel(size) {
  if (size === "small") return "小型犬";
  if (size === "medium") return "中型犬";
  return "大型犬";
}

function renderBreedCards(filter = "all") {
  if (!cardsContainer) {
    return;
  }

  const visible = breedCatalog.filter((breed) => filter === "all" || breed.size === filter);

  cardsContainer.innerHTML = visible
    .map(
      (breed) => `
      <article class="card" data-size="${escapeHtml(breed.size)}">
        <div class="card__icon">${iconBySize(breed.size)}</div>
        <h3>${escapeHtml(breed.name)}</h3>
        <p class="tag">${sizeLabel(breed.size)} · ${escapeHtml(breed.tag)}</p>
        <p>${escapeHtml(breed.desc)}</p>
      </article>
    `
    )
    .join("");

  if (breedCount) {
    breedCount.textContent = String(visible.length);
  }
}

renderBreedCards("all");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { filter } = button.dataset;

    filterButtons.forEach((btn) => btn.classList.remove("is-active"));
    button.classList.add("is-active");

    renderBreedCards(filter || "all");
  });
});

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
