import pool from '/app/src/lib/db.js'

async function getListMovies(req, res) {
  // Destructure the query
  const {
    page,
    minimum_rating,
    genre,
    query_term,
    sort_by,
    order_by
  } = req.query

  try {
    const ytsBaseUrl = 'https://yts.mx/api/v2/list_movies.json'

    // Build the query here
    let url = `${ytsBaseUrl}`
    if (+page > 1) {
      // console.log('requested page', page)
      url += `?page=${+page}`
    } else{
      // console.log('requested page', page)
      url += '?page=1'
    }

    if (+minimum_rating > 0) {
      // console.log('added minimum_rating', minimum_rating, typeof minimum_rating)
      url += `&minimum_rating=${+minimum_rating}`
    }

    if (sort_by !== 'null') {
      // console.log('added sort_by', sort_by, typeof sort_by)
      url += `&sort_by=${sort_by}`
    } else {
      url += `&sort_by=year&order_by=desc`
    }

    if (order_by !== 'null') {
      // console.log('added order_by', order_by, typeof order_by)
      url += `&order_by=${order_by}`
    }
    if (genre !== 'null') {
      // console.log('added genre', genre, typeof genre)
      url += `&genre=${genre}`
    }

    if (query_term && query_term !== '' && query_term !== 'null') {
      // console.log('added query_term', query_term, typeof query_term)
      url += `&query_term=${query_term.replace(/\s/g, '+')}`
    }
    console.log(url) // testing
    const response = await fetch(url)
    const { data } = await response.json()
    
    // console.log(data.movies.map(m => m.title)) //  testing
    if (data.movie_count > 0 && data?.movies?.length > 0) {
      const movies = data.movies.map(m => ({
        // consider extracting more info here
        title:      m.title,
        imdbId:     m.imdb_code,
        year:       m.year,
        imdbRating: m.rating,
        coverUrl:   m.large_cover_image,
        synopsis:   m.synopsis,
        genres:     m.genres,
        torrents:   m.torrents
      }))
      return res.status(200).json({ movies })
    } else {
      return res.status(200).json({
        params: req.query,
        error: 'no movies found'
      })
    }
  } catch (error) {
    console.log(error)
  }
}

export { getListMovies }