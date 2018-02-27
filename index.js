const { GraphQLServer } = require('graphql-yoga')
const contentful = require('contentful')
const fetch = require('isomorphic-fetch')
require('now-env')

const client = contentful.createClient({
  space: 't22ip2e58gad',
  accessToken: process.env.TOKEN
})

const typeDefs = `
  type Query {
    allLinks: [Link],
    category(category: String): [Link]
    paid(paid: Boolean): [Link]
  }
  type Meta {
    author: String,
    date: String,
    description: String,
    image: String,
    logo: String,
    publisher: String,
    title: String,
    url: String
  }
  type Link { url: String, type: [String], meta: Meta, paid: Boolean }
`

const resolvers = {
  Query: {
    allLinks: async () => {
      const response = await client.getEntries()
      const fields = response.items.map(rsp => rsp.fields)
      const results = await fields.map(link =>
        fetch(`https://open-graph-webpack.now.sh/?url=${link.url}`)
          .then(rsp => rsp.json())
          .then(meta => ({
            ...link,
            meta
          }))
      )

      return results
    },
    category: async (_, { category }) => {
      const response = await client.getEntries({
        content_type: 'links',
        'fields.type': category
      })
      const fields = response.items.map(rsp => rsp.fields)
      const results = await fields.map(link =>
        fetch(`https://open-graph-webpack.now.sh/?url=${link.url}`)
          .then(rsp => rsp.json())
          .then(meta => ({
            ...link,
            meta
          }))
      )

      return results
    },
    paid: async (_, { paid }) => {
      const response = await client.getEntries({
        content_type: 'links',
        'fields.paid': paid
      })
      const fields = response.items.map(rsp => rsp.fields)
      const results = await fields.map(link =>
        fetch(`https://open-graph-webpack.now.sh/?url=${link.url}`)
          .then(rsp => rsp.json())
          .then(meta => ({
            ...link,
            meta
          }))
      )

      return results
    }
  }
}

const server = new GraphQLServer({ typeDefs, resolvers })

server.start(() => console.log('Server is running on localhost:4000'))
