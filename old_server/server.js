const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');

const { Posts, Counter } = require('./postsService'); 

let lastUID = 0;

const dbURI = "mongodb+srv://itamarbrafman:8ooqF0HXTDpCdJsv@cluster0.xudn2yd.mongodb.net/?retryWrites=true&w=majority";
const app = express();
const port = 3000;
app.use(cors());

app.use(express.json());


async function getPostsFilteredByClientID(clientID) {
  try {
      const posts = await Posts.aggregate([
          // Stage 1: Project necessary fields and filter clientIDs array for matching clientID
          {
              $project: {
                  clientIDs: {
                      $arrayElemAt: [
                          {
                              $filter: {
                                  input: "$clientIDs", // Field to filter
                                  as: "client", // Variable name for each element
                                  cond: { $eq: ["$$client.clientID", clientID] } // Condition to filter
                              }
                          },
                          0 // Return the first matching element
                      ]
                  },
                  title: 1, // Include title field
                  text: 1,  // Include text field
                  uid: 1,   // Include uid field
                  totalUpvotes: 1, // Include totalUpvotes field
                  totalDownvotes: 1 // Include totalDownvotes field
              }
          },
          // Stage 2: Project necessary fields and include the vote
          {
              $project: {
                  title: 1, // Include title field
                  text: 1,  // Include text field
                  uid: 1,   // Include uid field
                  totalUpvotes: 1, // Include totalUpvotes field
                  totalDownvotes: 1, // Include totalDownvotes field
                  myVote: {
                      $ifNull: ["$clientIDs.vote.myVote", 'NONE'] // If myVote is null, set it to 'NONE'
                  }
              }
          }
      ]);
      console.log("posts", posts);
      return posts;
  } catch (error) {
      console.error('Error retrieving posts:', error);
      throw error;
  }
}


async function addClientVoteToPost(postID, clientID, myVote, session) {
  try {
      const newClientVote = {
          clientID: clientID,
          vote: {
            myVote: myVote
          }     
       };
      console.log("newClientVote!!!!!!!!1", newClientVote)

      const updateResult = await Posts.findOneAndUpdate(
        { uid: postID, "clientIDs.clientID": clientID },
        { $set: { "clientIDs.$.vote.myVote": myVote } },
        { new: true, useFindAndModify: false, session: session }
      );
  
      if (updateResult) {
        return updateResult;
      } else {
        // If the clientID does not exist, add a new vote entry
        const updatedPost = await Posts.findOneAndUpdate(
          { uid: postID },
          { $push: { clientIDs: newClientVote } },
          { new: true, useFindAndModify: false, session: session }
        );
  
        return updatedPost;
      }
  } catch (error) {
      console.error('Error adding client vote:', error);
      throw error;
  }
}

app.get('/api/posts/:clientID', async (req, res) => {
  console.log("req.params", req.params);
  const clientID = req.params.clientID;
  let posts = [];
  console.log("clientID", clientID)
  try {
    if (clientID !== 'null') {
      posts = await getPostsFilteredByClientID(clientID);
    }
    console.log("Updated post with new vote:", JSON.stringify(posts, null, 2));

      res.status(200).json(posts);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to retrieve posts' });
  }
});


app.post('/api/save_edit', async (req, res) => {
  console.log("req.body", req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const post = await Posts.findOne({ uid: req.body.uid });
    console.log("post", post)
    post.text = req.body.text;
    await post.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Post updated successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }

});

app.post('/api/save_vote_score', async (req, res) => {
  console.log("req.body", req.body);
  const session = await mongoose.startSession();
  const {uid, myVote, clientID, changeUpScore, changeDownScore} = req.body;
  session.startTransaction();
  try {
    console.log("req.body.myVote", req.body.myVote);
    const post = await addClientVoteToPost(uid, clientID, myVote, session);
    post.totalUpvotes = post.totalUpvotes + changeUpScore;
    post.totalDownvotes = post.totalDownvotes + changeDownScore;
    await post.save({ session });
    console.log("Updated post with new vote:", JSON.stringify(post, null, 2));

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Post updated successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }

});

app.post('/api/save_post', async (req, res) => {
  console.log("req.body", req.body);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'postUID' },
      { $inc: { value: 1 } },
      { new: true, upsert: true, session }
    );
    console.log("counter", counter)

    const newUID = counter.value;
    console.log("newUID", newUID)

    const newPost = new Posts({
      uid: newUID,
      ...req.body
    });
    console.log("newPost1", newPost)

    await newPost.save({ session });

    await session.commitTransaction();
    session.endSession();
    console.log("newPost2", newPost)
    res.status(201).json(newPost.uid);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(500).json({ error: 'Failed to create post' });

  }
});

async function initializeDatabase() {
  try {
    await mongoose.connect(dbURI);
    console.log("Database connected");
    const deletedPosts = await Posts.deleteMany({});
    const deletedCounts = await Counter.deleteMany({});
    console.log(`${deletedPosts.deletedCount} documents deleted.`);
    console.log(`${deletedCounts.deletedCount} documents deleted.`);


  } catch (error) {
    console.error('Error:', error);
  }
}

initializeDatabase();

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


