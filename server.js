const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID
const app = express();
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);
app.use(bodyParser.json());

const port = process.env.PORT || 4000;

const connection = (closure) => {
    return MongoClient.connect('mongodb://localhost:27017/TODO', (err, client) => {
        if (err) throw err;
        let db = client.db('TODO');
        closure(db);
    })
}

const server = app.listen(port, function () {
    console.log('Listening on port ' + port);
});



app.post('/subscribe', (req, res) => {
    connection(async (db) => {
        sub=req.body;
        const hash = bcrypt.hashSync(sub.pwd, salt);
        sub.pwd=hash;
        const user = await db.collection('subs').insert(sub);
        res.send(user);
    })
});

app.post('/login', (req, res) => {
    connection(async (db) => {
        log=req.body;
        const user = await db.collection('subs').findOne({email:log.email});
        if (user ===null) return res.json({"Message": "User not found"})
        else if (!bcrypt.compareSync(log.pwd, user.pwd)) return res.json({"Message": "Wrong pwd"})
        else {
            const Token = jwt.sign({
                email: user.email,
                _id: user._id
              },
              'secret',
               {
                 expiresIn: '10sec'
               });

            return res.json({"Message": "Connected" ,"Token": Token})
        }
    })
});

app.post('/createTodo/:id', (req, res) => {
    connection(async (db) => {
        const todo = await db.collection('subs').update({_id: ObjectID(req.params.id) }, { $push: { "Todo": req.body } });
        res.json(todo);
    })
});

app.get('/getTodosByID/:id', (req, res) => {
    connection(async (db) => {
        let user = await db.collection('subs').findOne({ _id: ObjectID(req.params.id)  });
        res.send(user.Todo);
    })
});

app.post('/updateTodo/:id/:index', (req, res) => {
    connection(async (db) => {
        let user = await db.collection('subs').findOne({ _id: ObjectID(req.params.id)  });
        user.Todo[req.params.index]=req.body;
        let todo = await db.collection('subs').update({_id: ObjectID(req.params.id) },{ $set: { Todo : user.Todo }});  
        
        // let todo = await db.collection('subs').update({_id: ObjectID(req.params.id) },{ $set: { ['Todo.'+req.params.index] : req.body }});

       res.send(todo);
    })
});

app.get('/deleteTodo/:id/:index', (req, res) => {
    connection(async (db) => {
        let user = await db.collection('subs').findOne({ _id: ObjectID(req.params.id)  });
        let todo = await db.collection('subs').update({_id: ObjectID(req.params.id) },{ $pull: { Todo : user.Todo[req.params.index] }});     

       res.send(todo);
    })
});
