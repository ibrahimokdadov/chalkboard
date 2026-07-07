const targetUrl = document.querySelector("#targetUrl");
const viewportMode = document.querySelector("#viewportMode");
const modelInput = document.querySelector("#model");
const apiKeyInput = document.querySelector("#apiKey");
const reviewGoal = document.querySelector("#reviewGoal");
const revampPrompt = document.querySelector("#revampPrompt");
const captureButton = document.querySelector("#captureButton");
const reviewButton = document.querySelector("#reviewButton");
const revampButton = document.querySelector("#revampButton");
const copyRevamp = document.querySelector("#copyRevamp");
const reviewStation = document.querySelector("#reviewStation");
const revampStation = document.querySelector("#revampStation");
const captureStatus = document.querySelector("#captureStatus");
const reviewStatus = document.querySelector("#reviewStatus");
const revampStatus = document.querySelector("#revampStatus");
const pageTitle = document.querySelector("#pageTitle");
const screenshotImage = document.querySelector("#screenshotImage");
const originalPreview = document.querySelector("#originalPreview");
const shotFrame = document.querySelector("#shotFrame");
const highlightLayer = document.querySelector("#highlightLayer");
const issueList = document.querySelector("#issueList");
const issueCount = document.querySelector("#issueCount");
const originalLabel = document.querySelector("#originalLabel");
const revampPreview = document.querySelector("#revampPreview");
const tabs = document.querySelectorAll(".mode-tab");
const panels = {
  reviewPanel: document.querySelector("#reviewPanel"),
  revampPanel: document.querySelector("#revampPanel"),
};

let currentCapture = null;
let currentRevampHtml = "";
let currentIssues = [];

