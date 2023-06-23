document.addEventListener('DOMContentLoaded', () => {

    // Toggle menu
    document.querySelector("#menu").addEventListener('click', () => toggleMenu());

    // Load all posts
    window.onload = () => {
        if (window.location.pathname === '/') {
            loadAllPosts();
            disableEnableAddPostButton();
        } else if (window.location.pathname.startsWith('/user/')) {
            const usernamePath = window.location.pathname.split('/')[2];
            loadAllPosts(page_number=1, posts_per_page=1000, specification='user', user_id=null, username=usernamePath);
            disableEnableAddPostButton();
        } else if (window.location.pathname === '/following') {
            const usernamePath = document.querySelector("#logged_username")
            document.querySelector("#index_title").innerHTML = "Following"
            loadAllPosts(page_number=1, posts_per_page=10, specification='following', user_id=null, username=usernamePath);
            disableEnableAddPostButton();
        }
    };

    disableEnableAddPostButton();

});


function disableEnableAddPostButton() {
    // Disable and enable adding new post
    console.log("Defining add new post attributes")
    const newPostContent = document.getElementById('add-new-post-content');
    const addNewPostButton = document.getElementById('add-new-post-button');

    // Add event listener to the textarea
    newPostContent.addEventListener('input', function() {
        if (newPostContent.value.trim() === '') {
            console.log("Disabling the option to add new post")
            addNewPostButton.disabled = true; // Disable the button
        } else {
            console.log("Enabling the option to add new post")
            addNewPostButton.disabled = false; // Enable the button
        }
    });
}

function toggleMenu() {
    console.log("Toggled menu")

    const userInfo = document.querySelector('#user-info');
    const networkContent = document.querySelector("#network-content")
    if (userInfo.style.display === '' || userInfo.style.display === 'block'){
        console.log("Unactivated menu")
        userInfo.style.display = 'none';
        networkContent.classList.remove('col-sm-9');
        networkContent.classList.add('col-sm-12');
    } else {
        console.log("Activated menu")
        userInfo.style.display = 'block';
        networkContent.classList.remove('col-sm-12');
        networkContent.classList.add('col-sm-9');
    }
}

function likeUnlikePost(postId) {
    return new Promise((resolve, reject) => {
      fetch('/like-unlike-post', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "post_id": postId }),
      })
        .then(response => response.json())
        .then(result => {
          // Handle the result of the request
          console.log(result);
          resolve(); // Resolve the promise after the request is completed
        })
        .catch(error => {
          // Handle any errors
          console.error('Error:', error);
          reject(error); // Reject the promise if an error occurs
        });
    });
}
  

function loadAllPosts(page_number=1, posts_per_page=10, specification='all', user_id=null, username=null) {
    console.log(`Loading up to ${posts_per_page} posts of page ${page_number}...`);

    const data = {
        page_number: page_number,
        posts_per_page: posts_per_page,
        specification: specification,
        user_id: user_id,
        username: username
    };

    fetch('/posts-page', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        // Handle the JSON response
        console.log(data);
        const postsPlacement = document.querySelector('.posts-placement');

        // Clear existing content (if needed)
        postsPlacement.innerHTML = '';

        const loggedUser = document.querySelector('#username').innerHTML

        // Inform if there is no posts in current page
        if (data.posts.length === 0){
            console.log("No posts found");
            postsPlacement.innerHTML = "No posts in current section.";
        }

        // Append HTML code for each post
        for (const post of data.posts){
            const postContainer = document.createElement('div');
            postContainer.className = 'spec-post-placement col-sm-12 column-flex d-flex flex-column align-items-center';

            const userContainer = document.createElement('div');
            userContainer.className = 'col-sm-12 d-flex align-items-center';

            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'mr-auto';
            usernameSpan.innerHTML = `<strong><a href="/user/${post.user}">${post.user}</a></strong>`;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'text-right';
            timeSpan.innerText = post.time_since_creation;

            userContainer.appendChild(usernameSpan);
            userContainer.appendChild(timeSpan);

            const contentContainer = document.createElement('div');
            contentContainer.className = 'spec-post-content col-sm-12 d-flex';
            contentContainer.style.whiteSpace = 'pre-line';
            contentContainer.innerHTML = `<p>${post.content}</p>`;

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'col-sm-12 d-flex';

            const likeButtonContainer = document.createElement('div');
            likeButtonContainer.className = 'col-sm-4 d-flex';

            const likeButton = document.createElement('button');
            likeButton.className = 'post-buttons mr-auto';
            likeButton.innerText = post.liked_by.includes(loggedUser) ? 'Unlike': 'Like';

            const likesContainer = document.createElement('div');
            likesContainer.className = 'post-likes col-sm-4 d-flex justify-content-center align-items-center';
            likesContainer.innerHTML = post.number_likes !== 1 ? `<span>${post.number_likes} Likes</span>`: `<span>${post.number_likes} Like</span>`;
            likesContainer.id = `post-${post.id}-number-likes`

            likeButton.addEventListener('click', () => {
                likeUnlikePost(post.id)
                .then(() => {
                    likeButton.innerText = likeButton.innerText === "Unlike" ? "Like" : "Unlike";
                    fetch('/view-post', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({"post_id": post.id}),
                    })
                    .then(response => response.json())
                    .then(selectedPost => {
                        // Handle the result of the request
                        console.log(`Loading information from post ${selectedPost.id}.`)
                        console.log(selectedPost)
                        document.querySelector(`#post-${selectedPost.id}-number-likes`).innerHTML = selectedPost.number_likes !== 1 ? `<span>${selectedPost.number_likes} Likes</span>`: `<span>${selectedPost.number_likes} Like</span>`;
                    })
                    .catch(error => {
                        // Handle any errors
                        console.error('Error:', error);
                    });
                })
            })

            likeButtonContainer.appendChild(likeButton);
            buttonsContainer.appendChild(likeButtonContainer);
            buttonsContainer.appendChild(likesContainer);
            
            if (loggedUser == post.user){
                const editButtonContainer = document.createElement('div');
                editButtonContainer.className = 'col-sm-4 d-flex';
                const editButton = document.createElement('button');
                editButton.className = 'post-buttons ml-auto';
                editButton.innerText = 'Edit';
                editButtonContainer.appendChild(editButton);
                buttonsContainer.appendChild(editButtonContainer);
            }

            postContainer.appendChild(userContainer);
            postContainer.appendChild(contentContainer);
            postContainer.appendChild(buttonsContainer);

            postsPlacement.appendChild(postContainer);
        }

        const pagination = document.querySelector('.pagination');
        pagination.innerHTML = ""

        if (page_number > 1){
            const previousPage = document.createElement('li');
            previousPage.className = 'page-item';
            previousPage.innerHTML = '<a class="page-link">Previous</a>';
            previousPage.addEventListener('click', () => {
                loadAllPosts(page_number = page_number - 1)
            });
            pagination.appendChild(previousPage)
        }

        if (page_number < data.number_pages){
            const nextPage = document.createElement('li');
            nextPage.className = 'page-item';
            nextPage.innerHTML = '<a class="page-link">Next</a>';
            nextPage.addEventListener('click', () => {
                loadAllPosts(page_number = page_number + 1)
            });
            pagination.appendChild(nextPage)
        }
    })
    .catch(error => {
        // Handle any errors
        console.error('Error:', error);
    });
}
