import mongoose from "mongoose";
import keygen from "keygen";

import RoleChecker from "./ACL.js";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    displayName: String,
    avatar: String,
    bio: String,
    setted: {
      type: Boolean,
      default: false,
    },
    instagram: {
      type: String,
    },
    twitter: {
      type: String,
    },
    nonce: {
      type: String,
      required: true,
    },
    addresses: [String],
    followers: [mongoose.Types.ObjectId],
    followings: [mongoose.Types.ObjectId],
    role: {
      type: String,
      required: true,
      default: "LISTENER",
      enum: ["LISTENER", "VOTER", "SPEAKER", "MODERATOR"],
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("user", UserSchema);

const getUserByAddress = (address) => {
  return new Promise((resolve, reject) => {
    User.findOne({ addresses: { $in: [address] } }, (err, user) => {
      if (err) return reject(err);
      if (!user) return reject(new Error("No user found!"));
      return resolve(user);
    });
  });
};

const getNullableUserByAddress = (address) => {
  return new Promise((resolve, reject) => {
    User.findOne({ addresses: { $in: [address] } }, (err, user) => {
      if (err) return reject(err);
      return resolve(user);
    });
  });
};

const get = (_id) => {
  return new Promise((resolve, reject) => {
    User.findOne({ _id }, (err, user) => {
      if (err) return reject(err);
      if (!user) return reject(new Error("No user found!"));
      return resolve(user);
    });
  });
};

const create = (address) => {
  return new Promise((resolve, reject) => {
    var role;
    RoleChecker(address)
      .then((r) => {
        role = r;
        return getUserByAddress(address);
      })
      .then(() => {
        return reject(new Error("User already existed."));
      })
      .catch((err) => {
        const nonce = keygen.url(20);
        const user = new User({
          addresses: [address],
          nonce,
          role,
        });
        return resolve(user.save());
      });
  });
};

const reNonce = (user) => {
  return new Promise((resolve, reject) => {
    const nonce = keygen.url(20);
    User.updateOne(
      { _id: user._id },
      {
        $set: { nonce },
      },
      (err) => {
        if (err) return reject(err);
        return resolve("Rononced Successfully.");
      }
    );
  });
};

const completeProfile = (userId, { avatar, username, displayName, bio }) => {
  return new Promise((resolve, reject) => {
    User.updateOne(
      { _id: userId },
      {
        $set: {
          avatar,
          username,
          displayName,
          bio,
          setted: true,
        },
      },
      (err) => {
        if (err) return reject(err);
        return resolve("done");
      }
    );
  });
};

const updateAvatar = (userId, { avatar }) => {
  return new Promise((resolve, reject) => {
    User.updateOne(
      { _id: userId },
      {
        $set: {
          avatar,
        },
      },
      (err) => {
        if (err) return reject(err);
        return resolve("done");
      }
    );
  });
};

const editProfile = (userId, { avatar, username, displayName }) => {
  return new Promise((resolve, reject) => {
    if (avatar) {
      User.updateOne(
        { _id: userId },
        {
          $set: {
            avatar,
            username,
            displayName,
          },
        },
        (err) => {
          if (err) return reject(err);
          return resolve("done");
        }
      );
    } else {
      User.updateOne(
        { _id: userId },
        {
          $set: {
            username,
            displayName,
          },
        },
        (err) => {
          if (err) return reject(err);
          return resolve("done");
        }
      );
    }
  });
};

const refetchRole = (userId) => {
  return new Promise((resolve, reject) => {
    get(userId)
      .then((user) => {
        RoleChecker(user.addresses[0])
          .then((role) => {
            User.updateOne(
              { _id: user._id },
              {
                $set: {
                  role,
                },
              },
              (err) => {
                if (err) return reject(err);
                return resolve("done");
              }
            );
          })
          .catch((err) => {
            return reject(err);
          });
      })
      .catch((err) => reject(err));
  });
};

const addNewAddress = (userId, newAddress) => {
  return new Promise((resolve, reject) => {
    User.updateOne(
      {
        _id: userId,
      },
      {
        $push: { addresses: newAddress },
      },
      (err) => {
        if (err) return reject(err);
        return resolve("added");
      }
    );
  });
};

const follow = (follower, following) => {
  return new Promise((resolve, reject) => {
    get(follower)
      .then((user) => {
        if (user.followings.includes(following)) {
          User.updateOne(
            { _id: follower },
            {
              $pull: {
                followings: following,
              },
            },
            (err) => {
              if (err) return reject(err);
              return User.updateOne(
                { _id: following },
                {
                  $pull: {
                    followers: follower,
                  },
                },
                (err) => {
                  if (err) return reject(err);
                  return resolve("done");
                }
              );
            }
          );
        } else {
          User.updateOne(
            { _id: follower },
            {
              $push: {
                followings: following,
              },
            },
            (err) => {
              if (err) return reject(err);
              return User.updateOne(
                { _id: following },
                {
                  $push: {
                    followers: follower,
                  },
                },
                (err) => {
                  if (err) return reject(err);
                  return resolve("done");
                }
              );
            }
          );
        }
      })
      .catch((err) => reject(err));
  });
};

export const methods = {
  queries: {
    getUserByAddress,
    getNullableUserByAddress,
    get,
  },
  commands: {
    create,
    reNonce,
    completeProfile,
    addNewAddress,
    follow,
    updateAvatar,
    editProfile,
    refetchRole,
  },
};

export default {
  User,
  methods,
};
