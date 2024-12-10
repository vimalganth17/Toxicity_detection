const perspectiveApiKey = "AIzaSyBVn5rsPqKyZ5wXq-vRlSKLj3dhqEX-ES0"; // Perspective API Key
const youtubeApiKey = "AIzaSyA-sAkQt0lopfTSs9DrdbNdM55qDoNqclk"; // YouTube API Key

const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${perspectiveApiKey}`;
const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?key=${youtubeApiKey}&textFormat=plainText&part=snippet,replies`;

const input = document.getElementById("text");
const button = document.getElementById("classify");
const output = document.getElementById("output");
const transformation = document.getElementById("transformation");
const youtubeInput = document.getElementById("youtube-url");
const fetchCommentsButton = document.getElementById("fetch-comments");
const toxicCommentsDiv = document.getElementById("toxic-comments");

// Classify a single comment
button.onclick = () => {
    const commentText = input.value;
    if (commentText === "") {
        output.textContent = "Please enter a comment to classify.";
        return;
    }

    // Call Perspective API to analyze the comment
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            comment: {
                text: commentText
            },
            requestedAttributes: {
                TOXICITY: {},
                INSULT: {},
                IDENTITY_ATTACK: {},
                OBSCENE: {},
                SEVERE_TOXICITY: {}
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error("Error from Perspective API:", data.error);
            output.textContent = "An error occurred with the Perspective API.";
            return;
        }

        // Get toxicity scores for different categories
        const toxicityScore = data.attributeScores.TOXICITY.summaryScore.value;
        const insultScore = data.attributeScores.INSULT.summaryScore.value;
        const identityAttackScore = data.attributeScores.IDENTITY_ATTACK.summaryScore.value;
        const obsceneScore = data.attributeScores.OBSCENE.summaryScore.value;
        const severeToxicityScore = data.attributeScores.SEVERE_TOXICITY.summaryScore.value;

        let toxicityType = "Not Toxic";

        if (severeToxicityScore > 0.7) toxicityType = "Severe Toxicity";
        else if (obsceneScore > 0.7) toxicityType = "Obscene";
        else if (identityAttackScore > 0.7) toxicityType = "Identity Attack";
        else if (insultScore > 0.7) toxicityType = "Insult";
        else if (toxicityScore > 0.7) toxicityType = "Toxic";

        output.textContent = toxicityType;
        transformation.textContent = generateTransformation(commentText, toxicityType);
    })
    .catch(error => {
        console.error("Error:", error);
        output.textContent = "An error occurred while classifying the comment.";
    });
};

// Function to generate a transformation message based on the toxic comment
function generateTransformation(comment, toxicityType) {
    if (toxicityType === "Insult") {
        if (/stupid|dumb|idiot/i.test(comment)) {
            return "Suggested transformation: 'You are unwise, let's stay respectful!'";
        } else {
            return "Suggested transformation: 'Please be more respectful in your language.'";
        }
    } else if (toxicityType === "Identity Attack") {
        return "Suggested transformation: 'Let's keep the conversation free of personal attacks.'";
    } else if (toxicityType === "Obscene") {
        return "Suggested transformation: 'Please avoid using inappropriate language.'";
    } else if (toxicityType === "Severe Toxicity") {
        return "Suggested transformation: 'Let's be more constructive and kind in our discussions.'";
    } else if (toxicityType === "Toxic") {
        return "Suggested transformation: 'Try to express your opinion in a more respectful way.'";
    } else {
        return "No toxicity detected. Keep up the positive communication!";
    }
}

// Fetch toxic comments from YouTube video URL
fetchCommentsButton.onclick = () => {
    const videoUrl = youtubeInput.value;
    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
        toxicCommentsDiv.textContent = "Please enter a valid YouTube video URL.";
        return;
    }

    toxicCommentsDiv.innerHTML = "Fetching comments...";

    fetchYouTubeComments(videoId)
        .then(comments => {
            toxicCommentsDiv.innerHTML = "<h3>Toxic Comments:</h3>";
            comments.forEach(comment => {
                toxicCommentsDiv.innerHTML += `<p><strong>${comment.author}</strong>: ${comment.text}</p>`;
            });
        })
        .catch(error => {
            console.error("Error fetching YouTube comments:", error);
            toxicCommentsDiv.textContent = "Failed to fetch comments.";
        });
};

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Function to fetch YouTube comments based on video ID
async function fetchYouTubeComments(videoId) {
    const response = await fetch(`${youtubeApiUrl}&videoId=${videoId}`);
    const data = await response.json();

    const comments = [];

    for (let item of data.items) {
        const commentText = item.snippet.topLevelComment.snippet.textDisplay;
        const author = item.snippet.topLevelComment.snippet.authorDisplayName;

        // Classify comment toxicity
        const toxicity = await classifyToxicity(commentText);

        if (toxicity === "Toxic" || toxicity === "Severe Toxicity" || toxicity === "Insult" || toxicity === "Obscene" || toxicity === "Identity Attack") {
            comments.push({ author, text: commentText });
        }
    }

    return comments;
}

// Function to classify the toxicity of a YouTube comment using Perspective API
async function classifyToxicity(comment) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            comment: {
                text: comment
            },
            requestedAttributes: {
                TOXICITY: {},
                INSULT: {},
                IDENTITY_ATTACK: {},
                OBSCENE: {},
                SEVERE_TOXICITY: {}
            }
        })
    });

    const data = await response.json();
    
    if (data.error) {
        console.error("Error from Perspective API:", data.error);
        return "Error";
    }

    const toxicityScore = data.attributeScores.TOXICITY.summaryScore.value;
    const insultScore = data.attributeScores.INSULT.summaryScore.value;
    const identityAttackScore = data.attributeScores.IDENTITY_ATTACK.summaryScore.value;
    const obsceneScore = data.attributeScores.OBSCENE.summaryScore.value;
    const severeToxicityScore = data.attributeScores.SEVERE_TOXICITY.summaryScore.value;

    if (severeToxicityScore > 0.7) return "Severe Toxicity";
    else if (obsceneScore > 0.7) return "Obscene";
    else if (identityAttackScore > 0.7) return "Identity Attack";
    else if (insultScore > 0.7) return "Insult";
    else if (toxicityScore > 0.7) return "Toxic";
    
    return "Not Toxic";
}
