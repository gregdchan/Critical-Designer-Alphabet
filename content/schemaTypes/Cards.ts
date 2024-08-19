import { defineField, defineType } from 'sanity';

export const Cards = defineType({
  name: 'cards',
  title: 'Cards',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
    }),
    defineField({
      name: 'CardID',
      type: 'string',
    }),
    defineField({
      name: 'type',
      type: 'string',
    }),
    defineField({
      name: 'color',
      type: 'string',
    }),
    defineField({
      name: 'description',
      type: 'text',
    }),
    defineField({
      name: 'prompt',
      type: 'text',
    }),
    defineField({
      name: 'postId',
      title: 'Post ID',
      type: 'string',
      readOnly: true,
      initialValue: async (document) => {
        // Returns the document's _id, which will be the UUID in Sanity
        return document._id;
      },
    }),
  ],
})