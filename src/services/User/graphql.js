import { createModule, gql } from "graphql-modules";
import jwt from "jsonwebtoken";
import keygen from "keygen";
import path from "path";
import fs from "fs";

import { __dirname } from "../../util.js";
import { methods, User } from "./model.js";
import isVerifiedSign from "./Authentication/isVerifiedSign.js";

const userShaper = (user) => ({...user._doc, tokens: tmethods.queries.getByOwner(user.addresses[0])})

export const UserModule = createModule({
  id: "userModule",
  dirname: __dirname,
  typeDefs: [
    gql`
      scalar Upload

      type User {
        _id: ID!
        username: String
        displayName: String
        avatar: String
        bio: String
        setted: Boolean!
        createdAt: String!
        updatedAt: String!
        addresses: [String!]!
        followers: [String]
        followings: [String]
        twitter: String
        instagram: String
      }

      type Query {
        me: User
        user(_id: ID!): User
        users: [User!]!
      }

      input PersonalInfoInput {
        displayName: String!
        avatar: Upload
        bio: String
      }

      type Mutation {
        getNonce(address: String!): String!
        getToken(address: String!, signature: String!): String!

        completeProfile(
          avatar: Upload
          displayName: String!
          username: String!
          bio: String
        ): String!

        editProfile(
          displayName: String
          instagram: String
          twitter: String
        ): String!
        updateAvatar(avatar: Upload!): String!

        doesUsernameExist(username: String!): Boolean!
        setUsername(username: String!): String!

        followUser(following: ID!): String!
      }
    `,
  ],
  resolvers: {
    Query: {
      me: (_, __, { userId }) => {
        if (!userId) return null;
        return methods.queries
          .get(userId)
          .then((user) => userShaper(user))
          .catch((err) => {
            throw new Error(err);
          });
      },

      user: (_, { _id }) => {
        return methods.queries
          .get(_id)
          .then((user) => userShaper(user))
          .catch((err) => {
            throw new Error(err);
          });
      },
    },

    Mutation: {
      getNonce: (_, { address }, { userId }) => {
        return methods.queries
          .getUserByAddress(address)
          .then((user) => user)
          .catch(() => {
            return methods.commands.create(address);
          })
          .then((user) => {
            return user.nonce;
          })
          .catch((err) => {
            throw new Error(err);
          });
      },

      getToken: (_, { signature, address }) => {
        return methods.queries
          .getUserByAddress(address)
          .then((user) => {
            // TODO verification need to be implemented
            methods.commands
              .reNonce(user._id)
              .then(() => console.log("renonced"))
              .catch((err) => console.log(err));
            if (
              isVerifiedSign({
                signature,
                publicAddress: address,
                nonce: user.nonce,
              })
            ) {
              return jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            } else {
              return new Error("Wrong signature");
            }
          })
          .catch((err) => {
            console.log(err);
            throw new Error(err);
          });
      },

      completeProfile: (
        _,
        { avatar, displayName, username, bio },
        { userId }
      ) => {
        const filename = keygen.url(keygen.large);
        const filesDirectory = path.resolve(__dirname, "files");

        if (!fs.existsSync(filesDirectory)) {
          fs.mkdirSync(filesDirectory);
        }
        return new Promise((resolve, reject) => {
          avatar.promise
            .then(({ createReadStream }) => {
              createReadStream()
                .pipe(
                  fs.createWriteStream(path.resolve(filesDirectory, filename))
                )
                .on("finish", (result) => {
                  methods.commands
                    .completeProfile(userId, {
                      avatar: filename,
                      displayName,
                      username,
                      bio,
                    })
                    .then((msg) => resolve(msg))
                    .catch((err) => {
                      throw new Error(err);
                    });
                });
            })
            .catch((err) => {
              console.log(err);
              throw new Error(err);
            });
        });
      },

      updateAvatar: (_, { avatar }, { userId }) => {
        const filename = keygen.url(keygen.large);
        const filesDirectory = path.resolve(__dirname, "files");

        if (!fs.existsSync(filesDirectory)) {
          fs.mkdirSync(filesDirectory);
        }

        console.log('upading avatar', { userId})
        return new Promise((resolve, reject) => {
          avatar.promise
            .then(({ createReadStream }) => {
              createReadStream()
                .pipe(
                  fs.createWriteStream(path.resolve(filesDirectory, filename))
                )
                .on("finish", (result) => {
                  console.log(result)
                  methods.commands
                    .updateAvatar(userId, {
                      avatar: filename,
                    })
                    .then((msg) => resolve(msg))
                    .catch((err) => {
                      throw new Error(err);
                    });
                })
                .on("error", (err) => console.log(err));
            })
            .catch((err) => {
              console.log(err);
              throw new Error(err);
            });
        });
      },

      editProfile: (_, { displayName, twitter, instagram }, { userId }) => {
        return methods.commands
          .editProfile(userId, { displayName, twitter, instagram })
          .then((msg) => {
            return "user followed";
          })
          .catch((err) => {
            console.log(err);
            throw new Error(err);
          });
      },

      followUser: (_, { following }, { userId }) => {
        return methods.commands
          .follow(userId, following)
          .then((msg) => {
            return "user followed";
          })
          .catch((err) => {
            console.log(err);
            throw new Error(err);
          });
      },
    },
  },
});

export default UserModule;
