/**
 * Social Auth Routes
 * OAuth login routes for Google and Kakao
 */

import { Router } from 'express';
import passport from '../config/passport.config';
import * as socialAuthController from '../controllers/social-auth.controller';

const router = Router();

// Social login status
router.get('/social/status', socialAuthController.getSocialLoginStatus);

// Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/api/auth/social/status',
        session: false
    }),
    socialAuthController.googleCallback
);

// Kakao OAuth
router.get('/kakao', passport.authenticate('kakao', {
    session: false
}));

router.get('/kakao/callback',
    passport.authenticate('kakao', {
        failureRedirect: '/api/auth/social/status',
        session: false
    }),
    socialAuthController.kakaoCallback
);

export default router;
