exports.handler = async (event) => {
try {
const q = event.queryStringParameters?.q;

if (!q) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Please provide a lesson topic." })
  };
}

const apiKey = process.env.YOUTUBE_API_KEY;

if (!apiKey) {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: "YouTube API key is not configured." })
  };
}

const url =
  `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=1&q=${encodeURIComponent(q + " lesson tutorial")}&key=${apiKey}`;

const res = await fetch(url);
const data = await res.json();

if (!res.ok) {
  return {
    statusCode: 502,
    body: JSON.stringify({ error: "YouTube search failed." })
  };
}

if (!data.items || data.items.length === 0) {
  return {
    statusCode: 404,
    body: JSON.stringify({ error: "No educational video found." })
  };
}

const item = data.items[0];

return {
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    videoId: item.id.videoId,
    title: item.snippet.title
  })
};

} catch (error) {
return {
statusCode: 500,
body: JSON.stringify({ error: "An unexpected error occurred." })
};
}
};
