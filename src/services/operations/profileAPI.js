import { toast } from "react-hot-toast"

import { setLoading, setUser } from "../../slices/profileSlice"
import { apiConnector } from "../apiConnector"
import { profileEndpoints } from "../apis"
import { logout } from "./authAPI"

const {
  GET_USER_DETAILS_API,
} = profileEndpoints

export function getUserDetails(token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    dispatch(setLoading(true))
    try {
      const response = await apiConnector("GET", GET_USER_DETAILS_API, null, {
        Authorization: `Bearer ${token}`,
      })
      console.log("GET_USER_DETAILS API RESPONSE............", response)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      const userData = response.data.data;

      // Set default image if none exists
      const userImage = userData.image
        ? userData.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${userData.firstName} ${userData.lastName}`

      // Create complete user object
      const completeUserData = {
        ...userData,
        image: userImage
      }

      console.log("Setting user data in Redux:", completeUserData)

      // Update Redux store
      dispatch(setUser(completeUserData))

      // Also update localStorage to keep in sync
      localStorage.setItem("user", JSON.stringify(completeUserData))

      return completeUserData
    } catch (error) {
      console.log("GET_USER_DETAILS API ERROR............", error)

      // Don't show error toast or logout on initial load
      if (navigate) {
        toast.error("Could Not Get User Details")

        // Only logout if it's an authentication error
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          dispatch(logout(navigate))
        }
      }
    } finally {
      toast.dismiss(toastId)
      dispatch(setLoading(false))
    }
    return null
  }
}