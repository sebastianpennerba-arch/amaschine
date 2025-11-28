/*
 * Roast Render
 * Bietet ein Upload-Formular und zeigt AI-ähnliches Feedback zu einem Creative.
 * (In dieser Version noch regelbasiert / Dummy.)
 */

import { roastCreative } from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Meta Ads Roast by Sensei";
  container.appendChild(heading);

  const intro = document.createElement("p");
  intro.textContent =
    "Lade ein Creative hoch (Dummy), und Sensei gibt dir ehrliches Feedback – wie ein Senior Media Buyer.";
  container.appendChild(intro);

  const upload = document.createElement("input");
  upload.type = "file";

  const button = document.createElement("button");
  button.textContent = "Roast starten";

  const output = document.createElement("div");
  output.className = "roast-output";

  button.onclick = () => {
    const file = upload.files[0];
    const feedback = roastCreative(file);
    output.innerHTML = `
      <h3>Feedback</h3>
      <p><strong>Score:</strong> ${feedback.score}/10</p>
      <p><strong>Positives:</strong> ${feedback.positives.join(", ")}</p>
      <p><strong>Negatives:</strong> ${feedback.negatives.join(", ")}</p>
      <p><strong>Summary:</strong> ${feedback.summary}</p>
    `;
  };

  container.appendChild(upload);
  container.appendChild(button);
  container.appendChild(output);
}
