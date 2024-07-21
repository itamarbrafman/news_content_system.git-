import { createSlice, configureStore } from '@reduxjs/toolkit';

interface Post {
    id: number;
    title: string;
    text: string;
  }

const initialPostsState = { allPosts: []};

const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/posts');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

const counterSlice = createSlice({
    name: 'posts',
    initialState: initialPostsState,
    reducers:{
        fetch(state){
            state.allPosts = fetchPosts();
        }
    } 
});

const authSlice = createSlice({
    name: 'auth',
    initialState: initialAuthState,
    reducers:{
        login(state, action){
            state.authenticated = true;
            state.email = action.payload.email
            state.password = action.payload.password
        },
        logout(state){
            state.authenticated = false;
            state.email = '';
            state.password = '';
        }
    } 
});       

export const counterActions = counterSlice.actions;
export const authActions = authSlice.actions;

const store = configureStore({
    reducer:{
        counter: counterSlice.reducer,
        auth: authSlice.reducer
    } 
});

export default store;
