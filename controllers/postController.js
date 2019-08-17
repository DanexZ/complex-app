const Post = require('../models/Post');
const jwt = require('jsonwebtoken');
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY);

exports.viewCreateScreen = function(req, res){
    res.render('create-post', {
        username: req.session.user.username,
        avatar: req.session.user.avatar
    });
}

exports.create = function(req, res){
    let post = new Post(req.body, req.visitorId);

    post.create()

    .then(function(post_id){
        sendgrid.send({
            to: "daniel.zawadzki4@gmail.com",
            from: "test@test.pl",
            subject: "Congrats on Creating a New Post",
            text: "You did a great job.",
            html: 'You did <strong>great job</strong> of creating a post.'

        });
        req.flash('success', "New post successfuly created");
        req.session.save(() => res.redirect(`/post/${post_id}`));
    })
    
    .catch(function(errors){
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect('/create-post'));
    });
}

exports.apiCreate = function(req, res){
    let post = new Post(req.body, req.apiUser._id);

    post.create()

    .then(function(post_id){
        res.json('Congrats');
    })
    
    .catch(function(errors){
        res.json(errors);
    });
}

exports.delete = function(req, res){
    let post = new Post(req.body);

    post.delete(req.params.id, req.visitorId)

    .then(() => {
        req.flash('success', "Post successfully deleted");
        req.session.save(() => {
            res.redirect(`/profile/${req.session.user.username}`);
        });
    })

    .catch(() => {
        req.flash('errors', "You do not have permision to perform that action");
        req.session.save(() => {
            req.redirect('/');
        });
    });
}

exports.apiDelete = function(req, res){
    let post = new Post();

    post.delete(req.params.id, req.apiUser._id)

    .then(() => {
        res.json('Success');
    })

    .catch(() => {
        res.json('You do not have permision to do this action');
    });
}

exports.viewSingle = async function(req, res){

    try {

        let post = new Post(req.body, req.visitorId);

        post = await post.getPost(req.params.id, req.visitorId);

        res.render('single-post-screen', {
            post: post,
            title: post.title
        });

    } catch(e) {
        res.render("404");
    }
}

exports.viewEditScreen = async function(req, res){

    try{
        let post = new Post(req.body, req.visitorId);
        post = await post.getPost(req.params.id, req.visitorId);

        if(post.isVisitorOwner){

            res.render('edit-post', {
                post: post
            });

        } else {
            req.flash('errors', "You don't have permision for this action");
            req.session.save(() => {
                res.redirect('/');
            })
        }
        
    } catch(e) {
        res.render("404");
    }
}

exports.edit = function(req, res){

    let post = new Post(req.body, req.visitorId, req.params.id);

    post.update().then( (status) => {

        if(status == 'success'){

            req.flash("success", "Post successfuly updated");
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`);
            });

        } else {
            post.errors.forEach(function(error){
                req.flash('errors', error);
            });

            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`);
            }); 
        }

    }).catch((err) => {

        req.flash("errors", "You don't have permision to doing this action");
        req.session.save(function(){
            res.redirect('/');
        })
    });
}

exports.search = function(req, res){
    let post = new Post(req.body, req.visitorId);

    post.search(req.body.searchTerm)

    .then((posts) => {
        res.json(posts)
    })

    .catch(() => {
        res.json([]);
    });
}
