/**
 * Passport Configuration
 * Google and Kakao OAuth strategies
 */

import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { findOrCreateSocialUser, SocialUserProfile } from '../services/social-auth.service';

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
                return done(new Error('Email not provided by Google'), undefined);
            }

            const socialProfile: SocialUserProfile = {
                provider: 'google',
                socialId: profile.id,
                email,
                displayName: profile.displayName,
                profileImage: profile.photos?.[0]?.value
            };

            const user = await findOrCreateSocialUser(socialProfile);
            done(null, user);
        } catch (error) {
            done(error as Error, undefined);
        }
    }));
}

// Kakao OAuth Strategy
if (process.env.KAKAO_CLIENT_ID) {
    passport.use(new KakaoStrategy({
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
        callbackURL: '/api/auth/kakao/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const kakaoAccount = profile._json?.kakao_account;
            const email = kakaoAccount?.email;

            if (!email) {
                return done(new Error('Email not provided by Kakao'), undefined);
            }

            const socialProfile: SocialUserProfile = {
                provider: 'kakao',
                socialId: profile.id.toString(),
                email,
                displayName: profile.displayName || profile.username,
                profileImage: profile._json?.properties?.profile_image
            };

            const user = await findOrCreateSocialUser(socialProfile);
            done(null, user);
        } catch (error) {
            done(error as Error, undefined);
        }
    }));
}

// Serialize/Deserialize user
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
