const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

// Mongodb Connection Uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b18cp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWToken = (req, res, next) => {
   const authHeaderToken = req.headers.authorization;

   if(!authHeaderToken){
       return res.status(401).send({message: 'Un-Authorized Entry !!!'});
   }
   const token = authHeaderToken.split(' ')[1];

   jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
       if(err){
           return res.status(403).send({message: 'Illegal Access !!!'});
       }
       req.decoded = decoded;
       next();
   })
}

const runServer = async () => {
   const users = client.db('phoneMarket').collection('users');
   const products = client.db('phoneMarket').collection('products');
   const category = client.db('phoneMarket').collection('category');
   const productReport = client.db('phoneMarket').collection('productReport');
   const bookedProduct = client.db('phoneMarket').collection('bookedProduct');

   // JWT
   app.post('/jwt', (req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1d'})
      res.send({token})
  });

  // Users Functionality Start
   app.get('/user', async (req, res) => { 
      let query = {};
      if (req.query.email) {
         query = {
            "email": req.query.email
         }
      }
      const cursor = users.find(query);
      const user = await cursor.toArray();
      res.send(user);
   });

  app.post('/addUser', async (req, res) => {
      const newUser = req.body;
      const result = await users.insertOne(newUser);
      res.send(result);
   });
  // Users Functionality End

  // Category Functionality Start
  app.get('/categories', async (req, res) => { 
      let query = {};
      const cursor = category.find(query);
      const categories = await cursor.toArray();
      res.send(categories);
   });

   app.get('/category/product/:id', async (req, res) => { 
      const id = req.params.id;
      const query = { "cat_id": id };
      const cursor = products.find(query);
      const product = await cursor.toArray();
      res.send(product);
   });
  // Category Functionality End

}

runServer().catch(error => console.error(error));


app.get('/', (req, res) => {
   res.send('PhoneMarket Server Side.')
})

app.listen(port, () => {
   console.log(`Server Running On ${port}`);
})