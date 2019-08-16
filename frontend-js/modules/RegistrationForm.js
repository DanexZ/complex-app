import axios from 'axios';;

class RegistrationForm{
    constructor(){
        this._csrf = document.querySelector('[name=_csrf]').value;
        this.form = document.querySelector('#registration-form');
        this.allFields = document.querySelectorAll('#registration-form .form-control');
        this.insertValidationElements();
        this.username = document.querySelector('#username-register');
        this.username.previousValue = '';
        this.email = document.querySelector('#email-register');
        this.email.previousValue = '';
        this.password = document.querySelector('#password-register');
        this.password.previousValue = '';
        this.username.isUnique = false;
        this.email.isUnique = false;
        this.events();
    }


    events(){
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.formHandler(); 
        });

        this.username.addEventListener('keyup', e => {
            this.isDifferent(this.username, this.usernameHandler);
        });

        this.email.addEventListener('keyup', e => {
            this.isDifferent(this.email, this.emailHandler);
        });

        this.password.addEventListener('keyup', e => {
            this.isDifferent(this.password, this.passwordHandler);
        });
        
        this.username.addEventListener('blur', e => {
            this.isDifferent(this.username, this.usernameHandler);
        });

        this.email.addEventListener('blur', e => {
            this.isDifferent(this.email, this.emailHandler);
        });

        this.password.addEventListener('blur', e => {
            this.isDifferent(this.password, this.passwordHandler);
        }); 
    }


    isDifferent(el, handler){
        if(el.previousValue != el.value){
            handler.call(this); //takie wywołanie funkcji pozwala mi w nie używać this odnoszącego się do tej klasy
        }
        el.previousValue = el.value;
    }


    usernameHandler(){
        this.username.errors = false;
        this.usernameImmediately();
        clearTimeout(this.username.timer);
        this.username.timer = setTimeout(() => this.usernameAfterDelay(), 900);
    }


    emailHandler(){
        this.email.errors = false;
        clearTimeout(this.email.timer);
        this.email.timer = setTimeout(() => this.emailAfterDelay(), 900);
    }

    passwordHandler(){
        this.password.errors = false;
        this.passwordImmediately();
        clearTimeout(this.password.timer);
        this.password.timer = setTimeout(() => this.passwordAfterDelay(), 900);
    }


    formHandler(){
        this.usernameImmediately();
        this.usernameAfterDelay();
        this.emailAfterDelay();
        this.passwordImmediately();
        this.passwordAfterDelay();

        console.log(this.username.isUnique)
        console.log(!this.username.errors)
        console.log(this.email.isUnique)
        console.log(!this.email.errors)
        console.log(!this.password.errors)

        if( this.username.isUnique && !this.username.errors && this.email.isUnique &&
            !this.email.errors && !this.password.errors)
            {
                this.form.submit();
            }
    }


    usernameImmediately(){
        if(this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value) ){
            this.showValidationError(this.username, "Username can only contain letters an numbers");
        }

        if(this.username.value.length > 20){
            this.showValidationError(this.username, "Username cannot exceed 20 characters")
        }

        if(!this.username.errors){
            this.hideValidationError(this.username);
        }
    }


    passwordImmediately(){
        if(this.password.value.length > 30){
            this.showValidationError(this.password, "Password cannot excced 30 characters");
        }

        if(!this.password.errors){
            this.hideValidationError(this.password);
        }
    }


    hideValidationError(el){
        el.nextElementSibling.classList.remove('liveValidateMessage--visible');
    }


    showValidationError(el, message){
        el.nextElementSibling.innerHTML = message;
        el.nextElementSibling.classList.add('liveValidateMessage--visible');
        el.errors = true;
    }


    usernameAfterDelay(){
        if(this.username.value.length < 3){
            this.showValidationError(this.username, "Username must be at least 3 characters")
        }

        if(!this.username.errors){
            axios.post('doesUsernameExist', {username: this.username.value, _csrf: this._csrf})

            .then(response => {
                if(response.data){
                    this.showValidationError(this.username, "That username is already taken");
                    this.username.isUnique = false;
                } else {
                    this.username.isUnique = true;
                }
            })

            .catch(() => {
                console.log('Please try again later');
            });
        }
    }


    emailAfterDelay(){
        if(!/^\S+@\S+$/.test(this.email.value)){
            this.showValidationError(this.email, "You must provide a valid email address");
        }

        if(!this.email.errors){
            axios.post('/doesEmailExist', {email: this.email.value, _csrf: this._csrf})

            .then(response => {
                if(response.data) {
                    this.email.isUnique = false;
                    this.showValidationError(this.email, "That email address is already being used");
                } else {
                    this.email.isUnique = true;
                    this.hideValidationError(this.email);
                }
            })

            .catch(() => {
                console.log("Try try again later");
            });
        }
    }


    passwordAfterDelay(){
        if(this.password.value.length < 6){
            this.showValidationError(this.password, "Password must be at least 6 characters")
        }
    }


    insertValidationElements(){
        this.allFields.forEach(function(el){
            el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>');
        })
    }
}

export default RegistrationForm