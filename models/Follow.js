const usersCollection = require('../db').db().collection('users');
const followsCollection = require('../db').db().collection('follows');
const ObjectID = require('mongodb').ObjectID;
const User = require('./User');

class Follow{
    constructor(followedUsername, authorId){
        this.followedUsername = followedUsername;
        this.authorId = authorId;
        this.errors = [];
    }


    cleanUp(){
        if(typeof(this.followedUsername) != 'string'){
            this.followedUsername = '';
        }
    }

    //followed usernam must exists in database
    async validate(action){

        let followedAccount =  await usersCollection.findOne({
            username: this.followedUsername
        });

        if(followedAccount){
            this.followedId = followedAccount._id;
        } else {
            this.errors.push("You cannot follow the user that does not exists");
        }

        let doesFollowAlreadyExist = await followsCollection.findOne({
            followedId: this.followedId,
            authorId: new ObjectID(this.authorId)
        });

        if(action == "create"){
            if(doesFollowAlreadyExist){
                this.errors.push("You are already following this user");
            }
        }

        if(action == "remove"){
            if(!doesFollowAlreadyExist){
                this.errors.push("You cannot stop following someone you do not follow.");
            }
        }

        if(this.followedId.equals(this.authorId)){
            this.errors.push("You cannot follow yourself");
        }
    }


    create(){
        return new Promise( async (resolve, reject) => {
            this.cleanUp()
            await this.validate("create");

            if(!this.errors.length) {
               await followsCollection.insertOne({
                    followedId: this.followedId,
                    authorId: new ObjectID(this.authorId)
                });
                resolve();

            } else {
                reject(this.errors);
            }
        });
    }


    remove(){
        return new Promise( async (resolve, reject) => {
            this.cleanUp()
            await this.validate("remove");

            if(!this.errors.length) {
               await followsCollection.deleteOne({
                    followedId: this.followedId,
                    authorId: new ObjectID(this.authorId)
                });
                resolve();

            } else {
                reject(this.errors);
            }
        });
    }


    isVisitorFollowing(followedId){
        return new Promise(async (resolve, reject) => {

            let followDoc = await followsCollection.findOne({
                followedId: followedId,
                authorId: new ObjectID(this.authorId)
            });
    
            if(followDoc){
                resolve(true);
            } else {
                reject(false);
            }
        });
    }


    getFollowersById(followedId){
        return new Promise( async(resolve, reject) => {

            try {
                let followers = await followsCollection.aggregate([
                    {$match: {followedId: followedId}},
                    {$lookup: {from: 'users', localField: 'authorId', foreignField: '_id', as: 'userDoc'}},
                    {$project: {
                        username: {$arrayElemAt: ['$userDoc.username', 0]},
                        email: {$arrayElemAt: ['$userDoc.email', 0]}
                    }}
                ]).toArray();

                followers = followers.map(function(follower){
                    let user = new User(follower, true);

                    return {username: follower.username, avatar: user.avatar}
                });

                resolve(followers);

            } catch(e) {
                reject(e);
            }
            
        });
    }


    getFollowingById(followedId){
        return new Promise( async(resolve, reject) => {

            try {
                let following = await followsCollection.aggregate([
                    {$match: {authorId: followedId}},
                    {$lookup: {from: 'users', localField: 'followedId', foreignField: '_id', as: 'userDoc'}},
                    {$project: {
                        username: {$arrayElemAt: ['$userDoc.username', 0]},
                        email: {$arrayElemAt: ['$userDoc.email', 0]}
                    }}
                ]).toArray();

                following = following.map(function(singleFollowing){
                    let user = new User(singleFollowing, true);

                    return {username: singleFollowing.username, avatar: user.avatar}
                });

                resolve(following);

            } catch(e) {
                reject(e);
            }
            
        });
    }


    countFollowersByAuthor(id){
        return new Promise(async (resolve, reject) => {
            let followersCount = await followsCollection.countDocuments({
                follewedId: id
            });

            resolve(followersCount);
        });
    }


    countFollowingByAuthor(id){
        return new Promise(async (resolve, reject) => {
            let followingCount = await followsCollection.countDocuments({
                authorId: id
            });

            resolve(followingCount);
        });
    }
        
}

module.exports = Follow;