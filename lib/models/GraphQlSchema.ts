import {buildSchema} from 'graphql';


const schema = buildSchema(`

    type CommentMeta {
        owner: User!
        date: String!
        text: String!
        parentPost: Post!
        parentComment: Comment!
        locked: Boolean
    }

    type Comment {
        _id: ID!
        meta: CommentMeta!
        replies: [ID!]!
    }

    type PostMeta {
        owner: String!
        date: String!
        text: String!
        locked:Boolean
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

    type Account {
        _id: ID!
        user: ID!
        role: UserTypes!
        isActive: Boolean!
        isConfirmed: Boolean!
    }

    type User {
        _id: ID!
        image: String
        email: String!
        phone: Int!
        city: String!
        name: String
        gender: String
        dateOfBirth: String
        description: String
        interests: [String!]
        invitations: [CommunityMeta!]
        memberOf: [CommunityMappings!]
    }

    type UserAddables {
        email: String!
        phone: Int!
        city: String!
        role: String!
    }

    type UserEditables {
        image: String
        phone: Int
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
        community: [Community!]!
        post(pid: ID!): Post
        comment(commid: ID!): Comment
    }

    type Mutation {
        addUser(userDetails: UserAddables!): User
        editUser(uid: ID!, newData: UserEditables!): User
        editAccount(uid: ID!, newData: Account!): Account
        addCommunity(communityDetails: CommunityMeta!): Community
        editCommunity(cid: ID!, newData: CommunityMeta!): Community
        addCommunityMember(cid: ID!, member: ID!): Boolean
        makeCommunityAdmin(cid: ID!, member: ID!): Boolean
        removeCommunityAdmin(cid: ID!, member: ID!): Boolean
        requestCommunityActions(cid: ID!, member: ID!, action: CommunityRequestActions): Boolean
        removeCommunityMember(cid: ID!, member: ID!): Boolean
        addPost(postDetails: PostMeta!): Post
        editPost(pid: ID!, newData: PostMeta!):Post
        removePost(pid: ID!): Boolean
        addComment(commentDetails: CommentMeta): Comment
        editComment(commid: ID!, newData: CommentMeta): Comment
        removeComment(commid: ID!): Boolean      
    }
`);