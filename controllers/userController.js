const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('..//models/Follow');
const jwt = require('jsonwebtoken');


exports.doesUsernameExist = function(req, res){
    let user = new User();
    user.findUserByUsername(req.body.username)

    .then(bool => {
        res.json(bool);
    })

    .catch(() => {
        res.json(false);
    });
}

exports.doesEmailExist = function(req, res){
    let user = new User();
    user.doesEmailExist(req.body.email)

    .then(() => {
        res.json(true);
    })

    .catch(() => {
        res.json(false);
    });
}

exports.sharedProfileData = function(req, res, next){
    var isVisitorsProfile = false;

    if(req.session.user){

        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
        let follow = new Follow(req.profileUser._id, req.visitorId);

        follow.isVisitorFollowing(req.profileUser._id)

        .then(flag => {
            req.isVisitorsProfile = isVisitorsProfile;
            req.isFollowing = flag;
            next();


        })
        .catch( async (flag) => {
            req.isVisitorsProfile = isVisitorsProfile;
            req.isFollowing = flag;

            let post = new Post(req.params.username, req.visitorId);
            let follow = new Follow(req.params.username, req.visitorId);
            let postsCountPromise = post.countPostsByAuthor(req.profileUser._id);
            let followersCountPromise = follow.countFollowersByAuthor(req.profileUser._id);
            let followingCountPromise = follow.countFollowingByAuthor(req.profileUser._id);

            let [postsCount, followersCount, followingCount] = await Promise.all([postsCountPromise, followersCountPromise, followingCountPromise]);

            req.postsCount = postsCount;
            req.followersCount = followersCount;
            req.followingCount = followingCount;;
            
            next();

        });
    }

    
}

exports.mustBeLoggedIn = function(req, res, next){
    if(req.session.user){
        next();
    } else {
        req.flash('errors', "You must be logged in to perform that action.");
        req.session.save(function(){
            res.redirect('/');
        })
    }
}

exports.apiMustBeLoggedIn = function(req, res, next){
    try {
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET);
        next();
    } catch(e) {
        res.json("Incorrect token")
    }
}

exports.ifUserExists = function(req, res, next){

    let user = new User(req.params.username);

    user.findUserByUsername(req.params.username)

    .then(function(userDocument){
        req.profileUser = userDocument;
        next();
    })

    .catch(function(){
        res.render('404');
    });
}

exports.profilePostsScreen = function(req, res){

    let post = new Post(req.params.username, req.visitorId);

    post.getUserPosts(req.profileUser._id)

    .then(function(posts){
        
        res.render('profile', {
            title: `Profile for ${req.params.username}`,
            currentPage: 'posts',
            profileUsername: req.params.username,
            avatar: req.params.avatar,
            posts: posts,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {
                postsCount: req.postsCount,
                followersCount: req.followersCount,
                followingCount: req.followingCount
            }
        });
    });

}

exports.home = async function(req, res){

    if(req.session.user){
        //fetch feed of posts for current user
        let post = new Post(req.params.username, req.visitorId)
        let posts = await post.getFeed(req.session.user._id)
        
        res.render('home-dashboard', {
            posts: posts
        });

        
    } else {
        res.render('home-guest', {
            regErrors: req.flash('regErrors')
        }); //ta paczka odrazu usuwa z pamięci te flash-errors
    }
}

exports.register = function(req, res){
    let user = new User(req.body);

    user.register().
    
    then(function(result){
        req.session.user = {
            username: user.data.username,
            avatar: user.avatar,
            _id: user.data._id
        }
        req.session.save(function(e){
            res.redirect('/');
        });
    })
    
    .catch((regErrors) => {
        req.flash('regErrors', regErrors);
        req.session.save(function(e){
            res.redirect('/');
        });
    });
    
}

exports.login = function(req, res){
    let user = new User(req.body);

    user.login()

    .then(function(result){
        req.session.user = {
            username: user.data.username,
            avatar: user.avatar,
            _id: user.data._id
        }
        //muszę mieć pewność, że sesja została zapisana więc dalsza akcja jest w callbacku
        req.session.save(function(){
            res.redirect('/');
        });
    })

    .catch(function(e){
        req.flash('errors', e);
        req.session.save(function(){
            res.redirect('/');
        })
    });
}

exports.apiLogin = function(req, res){
    let user = new User(req.body);

    user.login()

    .then(function(result){
       res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '7d'}))
    })

    .catch(function(e){
        res.json("Spierdalaj");
    });
}

exports.logout = function(req, res){
    req.session.destroy(function(){
        res.redirect('/');
    });
}


exports.followersScreen = function(req, res){
    let follow = new Follow(req.params.username, req.visitorId);

    follow.getFollowersById(req.profileUser._id)

    .then(followers => {
        res.render('profile-followers', {
            currentPage: 'followers',
            followers: followers,
            avatar: req.params.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            profileUsername: req.profileUser.username,
            counts: {
                postsCount: req.postsCount,
                followersCount: req.followersCount,
                followingCount: req.followingCount
            }
        });
    })

    .catch((e) => {
        res.render('404');
    });

}


exports.followingScreen = function(req, res){
    let follow = new Follow(req.params.username, req.visitorId);

    follow.getFollowingById(req.profileUser._id)

    .then(following => {
        res.render('profile-following', {
            currentPage: 'following',
            following: following,
            avatar: req.params.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            profileUsername: req.profileUser.username,
            counts: {
                postsCount: req.postsCount,
                followersCount: req.followersCount,
                followingCount: req.followingCount
            }
        });
    })

    .catch((e) => {
        res.render('404');
    });
}

exports.apiGetPostsByUsername = async function(req, res){
    let user = new User();
    let post = new Post();

    try {

        let userDocPromise = user.findUserByUsername(req.params.username);
        let [userDoc] = await Promise.all([userDocPromise]);
        let postsPromise = post.getUserPosts(userDoc._id);
        let [posts] = await Promise.all([postsPromise]);
        res.json(posts);

    } catch(e){
        res.json("Sorry, invalid user requested");
    }
}
