exports.handler = async (event) => {
try {
const { topic, videoTitle } = JSON.parse(event.body || "{}");

if (!topic) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Please provide a lesson topic." })
  };
}

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: "AI lesson service is not configured." })
  };
}

const prompt = `You are a Nigerian secondary-school teacher preparing students for examinations.

Topic: "${topic}"
Related video title: "${videoTitle || topic}"

Return ONLY valid JSON in this format:
{
"lesson": [
"Clear lesson paragraph 1",
"Clear lesson paragraph 2",
"Clear lesson paragraph 3"
],
"questions": [
{
"question": "Question text",
"options": {
"A": "Option A",
"B": "Option B",
"C": "Option C",
"D": "Option D"
},
"answer": "A",
"explanation": "Brief explanation"
}
]
}

Provide exactly 5 multiple-choice questions. Each question must have options A, B, C, and D. Ensure the answers are correct and the lesson is simple, accurate, and suitable for Nigerian secondary-school students.`;

const response = await fetch(
  "https://api.anthropic.com/v1/messages",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })
  }
);

const data = await response.json();

if (!response.ok) {
  return {
    statusCode: 502,
    body: JSON.stringify({
      error: "The AI service could not generate the lesson. Check your API configuration."
    })
  };
}

const text = data.content?.find(item => item.type === "text")?.text;

if (!text) {
  throw new Error("No lesson was returned.");
}

const start = text.indexOf("{");
const end = text.lastIndexOf("}");

if (start === -1 || end === -1) {
  throw new Error("The AI returned an invalid lesson format.");
}

const lesson = JSON.parse(text.slice(start, end + 1));

return {
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(lesson)
};

} catch (error) {
return {
statusCode: 500,
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ error: "Unable to prepare the lesson." })
};
}
};
