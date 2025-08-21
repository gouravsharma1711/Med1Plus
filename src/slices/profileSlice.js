import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  user: null,
  loading: false,
}

const profileSlice = createSlice({
  name: "profile",
  initialState: initialState,
  reducers: {
    setUser(state, value) {
      console.log("Setting user in Redux store:", value.payload);
      // Create a new state object to ensure React detects the change
      return {
        ...state,
        user: value.payload
      };
    },
    setLoading(state, value) {
      return {
        ...state,
        loading: value.payload
      };
    },
  },
})

export const { setUser, setLoading } = profileSlice.actions

export default profileSlice.reducer
