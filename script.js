const filterButtons = document.querySelectorAll("[data-filter]");
const cards = document.querySelectorAll(".card");

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
