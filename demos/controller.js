window.appState = window.appState || {
  lookIndex: 1
};

window.displayConfig = window.displayConfig || {
  technique: null
};

const VALID_TECHNIQUES = [
  "center",
  "gaze-fixation",
  "frame-memory",
  "frame-relative",
  "world-space"
];

window.setDisplayTechnique = function (name) {
  if (!name) return;
  if (!VALID_TECHNIQUES.includes(name)) return;

  window.displayConfig.technique = name;

  const select = document.getElementById("techniqueSelect");
  if (select) select.value = name;

  updateDemoDisabledState();
};

function updateDemoDisabledState() {
  const overlay = document.getElementById("demo-disabled-overlay");
  const hasTechnique = !!window.displayConfig.technique;

  if (!overlay) return;

  if (hasTechnique) {
    overlay.classList.remove("is-visible");
  } else {
    overlay.classList.add("is-visible");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("techniqueSelect");

  if (select) {
    if (window.displayConfig.technique) {
      select.value = window.displayConfig.technique;
    } else {
      select.value = "";
    }

    select.addEventListener("change", (e) => {
      window.setDisplayTechnique(e.target.value);
    });
  }

  updateDemoDisabledState();
});