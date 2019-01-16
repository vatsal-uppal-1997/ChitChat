import {buildSchema} from 'graphql';


export const schema = buildSchema(`

    type CommentMeta {
        owner: User!
        date: String!
        text: String!
        parentPost: Post!
        parentComment: Comment!
        locked: Boolean
    }

    input CommentMetaInput {
        owner: ID!
        date: String!
        text: String!
        parentPost: ID!
        parentComment: ID!
        locked: Boolean
    }

    type Comment {
        _id: ID!
        meta: CommentMeta!
        replies: [ID!]!
    }

    type PostMeta {
        owner: User!
        date: String!
        text: String!
        locked:Boolean
    }

    input PostMetaInput {
        owner: String!
        date: String!
        text: String!
        locked: Boolean
    }

    type Post {
        _id: ID!
        meta: PostMeta!
        comments: [Comment!]!
    }

    enum CommunityPrivileges {
        admin
        member
        owner
        requested
    }

    enum CommunityRequestActions {
        accept
        reject
    }

    type CommunityMeta {
        owner: User!
        name: String!
        image: String!
        description: String!
        isOpen: Boolean!
    }

    input EditCommunityMeta {
        name: String
        image: String
        description: String
        isOpen: Boolean
    }

    input CommunityMetaInput {
        name: String!
        image: String!
        description: String!
        isOpen: Boolean!
    }

    type Community {
        _id: ID!
        meta: CommunityMeta!
        admins: [User!]!
        members: [User!]!
        requests: [User!]!
        posts: [Post!]!
    }

    type CommunityMappings {
        community: CommunityMeta
        status: CommunityPrivileges
    }

    enum UserTypes {
        admin
        user
        communitybuilder
    }

    type Account {
        _id: ID!
        user: ID!
        role: UserTypes!
        isActive: Boolean!
        isConfirmed: Boolean!
    }

    input AccountInput {
        role: UserTypes!
        isActive: Boolean!
        isConfirmed: Boolean!
    }

    type User {
        _id: ID!
        image: String
        email: String!
        phone: String!
        city: String!
        name: String
        gender: String
        dateOfBirth: String
        description: String
        interests: [String!]
        invitations: [CommunityMeta!]
        memberOf: [CommunityMappings!]
    }

    input UserAddables {
        email: String!
        phone: String!
        city: String!
        role: String!
        password: String!
    }

    input UserEditables {
        image: String
        phone: String
        city: String
        name: String
        gender: String
        dateOfBirth: String
        description: String
        interests: [String!]
    }

    type Query {
        user(uid: ID!): User
        users: [User!]!
        account(uid: ID!): Account
        community(cid: ID!): Community
        communities: [Community!]!
        post(pid: ID!): Post
        comment(commid: ID!): Comment
    }

    type Mutation {
        addUser(userDetails: UserAddables!): ID
        editUser(uid: ID!, newData: UserEditables!): ID
        changeUserPassword(uid: ID!, password:String!): Boolean
        editAccount(uid: ID!, newData: AccountInput!): ID
        addCommunity(communityDetails: CommunityMetaInput!): ID
        editCommunity(cid: ID!, newData: EditCommunityMeta!): ID
        joinCommunity(cid: ID!, member: ID!): Boolean
        removeCommunityMember(cid: ID!, member: ID!): Boolean
        makeCommunityAdmin(cid: ID!, member: ID!): Boolean
        removeCommunityAdmin(cid: ID!, member: ID!): Boolean
        requestCommunityActions(cid: ID!, member: ID!, action: CommunityRequestActions): Boolean
        addPost(postDetails: PostMetaInput!): Post
        editPost(pid: ID!, newData: PostMetaInput!):Post
        removePost(pid: ID!): Boolean
        addComment(commentDetails: CommentMetaInput): Comment
        editComment(commid: ID!, newData: CommentMetaInput): Comment
        removeComment(commid: ID!): Boolean      
    }
`);