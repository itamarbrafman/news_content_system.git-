import React, { useState, useEffect, useRef } from 'react';

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

interface myVote{
  myUpVote: boolean;
  myDownVote: boolean;
}

type SetPosts = React.Dispatch<React.SetStateAction<Post[]>>;

const AllPosts: React.FC<{ posts: Post[], setPosts: SetPosts }> = ({ posts, setPosts }) => {
  const [showPost, setShowPost] = useState<boolean[]>([]);
  const [editPost, setEditPost] = useState<boolean>(false);
  const [myVoteArr, setMyVoteArr] = useState<myVote[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const editedTextRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMyVoteArr(posts.map(post => ({
      myUpVote: post.myVote === myVoteStatus.UPVOTE,
      myDownVote: post.myVote === myVoteStatus.DOWNVOTE
    })));
  }, [posts]);

  const handleShowPost = (index: number) => {
    if (editPost) {
      alert("Please save or cancel your edit before opening another post");
      return;
    }
    setShowPost((prevShowPosts) => {
      const newShowPost: boolean[] = [];
      newShowPost[index] = !prevShowPosts[index];
      console.log("handleShowPost in AllPosts, newShowPost:", newShowPost);
      return newShowPost;
    });
  };

  const handleEditPost = () => {
    setEditPost(prevEditPost => !prevEditPost);
  };

  const handleCancelEdit = () => {
    setEditPost(false);
  };

  const handleSaveEdit = async (currentIndex: number) => {
    setEditPost(false);
    const uid = posts[currentIndex].uid;
    const text = editedTextRef.current ? editedTextRef.current.value : posts[currentIndex].text;

    const updatedPosts = posts.map((post, index) =>
      index === currentIndex ? { ...post, text } : post
    );
    setPosts(updatedPosts);

    try {
      const response = await fetch('http://localhost:3000/api/save_edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uid, text })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("handleSaveEdit, data:", data);
      } else {
        console.error('Request failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleVote = async (currentIndex: number, clickedVote: keyof myVote, clickedVoteStatus: myVoteStatus) => {
    if (isFetching) return;

    setIsFetching(true);

    const unclickedVote: keyof myVote = clickedVote === 'myUpVote' ? 'myDownVote' : 'myUpVote';

    const uid = posts[currentIndex].uid;
    const newClickedMyVote = !myVoteArr[currentIndex][clickedVote];
  
    const changeClickedScore = newClickedMyVote ? 1 : -1;
    const changeUnclickedScore = myVoteArr[currentIndex][unclickedVote] ? -1 : 0;
    const newMyVoteStatus = newClickedMyVote ? clickedVoteStatus : myVoteStatus.NONE;
  
    setMyVoteArr((prevVoteArr) => {
      const newVoteArr = [...prevVoteArr];
      newVoteArr[currentIndex] = { 
        ...newVoteArr[currentIndex], 
        [clickedVote]: newClickedMyVote, 
        [unclickedVote]: false 
      };
      return newVoteArr;
    });

    const changeUpScore = clickedVote === 'myUpVote' ? changeClickedScore : changeUnclickedScore;
    const changeDownScore = clickedVote === 'myDownVote' ? changeClickedScore : changeUnclickedScore;

    setPosts((prevPosts) => {
      
      const newPosts = prevPosts.map((post, index) =>
        index === currentIndex
          ? {
              ...post,
              myVote: newMyVoteStatus as myVoteStatus,
              totalUpvotes: post.totalUpvotes + changeUpScore,
              totalDownvotes: post.totalDownvotes + changeDownScore,
            }
          : post
      );
      return newPosts;
    });

    const clientID = localStorage.getItem('clientID');

    try {
      const response = await fetch('http://localhost:3000/api/save_vote_score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uid, myVote: newMyVoteStatus, clientID, changeUpScore, changeDownScore })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("handleSaveVote, data:", data);
      } else {
        console.error('Request failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsFetching(false);
    }
  };
  return (
    <div>
      <h1>All Posts</h1>
      <ul>
        {posts.map((post) => {
          const index = post.uid - 1;
          return (
            <li key={post.uid}>
              <button onClick={() => handleShowPost(index)}>{post.title}</button>
              {showPost[index] &&
                <>
                  {editPost ?
                    <>
                      <textarea
                        ref={editedTextRef}
                        defaultValue={post.text}
                      />
                      <button onClick={() => handleSaveEdit(index)}>Save Text</button>
                      <button onClick={handleCancelEdit}>Cancel</button>
                    </> :
                    <>
                      <p>{post.text}</p>
                      <p>My Vote: {post.myVote}</p>
                      <p>Total Upvotes: {post.totalUpvotes}</p>
                      <p>Total Downvotes: {post.totalDownvotes}</p>
                      <button onClick={() => handleVote(index,'myUpVote', myVoteStatus.UPVOTE)}>+</button>
                      <button onClick={() => handleVote(index, 'myDownVote', myVoteStatus.DOWNVOTE)}>-</button>
                      <button onClick={handleEditPost}>Edit</button>
                    </>}
                </>
              }
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AllPosts;
