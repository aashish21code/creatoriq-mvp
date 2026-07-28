import { Router } from 'express';
import { login, callback, logout } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/callback', callback);
authRouter.get('/logout', logout);
