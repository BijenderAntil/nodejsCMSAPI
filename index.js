const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const { validate, ValidationError, Joi } = require('express-validation');
const fs = require('fs');
const users = require('./users');
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
const { Resolver } = require('dns');
const PORT =8000;
app.use(bodyParser.json());

const myLogger = function (req, res, next) {
  console.log('LOGGED')
  next()
}

//app.use(myLogger)

const createUserValidation = {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
      first_name: Joi.string()
        .required(),
        last_name: Joi.string()
        .required(),
        mobile: Joi.string()
        .required(),
    }),
  }
  const userData = [];

app.post('/api/users',validate(createUserValidation, {}, {}), readFile, async(req, res, next)=>{
    const fileData = req.body.fileData;
    delete req.body.fileData;
    const body = req.body;
    let createUser  = {...body, id:uuidv1()};
    fileData.push(createUser);
    fs.writeFile("users.json", JSON.stringify(fileData),err=>{
   // console.log("after");
      //return next();
      res.status(201).send(fileData);
    });
    //res.status(404).send("Error");
})
app.put('/api/users/:id',validate(createUserValidation, {}, {}), readFile,async(req, res)=>{
    const userData = req.body.fileData;
    const updateToData = userData.find((f)=>f.id===req.params.id);
    if(!updateToData){
      return res.status(404).json({
        status: 'error',
        error: `User not Found!-${req.params.id}`,
        data:[]
      });
    }
    let index = userData.indexOf(updateToData);
    delete req.body.fileData;
    let updatedData = Object.assign(updateToData, req.body);
    userData[index] = updatedData;
    const promise = new Promise((Resolver, Reject)=>{
      fs.writeFile("users.json", JSON.stringify(userData),err=>{
        if(err)
          Reject(err);
        else
          Resolver(userData);
      });  
    });
    const response = await promise;
    try{
      return res.status(200).json({
        status: 'success',
        error: '',
        data:response
      });
    }catch(err){
      return res.status(404).json({
        status: 'error',
        error: 'something went wrong!',
        data:[]
      });
    }
    
});
app.patch('/api/users/:id',validate(createUserValidation, {}, {}), readFile,(req, res)=>{
  const userData = req.body.fileData;
  if(userData.find((f)=>f.id===req.params.id)){
      let updateUser = [];
      delete req.body.fileData;
      userData.map((r)=>{
          if(r.id == req.params.id){
              updateUser.push({...r, ...req.body});
              
          }
          else{
              updateUser.push(r);
          }
      });
      console.log('new ...');
      //fileData.push(createUser);
      fs.writeFile("users.json", JSON.stringify(updateUser),err=>{
        return res.status(200).json({
          status: 'success',
          error: '',
          data:updateUser
        });
      });
     
  }
  else{
      res.status(404).send(`User not Found!-${req.params.id}`);
  }
  //res.status(200).send(req.params.id);
});
function readFile(req, res, next){
  var obj;
  const dataF=   fs.readFile("users.json", (err, data) => {
    if (err)
      throw err;
    obj = JSON.parse(data);
    req.body.fileData=obj;
    return next();

  });
}

function writeFile(req, res, fileData, next){
  console.log('fileData12=>', fileData)
    fs.writeFile("users.json", JSON.stringify(fileData),err=>{
      console.log('err=>', err); 
       // Checking for errors
    if (err) {
      console.log('err=>', err); 
      throw err
    }
    return next();
    });
}
app.delete('/api/users/:id', readFile, async(req, res, next)=>{
    let userData = req.body.fileData;
    if(userData.find((f)=>f.id===req.params.id)){
        userData = userData.filter((f)=>f.id!==req.params.id);
        const promise = new Promise((Resolver, Reject)=>{
          fs.writeFile("users.json", JSON.stringify(userData),err=>{
            if(err)
              Reject(err);
            else
              Resolver(userData);
          });
        });
        const response = await promise;
        try{
          return res.status(200).json({
            status: 'success',
            error: '',
            data:response
          });
        }catch(err){
          return res.status(404).json({
            status: 'error',
            error: 'something went wrong!',
            data:[]
          });
        }
    }
    res.status(500).send(`User not Found!-${req.params.id}`);
})
//First Name, Last Name, Email, and Contact No.
app.get('/api/users',readFile,(req, res)=>{
    const userData = req.body.fileData;
    res.send(userData);
})
app.use(function(err, req, res, next) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json(err)
    }
  
    return res.status(500).json(err)
  })
app.listen(PORT, (err)=>{
    console.log(`server run at port http://localhost:${PORT}`);
});