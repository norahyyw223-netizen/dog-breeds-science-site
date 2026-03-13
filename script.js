const filterButtons = document.querySelectorAll("[data-filter]");
const cards = document.querySelectorAll(".card");
const openFeedbackButtons = document.querySelectorAll("[data-open-feedback]");
const closeFeedbackButton = document.querySelector("#closeFeedback");
const feedbackDialog = document.querySelector("#feedbackDialog");
const feedbackForm = document.querySelector("#feedbackForm");
const formStatus = document.querySelector("#formStatus");
const submitButton = feedbackForm?.querySelector("button[type='submit']");
const apiBaseUrl = (window.APP_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { filter } = button.dataset;

    filterButtons.forEach((btn) => btn.classList.remove("is-active"));
    button.classList.add("is-active");

    cards.forEach((card) => {
      const matched = filter === "all" || card.dataset.size === filter;
      card.classList.toggle("is-hidden", !matched);
    });
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
    } catch (error) {
      formStatus.textContent = "提交失败，请稍后重试。";
      formStatus.className = "form-status is-error";
    } finally {
      submitButton.disabled = false;
    }
  });
}
