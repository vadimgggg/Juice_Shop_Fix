/*
 * Copyright (c) 2014-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express';
import { UserModel } from '../models/user';
import challengeUtils = require('../lib/challengeUtils');
import * as utils from '../lib/utils';

const security = require('../lib/insecurity');
const cache = require('../data/datacache');
const challenges = cache.challenges;

module.exports = function updateUserProfile() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loggedInUser = security.authenticatedUsers.get(req.cookies.token);

      if (loggedInUser) {
        const user = await UserModel.findByPk(loggedInUser.data.id);
        if (user != null) {
          challengeUtils.solveIf(challenges.csrfChallenge, () => {
            return (
              (req.headers.origin?.includes('://htmledit.squarefree.com') ?? false) ||
              (req.headers.referer?.includes('://htmledit.squarefree.com') ?? false)
            ) && req.body.username !== user.username;
          });

          // Validate and sanitize the new username
          const newUsername = utils.sanitizeHtml(req.body.username);
          if (!newUsername || newUsername.trim().length === 0) {
            throw new Error('Invalid username');
          }

          await user.update({ username: newUsername });
          // @ts-expect-error FIXME some properties missing in savedUser
          const savedUser = utils.queryResultToJson(user);
          const updatedToken = await security.authorize(savedUser);

          security.authenticatedUsers.put(updatedToken, savedUser);

          res.cookie('token', updatedToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
          });

          res.location(`${process.env.BASE_PATH}/profile`);
          res.redirect(`${process.env.BASE_PATH}/profile`);
        } else {
          throw new Error('User not found');
        }
      } else {
        throw new Error(`Blocked illegal activity by ${req.socket.remoteAddress}`);
      }
    } catch (error) {
      next(error);
    }
  };
};
