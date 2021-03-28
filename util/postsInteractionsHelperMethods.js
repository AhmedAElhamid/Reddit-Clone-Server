
function userFilter(userId,postId){
    return {
        _id: userId,
        postsPublished: {$elemMatch: {_id: postId}}
    }
}
function subredditFilter(subredditId,postId){
    return {
        _id: subredditId,
        postsPublished: {$elemMatch: {_id: postId}}
    }
}

function upVotingADownVotedPostUpdates(userId){
    return {
        $inc: {"postsPublished.$.upVotes": 1,"postsPublished.$.downVotes": -1},
        $addToSet: {"postsPublished.$.usersUpVoted": userId},
        $pull: {"postsPublished.$.usersDownVoted": userId}
    }
}

function upVotingUpdates(userId){
    return {
        $inc: {"postsPublished.$.upVotes": 1},
        $addToSet: {"postsPublished.$.usersUpVoted": userId}
    }
}
function downVotingAnUpVotedPostUpdates(userId){
    return {
        $inc: {"postsPublished.$.upVotes": -1,"postsPublished.$.downVotes": 1},
        $addToSet : {"postsPublished.$.usersDownVoted": userId},
        $pull : {"postsPublished.$.usersUpVoted": userId}
    }
}
function downVotingUpdates(userId){
    return {
        $inc : {"postsPublished.$.downVotes" : 1},
        $addToSet : {"postsPublished.$.usersDownVoted": userId}
    }
}
function getAuthor(post){
    return post.postsPublished[0].publisher.toString()
}

function wasDownVoted(subreddit,userId){
    return subreddit[0].postsPublished[0].usersDownVoted.includes(userId)
}
function wasUpVoted(subreddit,userId){
    return subreddit[0].postsPublished[0].usersUpVoted.includes(userId)
}

module.exports = {userFilter,subredditFilter,
    upVotingUpdates,
    upVotingADownVotedPostUpdates,
    downVotingAnUpVotedPostUpdates,
    downVotingUpdates,
    getAuthor,
    wasDownVoted,
    wasUpVoted
}