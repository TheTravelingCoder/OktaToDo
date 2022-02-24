import React from 'react';
import OktaSignInWidget from './OktaSignInWidget';
import { useOktaAuth } from '@okta/okta-react';
import axios from 'axios';

async function getJWTFromServer(tokens, res){
  console.log(tokens, 'here')
  sessionStorage.setItem('email', tokens.idToken.claims.email);
  sessionStorage.setItem('idToken', tokens.idToken.idToken);
  await axios.post('http://localhost:5000/login', tokens).then(async response => {
    console.log(response)
    if(response.status === 200){
      let jwt = response.data;
      sessionStorage.setItem("jwt", jwt);
      return response.data;
    }else{
      return 'error';
    }
  })
}

const Login = ({ config }) => {
  const { oktaAuth, authState } = useOktaAuth();

  const onSuccess = (tokens) => {
    let jwt = getJWTFromServer(tokens);
    if(jwt !== 'error'){
      oktaAuth.handleLoginRedirect(tokens);
    }    
  };

  const onError = (err) => {
    console.log('error logging in', err);
  };

  if (!authState) return null;

  return (
    <OktaSignInWidget
      config={config}
      onSuccess={onSuccess}
      onError={onError}/>
      )
};
export default Login;