import express from 'express'
import fetchJson from './helpers/fetch-json.js'

// It's an array of objects containing slug and like#, eg. [{ slug: 'a', likes: 42}]
let likes = []

const app = express()
app.set('view engine', 'ejs')
app.set('views', './views')
app.set('port', process.env.PORT || 8000)
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

app.get('/', (request, response) => {
  fetchJson('https://redpers.nl/wp-json/wp/v2/posts').then((data) => {
    fetchJson('https://fdnd-agency.directus.app/items/redpers_shares').then((share_data) => {
      response.render('index', { articles: data, shares: share_data.data })
    })
  })
})

app.post('/article/:slug', (request, response) => {
  // Zoek in de array de likes voor het huidige artikel
  let huidig = likes.find((like) => {
    return like.slug == request.params.slug
  })

  // Als het huidige artikel nog niet bestaat maken we likes aan
  if (huidig == undefined) {
    likes.push({
      slug: request.params.slug,
      likes: 1,
    })
    // Als het al wel bestaat tellen we er een like bij op
  } else {
    huidig.likes++
  }
  response.redirect(301, `/article/${request.params.slug}`)
})

app.get('/article/:slug', (request, response) => {
  fetchJson(`https://redpers.nl/wp-json/wp/v2/posts/?slug=${request.params.slug}`).then((data) => {
    // Zoek naar de likes voor deze slug en voeg ze toe aan de opgehaalde API data
    let current_likes = likes.find((like) => like.slug == request.params.slug)
    data[0].likes = current_likes?.likes || 0
    response.render('article', { article: data[0] })
  })
})

app.listen(app.get('port'), function () {
  console.log(`Application started on http://localhost:${app.get('port')}`)
})
