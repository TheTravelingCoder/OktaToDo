import React, {useCallback} from 'react';
import { Link } from 'react-router-dom';
import { Redirect, useHistory } from 'react-router-dom';
import { useOktaAuth } from '@okta/okta-react';

const Home = () => {
  const history = useHistory();
  const { authState } = useOktaAuth();
  const handleOnClickTodo = useCallback(() => history.push('/todo'), [history]);

  if (!authState) return null;


  const button = authState.isAuthenticated ?
    <Redirect to="/todo" /> :
    <Redirect to="/login" />

  const todo = !authState.isAuthenticated ? 
  <button></button> :
  <button onClick={handleOnClickTodo}>To-Do</button>;
  return (
    <div>
      <Link to='/'>Home</Link><br/>
      <Link to='/protected'>Protected</Link><br/>
      {button}
      {todo}
    </div>
  );
};
export default Home;