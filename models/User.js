const usersCollection = require('../db').db().collection("users");
const validator = require('validator');
const bcrypt = require('bcryptjs');
const md5 = require('md5');

class User{
    constructor(data, userAvatar){
        this.data = data;
        this.errors = [];
        if(userAvatar == undefined){ userAvatar = false }
        if(userAvatar){this.getAvatar()}
    }

    cleanUp(){
        if(typeof(this.data.username) != 'string'){ this.data.username = '' }
        if(typeof(this.data.email) != 'string'){ this.data.email = '' }
        if(typeof(this.data.password) != 'string'){ this.data.password = '' }

        //get rid of any bonus properties
        this.data = {
            username: this.data.username.trim(),
            email: this.data.email.trim().toLowerCase(),
            password: this.data.password
        }
    }

    validate(){
        return new Promise( async (resolve, reject) => {

            let validUsername = true;
            let validEmail = true;
    
            if(this.data.username == ""){
                this.errors.push("You must provide a username");
                validUsername = false;
            }
            if(this.data.username.length > 0 && this.data.username.length < 3){
                this.errors.push("Username must be at least 3 characters");
                validUsername = false;
            }
            if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){
                this.errors.push("Username can only contain letter and numbers");
                validUsername = false;
            }
            if(this.data.username.length > 20){
                this.errors.push("Username cannot exceed 20 characters");
                validUsername = false;
            }
            if(!validator.isEmail(this.data.email)){
                this.errors.push("You must provide a valid e-mail address");
                validEmail = false;
            }
            if(this.data.password == ""){
                this.errors.push("You must provide valid password");
            }
            if(this.data.password.length > 0 && this.data.password.length < 6){
                this.errors.push("Password must be at least 6 characters");
            }
            if(this.data.password.length > 30){
                this.errors.push("Password cannot exceed 30 characters");
            }
    
            // Only if username is valid then check if already exists in database
            if(validUsername){
                let usernameExists = await usersCollection.findOne({username: this.data.username});
    
                if(usernameExists){
                    this.errors.push("This username is already taken");
                }
            }
    
            if(validEmail){
                let userEmail = await usersCollection.findOne({email: this.data.username});
    
                if(userEmail){
                    this.errors.push('This e-mail address is already taken');
                }
            }

            resolve();

        });
    }

    register(){
        return new Promise( async (resolve, reject) => {

            this.cleanUp();
            await this.validate().then(async (result) => {
    
                //If no errors add new user
                if(!this.errors.length){
                    //hash user password
                    let salt = bcrypt.genSaltSync(10); //dowiedz się o ten parametr
                    this.data.password = bcrypt.hashSync(this.data.password, salt);
    
                    await usersCollection.insertOne(this.data);
                    this.getAvatar();
                    resolve();
                } else {
                    reject(this.errors);
                }

            }); 
        });
    }

    login(){
        return new Promise((resolve, reject) => {

            this.cleanUp();
            //dzięki funkcji strzałkwej mam dostęp do this bo nie odnosi sie globalnego obiektu
            usersCollection.findOne({username: this.data.username})
            
            .then((attemptedUser) => {
                if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
                    this.data = attemptedUser;
                    this.getAvatar();
                    resolve("Congrats");
                } else {
                    reject("Invalid username / password");
                }
                
            }).catch(function(){
                reject("Please try later");
            });
        });
    }

    getAvatar(){
        this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
    }

    findUserByUsername(username){
        return new Promise( (resolve, reject) => {
            if(typeof(username) != 'string'){
                reject();
                return
            }

            usersCollection.findOne({username: username})

            .then(function(userDoc){
                if(userDoc){

                    userDoc = new User(userDoc, true);
                    userDoc = {
                        _id: userDoc.data._id,
                        username: userDoc.data.username,
                        avatar: userDoc.avatar
                    }

                    resolve(userDoc);
                } else {
                    resolve(false);
                }
                
            })

            .catch(function(e){
                reject("Please try later");
            })
        });
    }

    doesEmailExist(email){
        return new Promise( (resolve, reject) => {

            if(typeof(email) != 'string'){
                reject();
                return
            }

            usersCollection.findOne({email: email})

            .then((userDoc) => {
                if(userDoc){
                    resolve(true);
                } else {
                    reject(false);
                }
            })

            .catch()
        })
    }
}

module.exports = User;