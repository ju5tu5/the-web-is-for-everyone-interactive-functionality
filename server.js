import express from 'express'
import fetchJson from './helpers/fetch-json.js'

const redpers_url = 'https://redpers.nl/wp-json/wp/v2/posts'
const directus_url = 'https://fdnd-agency.directus.app/items/redpers_shares'

const app = express()
app.set('view engine', 'ejs')
app.set('views', './views')
app.set('port', process.env.PORT || 8000)
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

app.get('/', (request, response) => {
  fetchJson(redpers_url).then((data) => {
    fetchJson(directus_url).then((shares) => {
      // Map de data array uit wordpress, map is een soort 'loop' structuur voor arrays
      data.map((article) =>
        // Gebruik de Object.assign() functie om het aantal shares toe te voegen op het article
        // NB: Object.assign past het 'article' object
        Object.assign(article, {
          // Zoek in shares naar article.slug, koppel het aantal shares of 0 als het niet bestaat
          shares: shares.data.find(({ slug }) => slug == article.slug)?.shares || 0,
        })
      )
      response.render('index', { articles: data })
    })
  })
})

// Failsafe voor als iemand /article intypt zonder slug...
app.get('/article', (request, response) => {
  response.redirect(301, '/')
})

app.post('/article/:slug', (request, response) => {
  fetchJson(`${directus_url}?filter[slug][_eq]=${request.params.slug}`).then(({ data }) => {
    // Doe een PATCH op directus, stuur de id mee als die er is.
    fetchJson(`${directus_url}/${data[0]?.id ? data[0].id : ''}`, {
      method: data[0]?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: request.params.slug,
        shares: data.length > 0 ? data[0].shares + 1 : 1,
      }),
    }).then((result) => {
      console.log(result)
    })
  })
  response.redirect(301, `/article/${request.params.slug}`)
})

app.get('/article/:slug', (request, response) => {
  fetchJson(`${redpers_url}?slug=${request.params.slug}`).then((data) => {
    // fetch de #shares
    response.render('article', { article: data[0] })
  })
})

app.listen(app.get('port'), function () {
  console.log(`Application started on http://localhost:${app.get('port')}`)
})
