const postsCollection = require('../db').db().collection("posts");
const followsCollection = require('../db').db().collection("follows");
const ObjectID = require('mongodb').ObjectID;
const User = require('./User');
const sanitizeHtml = require('sanitize-html');

class Post {
    constructor(data, user_id, requestedPostId){
        this.data = data;
        this.user_id = user_id,
        this.errors = [];
        this.requestedPostId = requestedPostId;
    }


    cleanUp(){
        if(typeof(this.data.title) != 'string'){this.data.title = ''}
        if(typeof(this.data.body) != 'string'){this.data.body = ''}

        //get rid of any bonus properties
        this.data = {
            author: ObjectID(this.user_id),
            title: sanitizeHtml(
                this.data.title.trim(),
                { allowedTags: [], allowedAttributes: {} }
            ), 
            body: sanitizeHtml(
                this.data.body.trim(),
                { allowedTags: [], allowedAttributes: {} }
            ), 
            created_at: new Date()
        }
    }


    validate(){
        if(this.data.title == ''){
            this.errors.push("You must provide a title");
        }
        if(this.data.body == ''){
            this.errors.push("You must provide a post content");
        }
    }


    create(){
        return new Promise( (resolve, reject) => {
            this.cleanUp();
            this.validate();

            if(!this.errors.length){

                postsCollection.insertOne(this.data)
                .then(function(info){
                    resolve(info.ops[0]._id);
                })
                .catch(function(){
                    this.errors.push("Please try later");
                    reject(this.errors);
                });
                
            } else {
                reject(this.errors);
            }
        });

    }


    reusablePostQuery(uniqueOperations, visitorId) {
        return new Promise( async (resolve, reject) => {

            let aggOperations = uniqueOperations.concat([
                { $lookup: {from: 'users', localField: "author", foreignField: "_id", as: "authorDocument"} },
                { $project: {
                    title: 1,
                    body: 1,
                    created_at: 1,
                    authorId: '$author',
                    author: {$arrayElemAt: ['$authorDocument', 0]} //to 0 to pozycja w tablicy
                } }
            ]);

            //let post = postsCollection.findOne({_id: new ObjectID(id)})
            let posts = await postsCollection.aggregate(aggOperations).toArray();

            // clean up author property in each post object
            posts = posts.map(function(post){

                post.isVisitorOwner = post.authorId.equals(visitorId);
                post.authorId = undefined;

                post.author  = {
                    username: post.author.username,
                    avatar: new User(post.author, true).avatar
                }

                return post
            })

            resolve(posts);
        });
    }


    getPost(id, visitorId){
        return new Promise( async (resolve, reject) => {

            if(typeof(id) != 'string' || !ObjectID.isValid(id)){
               reject();
               return
            }

            let posts = await this.reusablePostQuery([
                { $match: { _id: new ObjectID(id) } }
            ], visitorId);
            
    
            if(posts.length){
                resolve(posts[0]);
            } else {
                reject("Sorry try later");
            }

        });
    }


    getUserPosts(user_id){
        return new Promise( async (resolve, reject) => {
           let posts = await this.reusablePostQuery([
                {$match: { author: user_id } },
                { $sort: { created_at: -1 } } //to chyba descending
            ]);

            resolve(posts);
        });   
    }


    update(){
        return new Promise( async (resolve, reject) => {

            try {
                let post = await this.getPost(this.requestedPostId, this.user_id);

                if(post.isVisitorOwner){

                    let status = await this.actuallyUpdate();
                    resolve(status);

                } else {
                    reject();
                }

            } catch(e) {
                //ten catch wychwytuje to co w this.getPost zwróci reject()
                reject(e);
            }

        });
    }


    delete(post_id, user_id){
        return new Promise( async (resolve, reject) => {

            try {
                let post = await this.getPost(post_id, user_id);

                if(post.isVisitorOwner){

                    //let status = await this.actuallyUpdate();
                    await postsCollection.deleteOne({
                        _id: new ObjectID(post_id)
                    });

                    resolve();

                } else {
                    reject();
                }

            } catch(e) {
                reject();
            }
            
        });
    }


    actuallyUpdate(){
        return new Promise(async (resolve, reject) => {
            this.cleanUp();
            this.validate();

            if(!this.errors.length){
                await postsCollection.findOneAndUpdate(
                    { _id: new ObjectID(this.requestedPostId) },
                    { $set: {title: this.data.title, body: this.data.body} }
                );
                resolve('success');
            } else {
                resolve('failure');
            }

        });
    }


    search(searchTerm){
        return new Promise(async (resolve, reject) => {

            if(typeof(searchTerm) == 'string'){

                let posts = await this.reusablePostQuery([
                    {$match: {$text: {$search: searchTerm}}},
                    {$sort: {score: {$meta: 'textScore'}}}
                ], this.user_id);

                resolve(posts);
            } else {
                reject();
            }
        });
    }


    countPostsByAuthor(id){
        return new Promise(async (resolve, reject) => {
            let postsCount = await postsCollection.countDocuments({
                author: id
            });

            resolve(postsCount);
        });
    }


    async getFeed(id){
        // craete an array of the ids that the current user follows
        let followedUsers = await followsCollection.find({
            authorId: new ObjectID(id)
        }).toArray();

        followedUsers = followedUsers.map((followedUser) => {
            return followedUser.followedId;
        });

        //look for posts where the author is in the above array of followed users
        return await this.reusablePostQuery([
            {$match: {author: {$in: followedUsers}}},
            {$sort: {created_at: -1}} //new value at the top
        ]);


    }
}

module.exports = Post;