const mongoose=require('mongoose');

require('dotenv').config();

exports.connect=()=>{
    console.log("Hello duniya : ",process.env.MONGODB_URL);
    
    mongoose.connect(process.env.MONGODB_URL,{
        useNewUrlParser:true,
        useUnifiedTopology:true,
    })
    .then(console.log("DB connection successful"))
    .catch((error)=>{
        console.log("DB connection issues");
        console.error(error);
        process.exit(1);
    })
}