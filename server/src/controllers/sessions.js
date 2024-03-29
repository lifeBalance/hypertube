import { findByUsername, findByEmail, createUser } from '../models/user.js'
// To verify hashed passwords
import { verifyPassword } from '../lib/auth.js'
// To create JSON Web Tokens
import jwt from 'jsonwebtoken'

// For generating random usernames (the one of GitHub may be taken!!)
import { customAlphabet } from 'nanoid/async'
const allowedCharacters = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const nanoid = customAlphabet(allowedCharacters, 10)

async function login(req, res) {
  // user data has been validated by middleware
  const { username, password } = req.body
  const user = await findByUsername({ username })

  // if the user doesn't exist...
  if (!user) {
    return res.status(401).json({ error: 'user does not exist' })
  }

  /*  Must use null-coallescing operator (??) in case the user password does
    not exist, i.e., it's null (for example when she signed up using OAuth) */
  const passwordMatch = await verifyPassword(password, user.password ?? '')

  // if the passwords don't match...
  if (!passwordMatch) {
    return res.status(401).json({ error: 'wrong credentials' })
  }

  if (!user.confirmed) {
    return res.status(200).json({
      unconfirmed: true
    })
  }

  // Generate the access_token
  const accessToken = jwt.sign({
    sub:    user.id
  }, process.env.SECRET_JWT_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXP })

  res.status(200).json({
    // For logging purposes. Messages are i18n'ed in front-end
    message:      'Successful log in',
    uid:          user.id,
    username:     user.username,
    accessToken:  accessToken,
    profilePic:   user.profile_pic
  })
}

async function logout(req, res) {
  res.status(200).json({ message: 'successfully logged out' })
}

async function oauthGitHub(req, res) {
  // Parse the code (after pressing the GitHub green button)
  const code = req.body.code
  // console.log(`code: ${code}`) // testing
  if (!code) {
    return res.status(401).json({
      error: 'bad request'
    })
  }

  // URL for requesting an access token from GitHub
  const urlAccessToken = 'https://github.com/login/oauth/access_token?'
  const redirectUri = process.env.PRODUCTION === 1 ?
  'http://localhost/oauth/github'
  :
  'http://localhost:5173/oauth/github'

  console.log('PRODUCTION?', process.env.PRODUCTION) // testing

  // Necessary parameteres for requesting the token
  const queryParams = new URLSearchParams({
    client_id:      process.env.GITHUB_CLIENT_ID,
    client_secret:  process.env.GITHUB_CLIENT_SECRET,
    code:           code,
    // redirect_uri:   'http://localhost:5173/oauth/github' // development
    // redirect_uri:   'http://localhost/oauth/github'         // production
    redirect_uri:   redirectUri                         // dynamic
  })
  // Make request to get the GitHub access token (needed to get user data)
  const response = await fetch(urlAccessToken + queryParams, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
  })
  
  const data = await response.json()
  // If there's an error we bail!
  if (data.error) {
    return res.status(401).json({
      error: data.error_description
    })
  }
  // Now that we have the token, let's pull out data from the GitHub API!
  const GitHubAccessToken = data.access_token
  console.log(`Response: ${JSON.stringify(data)}`) // testing
  
  // URL for getting just the EMAILS from user's GitHub account
  const urlEmail = 'https://api.github.com/user/emails'
  const response2 = await fetch(urlEmail, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // Use the GitHub access token to pull user email from the API
      'Authorization': 'Bearer ' + GitHubAccessToken
    }
  })
  const data2 = await response2.json()
  // console.log(JSON.stringify(data2)) // testing
  // return res.status(200).json({ data2 })
  // If the email
  const email = data2[0].email
  // console.log(email) // testing
  
  // URL for getting extra information from user's GitHub account (email)
  // const urlUser = 'https://api.github.com/user' // info we don't need

  const user = await findByEmail({ email })

  // If the email doesn't exist in the DB, we'll create a new user!
  if (!user) {
    const username = await nanoid()
    const newUser = {
      username,
      email,
      firstname:  'Anonymous',
      lastname:   '',
      password:   '',
      confirmed:  true
    }
    console.log(`creating user...`) // testing
    const createdUser = await createUser(newUser)
    console.log(`user created: ${createdUser.id}`)
    
    // Generate an access_token
    const accessToken = jwt.sign({
      sub:    createdUser.id
    }, process.env.SECRET_JWT_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXP })

    // If there was no problem creating the user
    res.status(200).json({
      message:      'successfully signed up',
      newUser:      true,
      accessToken:  accessToken,
      uid:          createdUser.id
    })
  } else {
    // Generate an access_token
    const accessToken = jwt.sign({
      sub:    user.id
    }, process.env.SECRET_JWT_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXP })

    // console.log(user) // testing

    /* Send response back to the existing user. */
    res.status(200).json({
      message:      'successfully logged in',
      accessToken:  accessToken,
      uid:          user.id,
      username:     user.username,
      profilePic:   user.profile_pic
    })
  }
}

