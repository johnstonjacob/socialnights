const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const session = require('express-session');
const dotenv = require('dotenv');
const randomString = require('randomstring');
const User = require('../database/user.js');
const app = require('./index');

module.exports = (redis) => {
  const scope = [
    'user-read-email',
    'streaming',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-library-read',
    'playlist-read-private',
    'user-library-modify',
    'playlist-modify-public',
    'user-read-recently-played',
    'user-read-private',
    'playlist-modify-private',
    'user-top-read',
    'user-read-birthdate',
  ];

  dotenv.config({ silent: true });

  app.use(session({ secret: 'tampa vice', resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_ID,
      clientSecret: process.env.SPOTIFY_SECRET,
      callbackURL: 'http://johnstonjacob.com/socialnights/auth/spotify/callback',
    },
    (accessToken, refreshToken, expiresIn, profile, done) => {
      User.findOrCreate(
        {
          spotifyId: profile.id,
          accessToken,
          refreshToken,
          expiresIn,
        },
        (err, user) => done(err, user),
      );
    },
  ));

  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.get('/socialnights/auth/loggedin', async (req, res) => {
    try {
      if (req.isAuthenticated()) {
        const result = await User.sessionCheck(req.sessionID);
        res.send({ loggedIn: true, username: result.username });
      } else res.send({ loggedIn: false });
    } catch (error) {
      console.error(error);
    }
  });

  app.get('/socialnights/auth/spotify', passport.authenticate('spotify', { scope, showDialog: true }), (req) => req);

  app.get(
    '/socialnights/auth/spotify/callback*',
    passport.authenticate('spotify', {
      failureRedirect: '/login',
    }),
    async (req, res) => {
      const newRoom = randomString.generate({
        length: 5,
        capitalization: 'lowercase',
        readable: true,
      });
      const { user } = req._passport.session; //eslint-disable-line
      await User.sessionAdd(user, req.sessionID, newRoom).catch(console.error);
      const result = await User.sessionCheck(req.sessionID);
      redis.hmset(newRoom, ['host', user, 'accesstoken', result.accessToken, 'refreshtoken', result.refreshToken]);
      res.redirect(`http://johnstonjacob.com/socialnights/#/room/${newRoom}?host=true&username=${user}`);
    },
  );
};
