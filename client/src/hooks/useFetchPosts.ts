import { useState, useEffect } from 'react';

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

export const useFetchPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
    console.log("useFetchPosts render, posts:", posts);
  useEffect(() => {
    const fetchPosts = async () => {
      const clientID = localStorage.getItem('clientID');
      try {
          const response = await fetch(`http://localhost:3000/api/posts/${clientID}`);        
          console.log("/api/posts/${clientID}", `/api/posts/${clientID}`);
          if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data: Post[] = await response.json();
            console.log("clientID:", clientID);
            console.log("data:", data);
        setPosts(data);
        console.log("useEffect FETCH, posts:", posts);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return { posts, setPosts, loading, error };
};
