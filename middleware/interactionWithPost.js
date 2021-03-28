

module.exports = function (posts,userId){
    if(!Array.isArray(posts)) posts = [posts];

    posts = posts.map(p =>{
        if(p.usersUpVoted.includes(userId)) {
            p.interaction.isUpVoted = true
        }
        else if(p.usersDownVoted.includes(userId)) {
            p.interaction.isDownVoted = true
        }
        return p;
    })
    return posts
}