import { useRef, memo, useState, useEffect } from 'react';   

interface FormDataWithUID {
    [key: string]: FormDataEntryValue;
}

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

type SetPosts = React.Dispatch<React.SetStateAction<Post[]>>;

function setItemIfNotExists(key: string, value: string) {
    if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, value);
        console.log(`Key "${key}" set to "${value}"`);
    } else {
        console.log(`Key "${key}" already exists with value "${localStorage.getItem(key)}"`);
    }
}

const AddPost: React.FC<{ setPosts: SetPosts }> = memo(({ setPosts }) => {
    const formRef = useRef<HTMLFormElement>(null);

    console.log("AddPost render");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        console.log("handleSubmit in AddPost");

        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
        const submittedData = Object.fromEntries(formData.entries()) as FormDataWithUID;
        
        if (formRef.current) {
            console.log("formRef.current.reset() in AddPost");
            formRef.current.reset();
        }
   
        try {
            const response = await fetch('http://localhost:3000/api/save_post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submittedData)
            });
            
            let uid: any = {};
            
            if (response.ok) {
                uid = await response.json();
                
                const existentClientID: string | null = localStorage.getItem('clientID');
                if (existentClientID == null) {
                    console.log("existentClientID:", existentClientID);
                    setItemIfNotExists('clientID', uid.toString());
                } 

                console.log("AddPost, uid:", uid);
                const newPost: Post = {
                    title: submittedData.title as string,
                    text: submittedData.text as string,
                    uid: uid,
                    myVote: myVoteStatus.NONE,
                    totalUpvotes: 0,
                    totalDownvotes: 0
                };

                console.log("AddPost!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!, newPost:", newPost);

                setPosts((prevPosts: Post[]) => [...prevPosts, newPost]);

            } else {
                console.error('Request failed with status:', response.status);
            }
            
            if (uid.error) {
                alert(uid.error);
            }
            
            
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    return (
        <form onSubmit={handleSubmit} ref={formRef}>
            <div>
                <label htmlFor="post_title">Post Title:</label>
                <input id="post_title" name="title" required />  
                <label htmlFor="post_text">Post Text:</label>
                <textarea id="post_text" name="text" required rows={20} cols={100}></textarea>                    
                <button>Add Post</button>
            </div>
        </form>
    );
});

export default AddPost;
