const firebaseConfig = {
    apiKey: "API KEY",
    authDomain: "AUTHDOMAIN",
    databaseURL: "DATABASE URL",
    projectId: "PROJECT ID",
    storageBucket: "STORAGE BUCKET",
    messagingSenderId: "MESSAGING SENDER ID",
    appId: "APP ID"
      };
firebase.initializeApp(firebaseConfig);
const database = firebase.database();


function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function upvotePost(postKey) {
    const postRef = database.ref('posts/' + postKey);
    postRef.transaction(post => {
        if (post) {
            post.upvotes = (post.upvotes || 0) + 1;
        }
        return post;
    });
}

function downvotePost(postKey) {
    const postRef = database.ref('posts/' + postKey);
    postRef.transaction(post => {
        if (post) {
            post.upvotes = (post.upvotes || 0) - 1;
        }
        return post;
    });
}

function toggleReplyForm(postKey) {
    const replyForm = document.getElementById(`reply-form-${postKey}`);
    replyForm.classList.toggle('hidden');
}

function postReply(postKey) {
    const replyText = document.getElementById(`reply-text-${postKey}`).value.trim();
    if (replyText !== '') {
        const timestamp = firebase.database.ServerValue.TIMESTAMP;
        const reply = { text: replyText, timestamp };
        const repliesRef = database.ref(`posts/${postKey}/replies`);
        repliesRef.push(reply);
        document.getElementById(`reply-text-${postKey}`).value = '';
    }
}

function toggleRepliesVisibility(postKey) {
    const repliesContainer = document.getElementById(`replies-${postKey}`);
    repliesContainer.classList.toggle('hidden');
    
    const replyCountSpan = document.getElementById(`reply-count-${postKey}`);
    
    // Toggle "View Replies" button text and update reply count
    if (repliesContainer.classList.contains('hidden')) {
        replyCountSpan.textContent = '';
    } else {
        const repliesRef = database.ref(`posts/${postKey}/replies`);
        repliesRef.once('value', snapshot => {
            const repliesCount = snapshot.numChildren();
            replyCountSpan.textContent = repliesCount;
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const postsContainer = document.getElementById('posts-container');

    const postsRef = database.ref('posts');
    postsRef.on('value', snapshot => {
        const posts = [];
        snapshot.forEach(childSnapshot => {
            const post = childSnapshot.val();
            post.key = childSnapshot.key;
            post.repliesCount = 0;
            posts.push(post);
        });

        posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

        postsContainer.innerHTML = '';

        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            
            const repliesRef = database.ref(`posts/${post.key}/replies`);
            repliesRef.once('value', snapshot => {
                post.repliesCount = snapshot.numChildren();
                
                postElement.innerHTML = `
                    <p>${post.text}</p>
                    <p class="post-time">Posted on: ${formatTime(post.timestamp)}</p>
                    <div class="voting-buttons">
                        <button onclick="upvotePost('${post.key}')">&#9650;</button>
                        <span class="upvotes">${post.upvotes}</span>
                        <button onclick="downvotePost('${post.key}')">&#9660;</button>
                    </div>
                    
                    <button class="rep" onclick="toggleReplyForm('${post.key}')">Reply</button>
                    <button class="view-replies-btn" onclick="toggleRepliesVisibility('${post.key}')">
                        View Replies <span id="reply-count-${post.key}">${post.repliesCount}</span>
                    </button>
                    
                    <div id="reply-form-${post.key}" class="reply-form hidden">
                        <textarea class="rar" id="reply-text-${post.key}" placeholder="Reply to this post"></textarea>
                        <button onclick="postReply('${post.key}')">📤</button>
                    </div>
                    
                    <div id="replies-${post.key}" class="replies-container hidden">
                        <!-- Replies will be dynamically added here -->
                    </div>
                `;
                postsContainer.appendChild(postElement);

                const repliesContainer = document.getElementById(`replies-${post.key}`);
                repliesRef.on('value', snapshot => {
                    const replies = [];
                    snapshot.forEach(childSnapshot => {
                        const reply = childSnapshot.val();
                        replies.push(reply);
                    });

                    repliesContainer.innerHTML = '';

                    replies.forEach(reply => {
                        const replyElement = document.createElement('div');
                        replyElement.classList.add('reply');
                        replyElement.innerHTML = `
                            <p>${reply.text}</p>
                            <p class="reply-time">Replied on: ${formatTime(reply.timestamp)}</p>
                        `;
                        repliesContainer.appendChild(replyElement);
                    });
                });
            });
        });
    });

    const postButton = document.getElementById('post-button');
    const postText = document.getElementById('post-text');

    postButton.addEventListener('click', function () {
        const text = postText.value.trim();
        if (text !== '') {
            const timestamp = firebase.database.ServerValue.TIMESTAMP;
            const post = { text, timestamp, upvotes: 0 };
            postsRef.push(post);
            postText.value = '';
        }
    });
});
