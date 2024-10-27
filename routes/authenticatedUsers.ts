/*
 * Copyright (c) 2014-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
import { type Request, type Response, type NextFunction } from 'express'
import { UserModel } from '../models/user'
import { decode } from 'jsonwebtoken'
import * as security from '../lib/insecurity'

async function retrieveUserList (req: Request, res: Response, next: NextFunction) {
  try {
    const users = await UserModel.findAll({
      attributes: { exclude: ['password', 'totpSecret'] } // Prevent loading sensitive fields
    });

    res.json({
      status: 'success',
      data: users.map((user) => {
        const userToken = security.authenticatedUsers.tokenOf(user);
        let lastLoginTime: number | null = null;
        if (userToken) {
          const parsedToken = decode(userToken, { json: true });
          lastLoginTime = parsedToken ? Math.floor(new Date((parsedToken?.iat ?? 0) * 1000).getTime()) : null;
        }
        return {
          ...user.dataValues,
          lastLoginTime
        };
      })
    });
  } catch (error) {
    next(error);
  }
}

export default () => retrieveUserList;
