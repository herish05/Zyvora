import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../../config/env.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL
    },
    (_accessToken, _refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("Google account has no email"), undefined);
      }

      return done(null, {
        id: profile.id,
        email,
        firstName: profile.name?.givenName ?? "",
        lastName: profile.name?.familyName ?? ""
      });
    }
  )
);

export { passport };
