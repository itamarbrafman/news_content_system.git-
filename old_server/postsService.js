const mongoose = require('mongoose');

const myVoteSchema = new mongoose.Schema({
    myVote: {
        type: String,
        enum: ['NONE', 'UPVOTE', 'DOWNVOTE'],
        required: true,
        default: 'NONE'
    }
}, { _id: false });

const postsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    uid: {
        type: Number,
        required: true,
        unique: true
    },
    clientIDs: {
        type: [
            {
                clientID: {
                    type: String,
                    required: true
                },
                vote: {
                    type: myVoteSchema,
                    required: true
                }
            }
        ],
        required: true,
        default: []
    },
    totalUpvotes: {
        type: Number,
        required: true,
        default: 0
    },
    totalDownvotes: {
        type: Number,
        required: true,
        default: 0
    }
});

const counterSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    value: { 
        type: Number, 
        default: 0 
    }
});
    
const Counter = mongoose.model('Counter', counterSchema);    

const Posts = mongoose.model('Posts', postsSchema);

module.exports = { Posts, Counter };