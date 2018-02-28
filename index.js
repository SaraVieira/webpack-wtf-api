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

const getUrl = url => `https://meta.webpack.wtf/?url=${url}`

const GetData = link =>
  fetch(getUrl(link.url))
    .then(rsp => rsp.json())
    .then(meta => ({
      ...link,
      meta
    }))

const resolvers = {
  Query: {
    allLinks: async () => {
      const response = await client.getEntries()
      const results = await response.items
        .map(rsp => rsp.fields)
        .map(link => GetData(link))

      return results
    },
    category: async (_, { category }) => {
      const response = await client.getEntries({
        content_type: 'links',
        'fields.type': category
      })
      const results = await response.items
        .map(rsp => rsp.fields)
        .map(link => GetData(link))

      return results
    },
    paid: async (_, { paid }) => {
      const response = await client.getEntries({
        content_type: 'links',
        'fields.paid': paid
      })
      const results = await response.items
        .map(rsp => rsp.fields)
        .map(link => GetData(link))

      return results
    }
  }
}

const server = new GraphQLServer({ typeDefs, resolvers })

server.start(() => console.log('Server is running on localhost:4000'))
