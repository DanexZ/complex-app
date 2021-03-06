const db = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

db.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true}, function(err, client){
    
    module.exports = client;
    console.log(client);
    const app = require('./app');
    app.listen(process.env.PORT);
});
