import { defineType } from "sanity";

// {
//   "_createdAt": "2026-05-08T18:06:01Z",
//   "_id": "root-tree",
//   "_originalId": "drafts.root-tree",
//   "_rev": "72f2b401-f3f8-4759-973a-9ab642538a42",
//   "_system": {
//     "base": {
//       "id": "root-tree",
//       "rev": "u2c7X9a99uVUgCuK9BpDNK"
//     }
//   },
//   "_type": "sanity.tree",
//   "_updatedAt": "2026-05-08T19:52:45Z",
//   "title": "Change form Root"
// }

const tree = defineType({
    name: "sanity.tree",
    type: "document",
    title: "Tree",
    fields: [
        {
            name: "title",
            type: "string",
            title: "Title"
        },
    ],
});

// {
//   "_createdAt": "2026-05-08T18:39:14Z",
//   "_id": "7miJbm64XgYIxsADFlQ2Js",
//   "_originalId": "drafts.7miJbm64XgYIxsADFlQ2Js",
//   "_rev": "4d6d2839-269d-4bca-8b65-03e2bde1472e",
//   "_system": {
//     "base": {
//       "id": "7miJbm64XgYIxsADFlQ2Js",
//       "rev": "7miJbm64XgYIxsADFlQ2Ey"
//     }
//   },
//   "_type": "sanity.directory",
//   "_updatedAt": "2026-05-08T18:39:56Z",
//   "name": "The Moving Folder",
//   "parent": {
//     "_ref": "u2c7X9a99uVUgCuK9BfFbm",
//     "_type": "reference"
//   }
// }

const directory = defineType({
    name: "sanity.directory",
    type: "document",
    title: "Directory",
    fields: [
        {
            name: "name",
            type: "string",
            title: "Name"
        },
        {
            name: "parent",
            type: "reference",
            title: "Parent",
            to: [
                { type: "sanity.tree" },
                { type: "sanity.directory" },
            ],
        },
    ],
});

// {
//   "_createdAt": "2026-05-08T18:55:10Z",
//   "_id": "7miJbm64XgYIxsADFlZ7xA",
//   "_originalId": "7miJbm64XgYIxsADFlZ7xA",
//     "_rev": "7miJbm64XgYIxsADFlZ7sG",
//     "_type": "page",
//     "_updatedAt": "2026-05-08T18:55:10Z",
//     "parent": {
//       "_ref": "7miJbm64XgYIxsADFlZ7F2",
//       "_type": "reference"
//     },
//     "title": "Sneakers"
// }

const page = defineType({
    name: "page",
    type: "document",
    title: "Page",
    fields: [
        {
            name: "title",
            type: "string",
            title: "Title"
        },
        {
            name: "parent",
            type: "reference",
            title: "Parent",
            to: [
                { type: "sanity.directory" },
            ],
        },
    ],
});


export const schemaTypes = [tree, directory, page]