async function oauth42(req, res) {
  // Parse the code (after pressing the 42 authorize button)
  const code = req.body.code
  console.log(`code: ${code}`) // testing
  if (!code) {
    return res.status(401).json({
      error: 'bad request: no code was supplied'
    })
  }

  // URL for requesting an access token from 42 (don't forget the question mark!)
  const urlAccessToken = 'https://api.intra.42.fr/oauth/token?'
  
  const redirectUri = +process.env.PRODUCTION === 1 ?
  'http://localhost/oauth/42'
  :
  'http://localhost:5173/oauth/42'
  // console.log('PRODUCTION?', process.env.PRODUCTION) // testing
  // console.log('redirectUri?', redirectUri) // testing

  // Necessary parameters for requesting the token
  const queryParams = new URLSearchParams({
    grant_type:     'authorization_code',
    client_id:      process.env.FORTY_TWO_CLIENT_ID,
    client_secret:  process.env.FORTY_TWO_CLIENT_SECRET,
    code:           code,
    redirect_uri:   redirectUri   // Set dynamically, depending on env. var.
  })

  // Make request to get the 42 access token (needed to get user data)
  const response = await fetch(urlAccessToken + queryParams, {
    method: 'POST',
    headers: { 'Accept': 'application/json' }
  })
  
  const dataWithToken = await response.json()
  // console.log('42 token:',dataWithToken) // testing
  // If there's an error we bail!
  if (dataWithToken.error) {
    console.log('Error getting data token:', dataWithToken.error) // testing
    return res.status(401).json({
      error: dataWithToken.error
    })
  }
  // Now that we have the token, let's pull out data from the 42 API!
  const fortyTwoAccessToken = dataWithToken.access_token
  // console.log(`Response: ${fortyTwoAccessToken}`) // testing
  
  // URL for getting information from user's 42 account
  const urlUser = 'https://api.intra.42.fr/v2/me'
  const responseUser = await fetch(urlUser, {
    method: 'GET',
    headers: {
      // 'Accept': 'application/json',
      // 'Content-Type': 'application/json',
      // Use the GitHub access token to pull user email from the API
      Authorization: 'Bearer ' + fortyTwoAccessToken
    }
  })
  // console.log(responseUser) // testing
  const userData = await responseUser.json()
  // console.log('user data: ', JSON.stringify(userData)) // testing

  // Let's pull the data we need from the 42 API
  const user42 = {  
    email:        userData.email,
    firstname:    userData.first_name,
    lastname:     userData.last_name,
    profilePic:  userData.image.link
  }

  // If the email already exists in the DB
  const existingUser = await findByEmail({ email: user42.email })

  // If the email doesn't exist in the DB, we'll create a new user!
  if (!existingUser) {
    const username = await nanoid() // create a random string for the username
    const newUser = {
      username,
      email:            user42.email,
      firstname:        user42.firstname,
      lastname:         user42.lastname,
      profile_pic:      user42.profilePic,
      // No password needed when OAuthing, so an empty string will do!
      password:         '',
      confirmed:        true
    }
    // console.log(`creating user...`) // testing
    const createdUser = await createUser(newUser)
    // console.log(`user created: ${createdUser.id}`)
    
    // Generate an access_token
    const accessToken = jwt.sign({
      sub:    createdUser.id
    }, process.env.SECRET_JWT_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXP })

    // If there was no problem creating the user
    res.status(200).json({
      message:      'successfully signed up',
      newUser:      true,
      accessToken:  accessToken,
      uid:          createdUser.id,
      username:     createdUser.username,
      profilePic:   createdUser.profile_pic
    })
  } else {
    // Generate an access_token
    const accessToken = jwt.sign({
      sub:    existingUser.id
    }, process.env.SECRET_JWT_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXP })

    // console.log(user) // testing

    /* Send response back to the existing user. */
    res.status(200).json({
      message:      'successfully logged in',
      accessToken:  accessToken,
      uid:          existingUser.id,
      username:     existingUser.username,
      profilePic:   existingUser.profile_pic
    })
  }
}

export { login, logout, oauthGitHub, oauth42 }
