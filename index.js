const { GraphQLServer } = require('graphql-yoga')
const contentful = require('contentful')
const management = require('contentful-management')
const fetch = require('isomorphic-fetch')
const validUrl = require('valid-url')
require('now-env')

const links = contentful.createClient({
  space: 't22ip2e58gad',
  accessToken: process.env.TOKEN
})

const entries = management.createClient({
  accessToken: process.env.MANAGEMENT_TOKEN
})

const typeDefs = `
  type Query {
    allLinks: [Link],
    category(category: String): [Link]
    paid(paid: Boolean): [Link]
  }
  type Mutation {
    addLink(url: String, type: [String], paid: Boolean): Link
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
  Mutation: {
    addLink: async (_, { url, type, paid }) => {
      if (!validUrl.isUri(url)) {
        throw Error('Not an Valid URL')
      }

      if (!type || !url) {
        throw Error('Type and URL need a value')
      }

      const newLink = await entries
        .getSpace('t22ip2e58gad')
        .then(space =>
          space.createEntry('links', {
            fields: {
              url: {
                'en-US': url
              },
              type: {
                'en-US': type
              },
              paid: {
                'en-US': paid
              }
            }
          })
        )
        .then(rsp => rsp.fields)
        .then(d => ({
          url: d.url['en-US'],
          paid: d.paid['en-US'],
          type: d.type['en-US']
        }))
        .catch(console.error)

      console.log(newLink)
      return newLink
    }
  },
  Query: {
    allLinks: async () => {
      const response = await links.getEntries()
      const results = await response.items
        .map(rsp => rsp.fields)
        .map(link => GetData(link))

      return results
    },
    category: async (_, { category }) => {
      const response = await links.getEntries({
        content_type: 'links',
        'fields.type': category
      })
      const results = await response.items
        .map(rsp => rsp.fields)
        .map(link => GetData(link))

      return results
    },
    paid: async (_, { paid }) => {
      const response = await links.getEntries({
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
