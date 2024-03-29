import express from 'express'
import { getListMovies, getMovie } from '../controllers/movies.js'

import { validateToken } from '../middlewares/validateToken.js' // plug this middleware later ;-)

const router = express.Router()
// GET /api/movies/:id   ==> fetch a given movie from API and send to client.
router.get('/movies/:id', validateToken, getMovie)

// GET /api/movies   ==> fetch movies from APIs and send to client.
router.get('/movies', validateToken, getListMovies)

export default router
