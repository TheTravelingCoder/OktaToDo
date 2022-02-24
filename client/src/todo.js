import * as React from 'react';
import FormGroup from '@mui/material/FormGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useOktaAuth } from '@okta/okta-react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import $ from "jquery";
import {default as keys} from './keys';

async function getToDoFromServer(tokens, res){
  let jwt = sessionStorage.getItem('jwt');
  let body = {
    jwt: jwt
  }
  await axios.post('http://localhost:5000/getTodo', body).then(async response => {
    if(response.status === 400){
      return "noToDo"
    }else{
      sessionStorage.setItem("todo", JSON.stringify(response.data));
      return "todo";
    }
  })
}

async function createToDo(){
  let todo = $('#addText').val();
  let jwt = sessionStorage.getItem('jwt');
  let body = {
    todo: todo,
    jwt: jwt
  }
  await axios.post('http://localhost:5000/addTodo', body).then(async response => {
    console.log(response);
    window.location.reload();
  })
}

async function signout(oktaAuth){
  console.log(oktaAuth.tokenManager)
  let token = sessionStorage.getItem('idToken');
  let clientID = keys.clientId;
  console.log(clientID, token)
  oktaAuth.tokenManager.clear();
}

export default function CheckboxLabels() {
  const history = useHistory();
  const { oktaAuth } = useOktaAuth();
  let todoStatus = getToDoFromServer();

  function logout(){
    signout(oktaAuth);
    history.push('/login');
  }
  
  if(todoStatus === "noToDo"){
    return (
      <FormGroup id="formGroup">
        <TextField
          helperText=" "
          id="addText"
          label="Add ToDo Item"
        />
        <Button variant='outlined' onClick={createToDo}></Button>
      </FormGroup>
    );
  }else{
    let user = sessionStorage.getItem('email');
    let todo = JSON.parse(sessionStorage.getItem('todo'));
    let todos = [];
    for(let i = 0; i < todo.length; i++){
      todos.push(<FormControlLabel key={todo[i]._id} control={<Checkbox defaultChecked />} label={todo[i].todo} />);
    }
    return (
      <Container>
        <Typography variant="h3" component="div" gutterBottom>
          <Button variant='contained' color="error" onClick={logout}>Logout</Button>
          Welcome {user}
        </Typography>
        <FormGroup id="formGroup">
          <Typography variant="h4" component="div" gutterBottom>
            To-Do's
          </Typography>
          {todos}
          <TextField
            helperText=" "
            id="addText"
            label="Add ToDo Item"
          />
          <Button variant='outlined' onClick={createToDo}>Add Item</Button>
        </FormGroup>
      </Container>
    );
  }
}