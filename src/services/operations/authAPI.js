import { toast } from "react-hot-toast"

import { setLoading, setToken } from "../../slices/authSlice"
import { setUser } from "../../slices/profileSlice"
import { apiConnector } from "../apiConnector"
import { endpoints, profileEndpoints } from "../apis"

const {
  SENDOTP_API,
  SIGNUP_API,
  LOGIN_API,
  RESETPASSTOKEN_API,
  RESETPASSWORD_API,
} = endpoints

const {
  GET_CARD_ID_API,
} = profileEndpoints

export function sendOtp(setAns,contactType,contactValue, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    dispatch(setLoading(true))
    try {
      const response = await apiConnector("POST", SENDOTP_API, {
        contactType,
        contactValue,
      })
      console.log("SENDOTP API RESPONSE............", response)

      console.log(response.data.success)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      setAns(response.data.otp);
      toast.success("OTP Sent Successfully")
      // navigate("/verify-email")
    } catch (error) {
      console.log("SENDOTP API ERROR............", error)
      toast.error("Could Not Send OTP")
    }
    dispatch(setLoading(false))
    toast.dismiss(toastId)
  }
}

export function signUp(
  formData,
  navigate,
) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    dispatch(setLoading(true))
    try {
      console.log(formData)
      const response = await apiConnector("POST", SIGNUP_API,
        formData
      )

      console.log("SIGNUP API RESPONSE............", response)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      // Check if Arogya Netra Card was generated (for User account type)
      if (response.data.user.accountType === "User" && response.data.user.arogyaNetraCard) {
        toast.success("Signup Successful! Your Arogya Netra Card has been generated.")
      } else {
        toast.success("Signup Successful!")
      }

      // For regular users, navigate to profile completion page
      if (response.data.user.accountType === "User") {

        // Navigate to profile completion page
        console.log("1")
        navigate("/complete-profile")
      } else {
        // For other account types, navigate to login
        navigate("/login")
      }
    } catch (error) {
      console.log("SIGNUP API ERROR............", error)
      toast.error("Signup Failed")
      navigate("/signup")
    }
    dispatch(setLoading(false))
    toast.dismiss(toastId)
  }
}

export function login(email, password, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    dispatch(setLoading(true))
    try {
      // Step 1: Login and get token
      const response = await apiConnector("POST", LOGIN_API, {
        email,
        password,
      })

      console.log("LOGIN API RESPONSE............", response)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      // Set token in Redux and localStorage
      const token = response.data.token
      dispatch(setToken(token))
      localStorage.setItem("token", JSON.stringify(token))

      // Set temporary user data
      const userImage = response.data?.user?.image
        ? response.data.user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.user.firstName} ${response.data.user.lastName}`

      const tempUserData = {...response.data.user, image: userImage}

      console.log(tempUserData)

      // Set temporary user data in Redux and localStorage
      dispatch(setUser(tempUserData))
      localStorage.setItem("user", JSON.stringify(tempUserData))

      toast.success("Login Successful")

      // Navigate based on account type
      if(tempUserData.accountType === "User") {
        // Check if profile is complete before redirecting
        if (tempUserData.additionalDetails && tempUserData.additionalDetails.isProfileComplete) {
          navigate("/user-dashboard")
        } else {
          navigate("/complete-profile")
        }
      } else if(tempUserData.accountType === "Doctor") {
        navigate("/professional-dashboard")
      }
    } catch (error) {
      console.log("LOGIN API ERROR............", error)
      toast.error("Login Failed")
    } finally {
      dispatch(setLoading(false))
      toast.dismiss(toastId)
    }
  }
}

export function getPasswordResetToken(email, setEmailSent) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    dispatch(setLoading(true))
    try {
      const response = await apiConnector("POST", RESETPASSTOKEN_API, {
        email,
      })

      console.log("RESETPASSTOKEN RESPONSE............", response)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      toast.success("Reset Email Sent")
      setEmailSent(true)
    } catch (error) {
      console.log("RESETPASSTOKEN ERROR............", error)
      toast.error("Failed To Send Reset Email")
    }
    toast.dismiss(toastId)
    dispatch(setLoading(false))
  }
}

export function resetPassword(password, confirmPassword, token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    dispatch(setLoading(true))
    try {
      const response = await apiConnector("POST", RESETPASSWORD_API, {
        password,
        confirmPassword,
        token,
      })

      console.log("RESETPASSWORD RESPONSE............", response)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      toast.success("Password Reset Successfully")
      navigate("/login")
    } catch (error) {
      console.log("RESETPASSWORD ERROR............", error)
      toast.error("Failed To Reset Password")
    }
    toast.dismiss(toastId)
    dispatch(setLoading(false))
  }
}

export function logout(navigate) {
  return (dispatch) => {
    dispatch(setToken(null))
    dispatch(setUser(null))
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    toast.success("Logged Out")
    navigate("/login")
  }
}

export function getCardId(setCardId, setIssueDate, setLoading) {
  return async (dispatch) => {
    setLoading(true)
    try {
      const token = JSON.parse(localStorage.getItem("token"))
      console.log("Fetching card ID with token:", token)

      const response = await apiConnector("POST", GET_CARD_ID_API, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })

      console.log("Card ID API response:", response.data)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      const { cardId, issueDate } = response.data.cardDetails
      console.log("Received card ID:", cardId, "Issue date:", issueDate)

      // Call the setCardId callback with the ID
      setCardId(cardId)

      // Format and set the issue date
      const formattedDate = new Date(issueDate).toLocaleDateString()
      setIssueDate(formattedDate)

      // Update user in Redux store with the new card details
      const user = JSON.parse(localStorage.getItem("user"))
      if (user) {
        const updatedUser = {
          ...user,
          arogyaNetraCard: {
            ...user.arogyaNetraCard,
            cardId,
            issueDate,
            status: 'active'
          }
        }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        dispatch(setUser(updatedUser))
      }

      return cardId
    } catch (error) {
      console.log("GET CARD ID API ERROR............", error)
      toast.error("Could not get card ID. Please try again.")
      return null
    } finally {
      setLoading(false)
    }
  }
}
