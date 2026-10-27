import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const isReal = (val?: string) => Boolean(val && !val.startsWith('dummy-'));
    const clientID =
      (isReal(process.env.GOOGLE_CLIENT_ID)
        ? process.env.GOOGLE_CLIENT_ID
        : undefined) ||
      (isReal(process.env.YOUTUBE_CLIENT_ID)
        ? process.env.YOUTUBE_CLIENT_ID
        : undefined) ||
      process.env.GOOGLE_CLIENT_ID ||
      'dummy-google-client-id';

    const clientSecret =
      (isReal(process.env.GOOGLE_CLIENT_SECRET)
        ? process.env.GOOGLE_CLIENT_SECRET
        : undefined) ||
      (isReal(process.env.YOUTUBE_CLIENT_SECRET)
        ? process.env.YOUTUBE_CLIENT_SECRET
        : undefined) ||
      process.env.GOOGLE_CLIENT_SECRET ||
      'dummy-google-client-secret';

    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ||
      process.env.YOUTUBE_REDIRECT_URI ||
      'http://localhost:5000/api/auth/google/callback';

    console.log(
      `[GoogleStrategy] Initialized with clientID: ${clientID.substring(0, 16)}... | callbackURL: ${callbackURL}`,
    );

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl',
      ],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, name, emails, photos } = profile;
    const user: GoogleUserProfile = {
      googleId: id,
      email: emails && emails[0] ? emails[0].value : '',
      firstName: name ? name.givenName || '' : '',
      lastName: name ? name.familyName || '' : '',
      picture: photos && photos[0] ? photos[0].value : '',
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
