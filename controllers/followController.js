const Follow = require('../models/Follow');

exports.addFollow = function(req, res){
    follow = new Follow(req.params.username, req.visitorId);

    follow.create()

    .then(() => {
        req.flash('success', `Successfuly follwed ${req.params.username}`);
        req.session.save(() => {
            res.redirect(`/profile/${req.params.username}`);
        });
    })

    .catch((errors) => {
        errors.forEach( error => {
            req.flash('errors', error);
        });

        req.session.save(() => {
            res.redirect('/');
        });
    });
}

exports.removeFollow = function(req, res){
    follow = new Follow(req.params.username, req.visitorId);

    follow.remove()

    .then(() => {
        req.flash('success', `Successfuly stopped following ${req.params.username}`);
        req.session.save(() => {
            res.redirect(`/profile/${req.params.username}`);
        });
    })

    .catch((errors) => {
        errors.forEach( error => {
            req.flash('errors', error);
        });

        req.session.save(() => {
            res.redirect('/');
        });
    });
}