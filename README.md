# Reddit-Clone-Server

## Introduction

This a node.js project using express webframework with mongoDB to store data for a Reddit-Clone app

## DataBase

there is 2 collections one for the Users and one for the Subreddits

## Routes

1. Auth route (/auth)
- post for login by email and password


2. user route (/user)
- get user info (/me)
- post for registering a new user


3. subreddit route (/subreddit)
- get all subreddits
- get subreddit by id
- post a new subreddit
- update an existing subreddit
- delete a subreddit


4. post route (/post)
- get all posts published by the current user
- get all posts for a subreddit
- get a post from a subreddit by id 
- post a new post in a subreddit
- put update a post in a subreddit
- upvote a post
- downvote a post
- delete a post


5. comment route(/comment)
- get all comments for a post
- post a new comment to a post
- put update a comment
- upvote a comment
- downvote a comment
- delete a comment
