import { Amplify } from 'aws-amplify';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
const region = import.meta.env.VITE_AWS_REGION;
const oauthDomain = import.meta.env.VITE_COGNITO_DOMAIN;
const redirectUrl = window.location.origin.endsWith('/') ? window.location.origin : `${window.location.origin}/`;

if (userPoolId && userPoolClientId && region) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
        ...(oauthDomain
          ? {
              oauth: {
                domain: oauthDomain,
                scopes: ['openid', 'email', 'profile'],
                redirectSignIn: [redirectUrl],
                redirectSignOut: [redirectUrl],
                responseType: 'code',
              },
            }
          : {}),
      },
    },
  });
}
