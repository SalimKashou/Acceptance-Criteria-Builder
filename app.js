document.addEventListener("DOMContentLoaded", () => {
  const lightBtn = document.getElementById("lightBtn");
  const darkBtn = document.getElementById("darkBtn");

  const storyEl = document.getElementById("story");
  const contextEl = document.getElementById("context");

  const attachmentsEl = document.getElementById("attachments");
  const linkUrlEl = document.getElementById("linkUrl");
  const addLinkBtn = document.getElementById("addLinkBtn");

  const attachmentListEl = document.getElementById("attachmentList");
  const attachMetaEl = document.getElementById("attachMeta");
  const clearAttachmentsBtn = document.getElementById("clearAttachmentsBtn");

  const modeEl = document.getElementById("mode");
  const modeHintEl = document.getElementById("modeHint");

  const dOutline = document.getElementById("dOutline");
  const dLean = document.getElementById("dLean");
  const dBalanced = document.getElementById("dBalanced");
  const dExhaustive = document.getElementById("dExhaustive");
  const detailHintEl = document.getElementById("detailHint");

  const fSimple = document.getElementById("fSimple");
  const fGherkin = document.getElementById("fGherkin");
  const formatHintEl = document.getElementById("formatHint");

  const chkValidation = document.getElementById("chkValidation");
  const chkPermissions = document.getElementById("chkPermissions");
  const chkAudit = document.getElementById("chkAudit");
  const chkPerformance = document.getElementById("chkPerformance");
  const chkAccessibility = document.getElementById("chkAccessibility");
  const chkAnalytics = document.getElementById("chkAnalytics");

  const copyPromptBtn = document.getElementById("copyPromptBtn");
  const clearBtn = document.getElementById("clearBtn");
  const promptToast = document.getElementById("promptToast");

  const card2 = document.getElementById("card2");
  const card3 = document.getElementById("card3");
  const card4 = document.getElementById("card4");

  const s1 = document.getElementById("s1");
  const s2 = document.getElementById("s2");
  const s3 = document.getElementById("s3");

  let attachments = [];

  // Default: Lean
  let detailLevel = "lean"; // 'outline' | 'lean' | 'balanced' | 'exhaustive'
  let formatStyle = "simple"; // 'simple' | 'gherkin'

  const THEME_KEY = "ac_builder_theme";

  function setPressed(theme){
    const isDark = theme === "dark";
    lightBtn.setAttribute("aria-pressed", String(!isDark));
    darkBtn.setAttribute("aria-pressed", String(isDark));
  }

  function applyTheme(theme){
    document.documentElement.setAttribute("data-theme", theme);
    setPressed(theme);
  }

  applyTheme(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
  lightBtn.addEventListener("click", () => { localStorage.setItem(THEME_KEY, "light"); applyTheme("light"); });
  darkBtn.addEventListener("click", () => { localStorage.setItem(THEME_KEY, "dark"); applyTheme("dark"); });

  function toast(msg, isError=false){
    promptToast.textContent = msg;
    promptToast.style.color = isError ? "var(--danger)" : "var(--muted)";
  }

  function humanFileSize(bytes){
    const units = ["B","KB","MB","GB"];
    let i=0, num=bytes;
    while(num>=1024 && i<units.length-1){ num/=1024; i++; }
    return `${num.toFixed(num >= 10 || i===0 ? 0 : 1)} ${units[i]}`;
  }

  function getFocusAreas(){
    const areas = [];
    if (chkValidation.checked) areas.push("Validation & errors");
    if (chkPermissions.checked) areas.push("Permissions & roles");
    if (chkAudit.checked) areas.push("Audit/logging");
    if (chkPerformance.checked) areas.push("Performance");
    if (chkAccessibility.checked) areas.push("Accessibility");
    if (chkAnalytics.checked) areas.push("Analytics/Tracking");
    return areas;
  }

  function isProbablyUrl(s){
    try { new URL(s); return true; } catch { return false; }
  }

  function makeFileId(f){
    return `file__${f.name}__${f.size}__${f.lastModified || 0}`;
  }

  function makeLinkId(url){
    return `link__${url}`;
  }

  function modeHint(){
    modeHintEl.textContent = (modeEl.value === "user")
      ? "User Oriented: generates AC for the user story."
      : "Tech Stack Focused: generates AC grouped by FE/BE/API/DB/etc. (multiple sets).";
  }

  function setDetail(level){
    detailLevel = level;

    dOutline.setAttribute("aria-pressed", String(level === "outline"));
    dLean.setAttribute("aria-pressed", String(level === "lean"));
    dBalanced.setAttribute("aria-pressed", String(level === "balanced"));
    dExhaustive.setAttribute("aria-pressed", String(level === "exhaustive"));

    if (level === "outline"){
      detailHintEl.textContent = "Outline: ultra-high-level bullets (4–6). PM scaffold to refine later.";
    } else if (level === "lean"){
      detailHintEl.textContent = "Lean (default): concise and actionable (6–9). Core outcomes + critical validations.";
    } else if (level === "balanced"){
      detailHintEl.textContent = "Balanced: fuller coverage (10–14). Happy path + key validations + select edge cases.";
    } else {
      detailHintEl.textContent = "Exhaustive: comprehensive coverage. Deep edge cases, failures, and non-functional requirements.";
    }
  }

  function setFormat(style){
    formatStyle = style;
    fSimple.setAttribute("aria-pressed", String(style === "simple"));
    fGherkin.setAttribute("aria-pressed", String(style === "gherkin"));

    formatHintEl.textContent = (style === "simple")
      ? "Simple: straightforward testable bullets (default)."
      : "Gherkin: Given/When/Then style bullets (BDD).";
  }

  function removeAttachment(id){
    const idx = attachments.findIndex(a => a.id === id);
    if (idx === -1) return;

    const a = attachments[idx];
    if (a.objectUrl) URL.revokeObjectURL(a.objectUrl);

    attachments.splice(idx, 1);
    renderAttachments();
  }

  function clearAllAttachments(){
    for (const a of attachments){
      if (a.objectUrl) URL.revokeObjectURL(a.objectUrl);
    }
    attachments = [];
    attachmentsEl.value = "";
    renderAttachments();
  }

  function renderAttachments(){
    attachmentListEl.innerHTML = "";

    if (attachments.length === 0){
      attachMetaEl.textContent = "No attachments added (optional).";
      clearAttachmentsBtn.disabled = true;
      return;
    }

    clearAttachmentsBtn.disabled = false;

    const fileCount = attachments.filter(a => a.kind === "file").length;
    const linkCount = attachments.filter(a => a.kind === "link").length;
    const imgCount = attachments.filter(a => a.kind === "file" && a.isImage).length;
    const linkedCount = attachments.filter(a => (a.url || "").trim().length > 0).length;

    attachMetaEl.textContent =
      `${attachments.length} attachment(s) • ${fileCount} file(s) • ${linkCount} link(s) • ${imgCount} image(s) • ${linkedCount}/${attachments.length} link(s) present`;

    for (const a of attachments){
      const row = document.createElement("div");
      row.className = "fileRow";

      const top = document.createElement("div");
      top.className = "fileRowTop";

      const left = document.createElement("div");
      left.className = "fileLeft";

      const nameLine = document.createElement("div");
      nameLine.className = "fileNameLine";

      const name = document.createElement("div");
      name.className = "fileName";
      name.textContent = a.label || a.name || "Attachment";

      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = a.kind === "link" ? "Link" : "File";

      nameLine.appendChild(name);
      nameLine.appendChild(tag);

      const meta = document.createElement("div");
      meta.className = "fileMeta";
      if (a.kind === "file") {
        meta.textContent = `${a.type || "unknown"} • ${humanFileSize(a.size || 0)}`;
      } else {
        meta.textContent = a.url ? a.url : "(no URL)";
      }

      left.appendChild(nameLine);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.className = "fileRight";

      if (a.kind === "file" && a.isImage && a.objectUrl){
        const thumb = document.createElement("div");
        thumb.className = "thumb";
        const img = document.createElement("img");
        img.src = a.objectUrl;
        img.alt = a.name || "image";
        thumb.appendChild(img);
        right.appendChild(thumb);
      }

      const removeBtn = document.createElement("button");
      removeBtn.className = "dangerBtn";
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => removeAttachment(a.id));
      right.appendChild(removeBtn);

      top.appendChild(left);
      top.appendChild(right);

      const grid = document.createElement("div");
      grid.className = "grid2";
      grid.style.marginTop = "10px";

      const labelBox = document.createElement("div");
      const labelLbl = document.createElement("div");
      labelLbl.className = "label";
      labelLbl.style.margin = "10px 0 6px";
      labelLbl.textContent = "Label (optional)";
      const labelInput = document.createElement("input");
      labelInput.type = "text";
      labelInput.placeholder = "e.g., Waitlist mock (mobile)";
      labelInput.value = a.label || "";
      labelInput.addEventListener("input", (e) => {
        const idx = attachments.findIndex(x => x.id === a.id);
        if (idx !== -1) attachments[idx].label = e.target.value;
        renderAttachments();
      });
      labelBox.appendChild(labelLbl);
      labelBox.appendChild(labelInput);

      const urlBox = document.createElement("div");
      const urlLbl = document.createElement("div");
      urlLbl.className = "label";
      urlLbl.style.margin = "10px 0 6px";
      urlLbl.textContent = a.kind === "link" ? "URL (required for link attachments)" : "OneDrive/Figma link (recommended)";
      const urlInput = document.createElement("input");
      urlInput.type = "url";
      urlInput.placeholder = a.kind === "link"
        ? "Paste link (OneDrive/Figma/etc.)"
        : "Paste OneDrive share link (or Figma link if relevant)";
      urlInput.value = a.url || "";
      urlInput.addEventListener("input", (e) => {
        const idx = attachments.findIndex(x => x.id === a.id);
        if (idx !== -1) attachments[idx].url = e.target.value;
        renderAttachments();
      });
      urlBox.appendChild(urlLbl);
      urlBox.appendChild(urlInput);

      grid.appendChild(labelBox);
      grid.appendChild(urlBox);

      row.appendChild(top);
      row.appendChild(grid);

      attachmentListEl.appendChild(row);
    }
  }

  function detailDirectives_User(){
    if (detailLevel === "outline"){
      return `
Detail level: OUTLINE
- Target 4–6 bullets total.
- Use very high-level capability statements only.
- Avoid validations, edge cases, or error handling.
- Treat this as a scaffold for a PM to refine later.
      `.trim();
    }

    if (detailLevel === "lean"){
      return `
Detail level: LEAN (default)
- Target 6–9 bullets total.
- Focus on core capability outcomes + critical validations/errors only.
- Avoid long edge-case lists; keep wording tight.
      `.trim();
    }

    if (detailLevel === "exhaustive"){
      return `
Detail level: EXHAUSTIVE
- Target 30–60+ bullets total.
- Include thorough edge cases (empty states, max length, duplicates, concurrency, retries/timeouts).
- Include security/permissions, a11y, performance, analytics where applicable.
- Include explicit negative cases and error messages where implied.
      `.trim();
    }

    return `
Detail level: BALANCED
- Target 10–14 bullets total.
- Cover happy path + key validations + a few important edge cases.
- Keep wording concise.
    `.trim();
  }

  function detailDirectives_Tech(){
    if (detailLevel === "outline"){
      return `
Detail level: OUTLINE
- For each relevant layer, provide 1–2 high-level bullets.
- Focus only on responsibility boundaries (no validations or failures).
      `.trim();
    }

    if (detailLevel === "lean"){
      return `
Detail level: LEAN (default)
- For each relevant layer, target 2–3 bullets.
- Focus on core deliverables + top validation/failure items only.
      `.trim();
    }

    if (detailLevel === "exhaustive"){
      return `
Detail level: EXHAUSTIVE
- For each relevant layer, target 8–15 bullets.
- Include failures, retries, idempotency, concurrency, schema constraints, migrations, monitoring, rate limits, caching, etc.
      `.trim();
    }

    return `
Detail level: BALANCED
- For each relevant layer, target 3–5 bullets.
- Include main flows + validations + key failure modes, but keep it concise.
    `.trim();
  }

  function formatDirective(){
    if (formatStyle === "gherkin"){
      return `
Format: GHERKIN
- Every bullet should be a Given/When/Then statement (or a compact G/W/T variant).
- Still output as bullets only (each line begins with "- ").
      `.trim();
    }
    return `
Format: SIMPLE (default)
- Use straightforward, testable bullet statements.
- Use Given/When/Then only when it genuinely clarifies behavior (don’t force it).
    `.trim();
  }

  function buildPrompt_UserOriented(){
    const story = storyEl.value.trim();
    const ctx = contextEl.value.trim();
    const focus = getFocusAreas();
    const focusBlock = focus.length ? focus.map(f => `- ${f}`).join("\n") : "(none)";

    const attBlock = (() => {
      if (attachments.length === 0) return "(none)";
      return attachments.map(a => {
        const label = (a.label || a.name || "Attachment").trim();
        const url = (a.url || "").trim();
        if (url) return `- ${label} — ${url}`;
        return `- ${label} — (no link provided)`;
      }).join("\n");
    })();

    return `
You are a senior QA lead + Product Manager.

Task:
Generate detailed, testable Acceptance Criteria (AC) for the feature below.

Output requirements:
- Output ONLY acceptance criteria bullets (each line starts with "- ").
- Do NOT include headings, introductions, or summaries.
- Each AC must be specific and verifiable. Avoid generic filler like "works correctly".
- Include happy path + negative/validation + edge cases implied by inputs.
- If assumptions are needed, make reasonable assumptions and encode them into AC (do not ask questions).

${detailDirectives_User()}

${formatDirective()}

USER STORY:
${story}

ADDITIONAL CONTEXT (optional):
${ctx || "(none)"}

ATTACHMENTS (use links when available):
${attBlock}

FOCUS AREAS (optional):
${focusBlock}
    `.trim();
  }

  function buildPrompt_TechStackFocused(){
    const story = storyEl.value.trim();
    const ctx = contextEl.value.trim();

    const attBlock = (() => {
      if (attachments.length === 0) return "(none)";
      return attachments.map(a => {
        const label = (a.label || a.name || "Attachment").trim();
        const url = (a.url || "").trim();
        if (url) return `- ${label} — ${url}`;
        return `- ${label} — (no link provided)`;
      }).join("\n");
    })();

    return `
You are a senior technical Product Manager and QA lead.

Task:
Using the user story below, produce acceptance criteria organized by technical layer.
Treat this as a delivery plan where multiple teams can pick up work.

Output requirements:
- Output ONLY bullet acceptance criteria (each line starts with "- ").
- Group criteria by including a short label prefix at the start of each bullet, like:
  - [Front-end] ...
  - [API] ...
  - [Back-end] ...
  - [Database] ...
  - [Integrations/Jobs] ...
  - [Security/Permissions] ...
  - [Observability] ...
- Make criteria testable and specific; avoid generic filler.
- Include edge cases and failure modes (timeouts, retries, validation, concurrency).
- Do NOT ask questions; make reasonable assumptions when needed.

${detailDirectives_Tech()}

${formatDirective()}

USER STORY:
${story}

ADDITIONAL CONTEXT (optional):
${ctx || "(none)"}

ATTACHMENTS (use links when available):
${attBlock}
    `.trim();
  }

  function buildCopilotPrompt(){
    return modeEl.value === "tech"
      ? buildPrompt_TechStackFocused()
      : buildPrompt_UserOriented();
  }

  async function copyToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function updateUI(){
    const hasStory = storyEl.value.trim().length > 0;

    contextEl.disabled = !hasStory;
    attachmentsEl.disabled = !hasStory;
    linkUrlEl.disabled = !hasStory;

    card2.setAttribute("aria-disabled", String(!hasStory));
    card3.setAttribute("aria-disabled", String(!hasStory));
    card4.setAttribute("aria-disabled", String(!hasStory));

    copyPromptBtn.disabled = !hasStory;

    const urlOk = hasStory && linkUrlEl.value.trim().length > 0 && isProbablyUrl(linkUrlEl.value.trim());
    addLinkBtn.disabled = !urlOk;

    if (!hasStory){
      s1.className = "pill bad"; s1.textContent = "Step 1: User story required";
      s2.className = "pill warn"; s2.textContent = "Step 2–3: Optional (locked)";
      s3.className = "pill warn"; s3.textContent = "Step 4: Locked";
    } else {
      s1.className = "pill ok"; s1.textContent = "Step 1: Ready";
      s2.className = "pill ok"; s2.textContent = "Step 2–3: Optional";
      s3.className = "pill ok"; s3.textContent = "Step 4: Ready";
    }
  }

  // Events
  storyEl.addEventListener("input", () => { toast(""); updateUI(); });
  contextEl.addEventListener("input", updateUI);
  linkUrlEl.addEventListener("input", updateUI);
  modeEl.addEventListener("change", () => { modeHint(); });

  [chkValidation, chkPermissions, chkAudit, chkPerformance, chkAccessibility, chkAnalytics].forEach(el=>{
    el.addEventListener("change", updateUI);
  });

  dOutline.addEventListener("click", () => setDetail("outline"));
  dLean.addEventListener("click", () => setDetail("lean"));
  dBalanced.addEventListener("click", () => setDetail("balanced"));
  dExhaustive.addEventListener("click", () => setDetail("exhaustive"));

  fSimple.addEventListener("click", () => setFormat("simple"));
  fGherkin.addEventListener("click", () => setFormat("gherkin"));

  attachmentsEl.addEventListener("change", () => {
    const selected = Array.from(attachmentsEl.files || []);
    if (selected.length === 0) return;

    const existingIds = new Set(attachments.map(a => a.id));

    for (const file of selected){
      const id = makeFileId(file);
      if (existingIds.has(id)) continue;

      const isImage = (file.type || "").startsWith("image/");
      const objectUrl = isImage ? URL.createObjectURL(file) : null;

      attachments.push({
        id,
        kind: "file",
        label: file.name,
        url: "",
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        isImage,
        objectUrl
      });
      existingIds.add(id);
    }

    attachmentsEl.value = "";
    renderAttachments();
    updateUI();
  });

  addLinkBtn.addEventListener("click", () => {
    const url = linkUrlEl.value.trim();
    if (!isProbablyUrl(url)) return;

    const id = makeLinkId(url);
    if (attachments.some(a => a.id === id)) {
      toast("That link is already added.", true);
      return;
    }

    let label = "Link";
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");
      if (host.includes("figma.com")) label = "Figma";
      else if (host.includes("1drv.ms") || host.includes("sharepoint") || host.includes("onedrive")) label = "OneDrive";
      else label = host;
    } catch {}

    attachments.push({
      id,
      kind: "link",
      label,
      url,
      name: "",
      type: "",
      size: 0,
      isImage: false,
      objectUrl: null
    });

    linkUrlEl.value = "";
    toast("");
    renderAttachments();
    updateUI();
  });

  clearAttachmentsBtn.addEventListener("click", () => {
    clearAllAttachments();
    toast("");
    updateUI();
  });

  copyPromptBtn.addEventListener("click", async () => {
    const story = storyEl.value.trim();
    if (!story){
      toast("Please fill in the User Story first.", true);
      storyEl.focus();
      return;
    }
    const prompt = buildCopilotPrompt();
    const ok = await copyToClipboard(prompt);
    toast(ok ? "Copied prompt. Paste into Copilot Chat." : "Clipboard blocked. Please allow clipboard permissions.", !ok);
  });

  clearBtn.addEventListener("click", () => {
    storyEl.value = "";
    contextEl.value = "";
    linkUrlEl.value = "";
    clearAllAttachments();

    chkValidation.checked = true;
    chkPermissions.checked = false;
    chkAudit.checked = false;
    chkPerformance.checked = false;
    chkAccessibility.checked = false;
    chkAnalytics.checked = false;

    modeEl.value = "user";
    modeHint();

    setDetail("lean");   // default
    setFormat("simple"); // default

    toast("");
    updateUI();
  });

  // Init
  contextEl.disabled = true;
  attachmentsEl.disabled = true;
  linkUrlEl.disabled = true;

  attachMetaEl.textContent = "No attachments added (optional).";
  modeHint();
  setDetail("lean");     // default
  setFormat("simple");   // default
  renderAttachments();
  updateUI();
});
