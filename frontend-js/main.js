import Search from './modules/Search';
import Chat from './modules/Chat';
import Registrationform from './modules/RegistrationForm'

if(document.querySelector('#registration-form')){
    new Registrationform();
}

if(document.querySelector('#chat-wrapper')){
    new Chat();
}

if(document.querySelector('.header-search-icon')){
    new Search();
} 