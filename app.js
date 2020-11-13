//jshint esversion:6

// TODO LIST

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Mongoose Creation

mongoose.connect("mongodb+srv://admin-mike:Test123@cluster0.5znbu.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String,
}

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your todolist!'
});
const item2 = new Item({
  name: 'Hit the + button to add a new item.'
});
const item3 = new Item({
  name: '<-- Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);


// Get Requests

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('default items added successfully');
        }
      });
      res.redirect('/')
    } else {
      res.render('list', {
        listTitle: 'Today',
        newListItems: foundItems
      });
    }
  });
});

// Get Request Custom List Name

app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create New List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        //Show Existing List
        res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });


});


// Post Route

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }



});

// Delete Checked Item

app.post('/delete', function(req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today'){
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (!err) {
        console.log('Successfully deleted checked item.');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedItemID}}}, function(err, foundList){
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }
});

// Other Pages Get



app.get("/about", function(req, res) {
  res.render("about");
});


// Server Port

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
