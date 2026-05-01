/**
 * Linear 7-stage journey: switches main views and updates aria-current.
 */
export function initJourney() {
  const root = document.getElementById("election-journey");
  if (!root) return;

  root.querySelectorAll("[data-journey-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-journey-view");
      if (view && typeof window.__switchView === "function") {
        window.__switchView(view);
      }
      root.querySelectorAll(".journey__step").forEach((li) => {
        li.classList.remove("journey__step--current");
        const b = li.querySelector(".journey__btn");
        if (b) b.removeAttribute("aria-current");
      });
      const li = btn.closest(".journey__step");
      li?.classList.add("journey__step--current");
      btn.setAttribute("aria-current", "step");

      fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "journey_step", meta: { view } }),
      }).catch(() => {});
    });
  });
}
