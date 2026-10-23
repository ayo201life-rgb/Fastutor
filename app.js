const topicInput = document.getElementById("topic");
const goBtn = document.getElementById("go");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

goBtn.addEventListener("click", startLesson);

topicInput.addEventListener("keydown", e => {
if (e.key === "Enter") startLesson();
});

async function startLesson() {
const topic = topicInput.value.trim();
if (!topic) {
statusEl.textContent = "Please enter a lesson topic.";
return;
}

goBtn.disabled = true;
resultEl.innerHTML = "";
statusEl.textContent = "Finding an educational video...";

try {
const vRes = await fetch(
"/.netlify/functions/youtube?q=${encodeURIComponent(topic)}"
);

if (!vRes.ok) throw new Error("Could not find a video. Please try again.");

const video = await vRes.json();

resultEl.innerHTML = `
  <div class="card">
    <h2>${escapeHtml(video.title)}</h2>
    <iframe
      src="https://www.youtube.com/embed/${encodeURIComponent(video.videoId)}"
      title="Educational video"
      allowfullscreen>
    </iframe>
  </div>`;

statusEl.textContent = "Preparing your lesson and quiz...";

const lRes = await fetch("/.netlify/functions/lesson", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topic,
    videoTitle: video.title
  })
});

if (!lRes.ok) throw new Error("Could not generate the lesson. Please try again.");

const lesson = await lRes.json();
renderLesson(lesson);
statusEl.textContent = "";

} catch (err) {
statusEl.textContent = err.message || "Something went wrong.";
} finally {
goBtn.disabled = false;
}
}

function renderLesson(lesson) {
const lessonHtml = lesson.lesson
.map(p => "<p>${escapeHtml(p)}</p>")
.join("");

const questionsHtml = lesson.questions.map((q, i) => "<div class="question"> <strong>${i + 1}. ${escapeHtml(q.question)}</strong> ${Object.entries(q.options).map(([letter, optionText]) =>"
<label class="option">
<input type="radio" name="q${i}" value="${letter}">
${letter}. ${escapeHtml(optionText)}
</label>
").join("")} <div class="explain"></div> </div> ").join("");

resultEl.innerHTML += " <div class="card"> <h2>Lesson Notes</h2> ${lessonHtml} </div> <div class="card" id="quiz"> <h2>Test Your Understanding</h2> ${questionsHtml} <button id="submit">Submit Answers</button> <div id="score"></div> </div>";

document.getElementById("submit").addEventListener("click", () => {
gradeQuiz(lesson.questions);
});
}

function gradeQuiz(questions) {
let score = 0;

questions.forEach((q, i) => {
const block = document.querySelectorAll(".question")[i];
const chosen = document.querySelector("input[name="q${i}"]:checked");
const chosenVal = chosen ? chosen.value : null;

if (chosenVal === q.answer) score++;

block.querySelectorAll(".option").forEach(opt => {
  const input = opt.querySelector("input");

  if (input.value === q.answer) {
    opt.classList.add("correct");
  } else if (input.value === chosenVal) {
    opt.classList.add("wrong");
  }
});

block.querySelector(".explain").textContent = q.explanation;

});

document.getElementById("score").innerHTML =
"<h3>Score: ${score} / ${questions.length}</h3>";

document.getElementById("submit").disabled = true;
}

function escapeHtml(value) {
const div = document.createElement("div");
div.textContent = String(value ?? "");
return div.innerHTML;
}