function setToolsUnlocked(isUnlocked) {
  reviewButton.disabled = !isUnlocked;
  revampButton.disabled = !isUnlocked;
  reviewStation.classList.toggle("locked-station", !isUnlocked);
  revampStation.classList.toggle("locked-station", !isUnlocked);
  reviewStation.classList.toggle("unlocked-station", isUnlocked);
  revampStation.classList.toggle("unlocked-station", isUnlocked);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setBusy(button, busy, label) {
  button.disabled = busy;
  button.innerHTML = busy ? label : button.dataset.defaultLabel;
}

function setupButtonLabels() {
  [captureButton, reviewButton, revampButton].forEach((button) => {
    button.dataset.defaultLabel = button.innerHTML;
  });
}

function getBasePayload() {
  return {
    url: targetUrl.value.trim(),
    viewport: viewportMode.value,
    model: modelInput.value.trim() || "gpt-5.5",
    apiKey: apiKeyInput.value.trim(),
  };
}

async function postJson(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function renderCapture(capture) {
  currentCapture = capture;
  currentIssues = [];
  const src = `data:image/png;base64,${capture.screenshot}`;
  screenshotImage.src = src;
  originalPreview.src = src;
  shotFrame.classList.remove("empty");
  shotFrame.classList.add("has-image");
  pageTitle.textContent = capture.title || capture.url;
  originalLabel.textContent = `${capture.viewport.width} x ${capture.viewport.height}`;
  highlightLayer.innerHTML = "";
  issueList.innerHTML = "<p class=\"empty-note\">Run an AI review to highlight specific UI issues.</p>";
  issueCount.textContent = "0 issues";
  setToolsUnlocked(true);
}

function normalizeIssues(issues) {
  return Array.isArray(issues)
    ? issues.map((issue, index) => ({
        id: issue.id || `issue-${index + 1}`,
        title: issue.title || "UI issue",
        severity: issue.severity || "Medium",
        category: issue.category || "UI",
        x: Number(issue.x) || 0,
        y: Number(issue.y) || 0,
        width: Number(issue.width) || 120,
        height: Number(issue.height) || 80,
        why: issue.why || issue.explanation || "No explanation returned.",
        fix: issue.fix || issue.suggestedFix || "No suggested fix returned.",
      }))
    : [];
}

function renderIssues(rawIssues) {
  if (!currentCapture) return;
  const issues = normalizeIssues(rawIssues);
  currentIssues = issues;
  issueCount.textContent = `${issues.length} ${issues.length === 1 ? "issue" : "issues"}`;

  const scaleX = screenshotImage.clientWidth / currentCapture.viewport.width;
  const scaleY = screenshotImage.clientHeight / currentCapture.viewport.height;

  highlightLayer.innerHTML = issues
    .map((issue, index) => {
      const left = Math.max(0, issue.x * scaleX);
      const top = Math.max(0, issue.y * scaleY);
      const width = Math.max(24, issue.width * scaleX);
      const height = Math.max(24, issue.height * scaleY);
      return `
        <div
          class="highlight-box"
          data-index="${index + 1}"
          style="left:${left}px; top:${top}px; width:${width}px; height:${height}px"
        ></div>
      `;
    })
    .join("");

  issueList.innerHTML = issues.length
    ? issues
        .map(
          (issue, index) => `
            <article class="issue-card">
              <div class="issue-meta">
                <span>#${index + 1}</span>
                <span>${escapeHtml(issue.severity)}</span>
                <span>${escapeHtml(issue.category)}</span>
              </div>
              <h4>${escapeHtml(issue.title)}</h4>
              <p>${escapeHtml(issue.why)}</p>
              <p><strong>Fix:</strong> ${escapeHtml(issue.fix)}</p>
            </article>
          `,
        )
        .join("")
    : "<p class=\"empty-note\">No issues returned.</p>";
}

async function captureScreen() {
  const payload = getBasePayload();
  if (!payload.url) {
    captureStatus.textContent = "Enter a URL first.";
    return;
  }

  setBusy(captureButton, true, "Capturing");
  captureStatus.textContent = "Opening page and taking screenshot...";

  try {
    const capture = await postJson("/api/capture", payload);
    renderCapture(capture);
    captureStatus.textContent = "Screenshot captured. Review and Revamp are unlocked.";
  } catch (error) {
    captureStatus.textContent = error.message;
  } finally {
    setBusy(captureButton, false);
  }
}

async function reviewUi() {
  const payload = getBasePayload();
  if (!payload.apiKey) {
    reviewStatus.textContent = "Add your OpenAI API key to run visual review.";
    return;
  }

  setBusy(reviewButton, true, "Reviewing");
  reviewStatus.textContent = "Asking AI to inspect screenshot...";

  try {
    const result = await postJson("/api/review-ui", {
      ...payload,
      goal: reviewGoal.value.trim(),
      capture: currentCapture,
    });
    currentCapture = result.capture;
    renderCapture(result.capture);
    screenshotImage.onload = () => renderIssues(result.issues);
    if (screenshotImage.complete) renderIssues(result.issues);
    reviewStatus.textContent = `Review complete. ${result.issues?.length || 0} issues highlighted.`;
  } catch (error) {
    reviewStatus.textContent = error.message;
  } finally {
    setBusy(reviewButton, false);
  }
}

async function revampUi() {
  const payload = getBasePayload();
  if (!payload.apiKey) {
    revampStatus.textContent = "Add your OpenAI API key to generate a revamp.";
    return;
  }

  setBusy(revampButton, true, "Generating");
  revampStatus.textContent = "Generating redesign preview...";

  try {
    const result = await postJson("/api/revamp-ui", {
      ...payload,
      prompt: revampPrompt.value.trim(),
      capture: currentCapture,
    });
    currentCapture = result.capture;
    renderCapture(result.capture);
    currentRevampHtml = result.html;
    revampPreview.srcdoc = result.html;
    revampStatus.textContent = "Revamp preview ready.";
    switchPanel("revampPanel");
  } catch (error) {
    revampStatus.textContent = error.message;
  } finally {
    setBusy(revampButton, false);
  }
}

async function copyRevampHtml() {
  if (!currentRevampHtml) return;
  await navigator.clipboard.writeText(currentRevampHtml);
  copyRevamp.textContent = "Copied";
  setTimeout(() => {
    copyRevamp.textContent = "Copy HTML";
  }, 1200);
}

function switchPanel(panelId) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.panel === panelId));
  Object.entries(panels).forEach(([id, panel]) => panel.classList.toggle("active", id === panelId));
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchPanel(tab.dataset.panel));
});

captureButton.addEventListener("click", captureScreen);
reviewButton.addEventListener("click", reviewUi);
revampButton.addEventListener("click", revampUi);
copyRevamp.addEventListener("click", copyRevampHtml);
window.addEventListener("resize", () => {
  if (currentCapture && currentIssues.length) renderIssues(currentIssues);
});

setupButtonLabels();
setToolsUnlocked(false);
