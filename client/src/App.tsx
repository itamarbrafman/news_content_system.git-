import { useState } from 'react';
import AddPost from './components/AddPost';
import AllPosts from './components/AllPosts';
import { useFetchPosts } from './hooks/useFetchPosts';

enum myVoteStatus {
  NONE = 'NONE',
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
}

interface Post {
  uid: number;
  title: string;
  text: string;
  myVote: myVoteStatus;
  totalUpvotes: number;
  totalDownvotes: number;
}

function App() {
  const { posts, setPosts, loading, error } = useFetchPosts();
  console.log("App render, posts:", posts);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <AllPosts posts={posts} setPosts={setPosts}/>
      <AddPost setPosts={setPosts}/>
    </>
  );
}

export default App
