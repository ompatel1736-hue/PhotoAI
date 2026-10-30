const form = document.querySelector("#generator-form");
const promptInput = document.querySelector("#prompt");
const charCount = document.querySelector("#char-count");
const generateButton = document.querySelector("#generate");
const result = document.querySelector("#result");
const statusText = document.querySelector("#status");
const downloadLink = document.querySelector("#download");
const resultCaption = document.querySelector("#result-caption");
let selectedStyle = "Photorealistic";

document.querySelector("#year").textContent = new Date().getFullYear();
promptInput.addEventListener("input", () => charCount.textContent = promptInput.value.length);

document.querySelectorAll(".chip").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    selectedStyle = button.dataset.style;
  });
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) return;
  generateButton.disabled = true;
  generateButton.innerHTML = "<span>✦</span> Creating your image…";
  statusText.textContent = "GENERATING";
  result.innerHTML = '<div class="placeholder"><div class="placeholder-icon">✧</div><h3>Creating your image…</h3><p>This can take a little while. Please keep this page open.</p></div>';
  downloadLink.classList.add("disabled");

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        prompt,
        style: selectedStyle,
        size: document.querySelector("#size").value,
        quality: document.querySelector("#quality").value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Image generation failed.");
    const imageUrl = `data:image/png;base64,${data.image}`;
    result.innerHTML = "";
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = prompt;
    result.appendChild(img);
    downloadLink.href = imageUrl;
    downloadLink.classList.remove("disabled");
    resultCaption.textContent = `${selectedStyle} · ${prompt.slice(0, 55)}${prompt.length > 55 ? "…" : ""}`;
    statusText.textContent = "IMAGE READY";
  } catch (error) {
    result.innerHTML = `<div class="placeholder"><div class="placeholder-icon">!</div><h3>We couldn't create that image</h3><p>${escapeHtml(error.message)}</p></div>`;
    statusText.textContent = "PLEASE TRY AGAIN";
  } finally {
    generateButton.disabled = false;
    generateButton.innerHTML = "<span>✦</span> Generate image";
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
