const apiRouter = require('express').Router();
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');
const followController = require('./controllers/followController');
const cors = require('cors');

apiRouter.use(cors()); //dotyczy wszystkich routów, które są poniżej wywołania tej funkcji

apiRouter.post('/login', userController.apiLogin);

//post relatet routs
apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername);
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreate);
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete);

module.exports = apiRouter