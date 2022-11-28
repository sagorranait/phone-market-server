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

   app.patch('/user/:id', async (req, res) => {
      const id = req.params.id;
      const verifiy = req.body.verified;
      const query = { _id: ObjectId(id) }
      const updatedDoc = {
         $set:{        
            "verified": verifiy
         }
      }
      const result = await users.updateOne(query, updatedDoc);
      res.send(result);
   });

   app.get('/user/allSeller', async (req, res) => { 
      let query = {
         "status": 'seller'
      };
      
      const cursor = users.find(query);
      const user = await cursor.toArray();
      res.send(user);
   });

   app.get('/user/allBuyer', async (req, res) => { 
      let query = {
         "status": 'buyer'
      };
      
      const cursor = users.find(query);
      const user = await cursor.toArray();
      res.send(user);
   });

  app.post('/addUser', async (req, res) => {
      const newUser = req.body;
      const result = await users.insertOne(newUser);
      res.send(result);
   });

   app.put('/addUser/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body;
      const filter = { email: email }
      const options = { upsert: true }
      const updateDoc = {
          $set: user
      }
      const result = await users.updateOne(filter, updateDoc, options)
      res.send(result)
  });

  app.delete('/user/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await users.deleteOne(query);
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

   app.get('/product/advertised', async (req, res) => { 
      const query = { "advertised": true };
      const cursor = products.find(query);
      const advertisedProduct = await cursor.toArray();
      res.send(advertisedProduct);
   });

   app.patch('/product/:id', async (req, res) => {
      const id = req.params.id;
      const user = req.body.user;
      const status = req.body.status;
      const query = { _id: ObjectId(id) }
      const updatedDoc = {
         $set:{        
            "booked.user": user,
            "booked.status": status
         }
      }
      const result = await products.updateOne(query, updatedDoc);
      res.send(result);
   });

   app.patch('/product/report/:id', async (req, res) => {
      const id = req.params.id;
      const user = req.body.user;
      const status = req.body.status;
      const query = { _id: ObjectId(id) }
      const updatedDoc = {
         $set:{        
            "reported.user": user,
            "reported.status": status
         }
      }
      const result = await products.updateOne(query, updatedDoc);
      res.send(result);
   });
  // Category Functionality End

   //   Booked Functionality Start
   app.get('/booked', verifyJWToken, async (req, res) => { 
      const decodedToken = req.decoded;
            
      if(decodedToken.email !== req.query.email){
            res.status(403).send({message: 'unauthorized access'})
      }

      let query = {};
      if (req.query.email) {
         query = {
            "user_info.email": req.query.email
         }
      }
      const cursor = bookedProduct.find(query);
      const reportes = await cursor.toArray();
      res.send(reportes);
   });

   app.post('/booked', async (req, res) => {
      const newUser = req.body;
      const result = await bookedProduct.insertOne(newUser);
      res.send(result);
   });

   app.delete('/booked/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookedProduct.deleteOne(query);
      res.send(result);
  });
   //   Booked Functionality End

   //   Reported Functionality Start
   app.get('/reported', verifyJWToken, async (req, res) => { 
      const decodedToken = req.decoded;
            
      if(decodedToken.email !== req.query.email){
            res.status(403).send({message: 'unauthorized access'})
      }

      let query = {};
      if (req.query.email) {
         query = {
            "user_info.email": req.query.email
         }
      }
      const cursor = productReport.find(query);
      const reportes = await cursor.toArray();
      res.send(reportes);
   });

   app.post('/reported', async (req, res) => {
      const newUser = req.body;
      const result = await productReport.insertOne(newUser);
      res.send(result);
   });

   app.delete('/reported/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productReport.deleteOne(query);
      res.send(result);
  });
   //   Reported Functionality End

}

runServer().catch(error => console.error(error));


app.get('/', (req, res) => {
   res.send('PhoneMarket Server Side.')
})

app.listen(port, () => {
   console.log(`Server Running On ${port}`);
})