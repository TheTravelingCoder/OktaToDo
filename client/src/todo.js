import * as React from 'react';
import FormGroup from '@mui/material/FormGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
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
    if(response.status === 200){
      sessionStorage.setItem("todo", JSON.stringify(response.data));
      return "todo";
    }else{
      return "noToDo"
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
  let jwt = sessionStorage.getItem('jwt');
  let clientID = keys.clientId;
  console.log(clientID, jwt)
  oktaAuth.tokenManager.clear();
}

async function deleteTodo(id){
  let jwt = sessionStorage.getItem('jwt');
  let body = {
    id: id,
    jwt: jwt
  }
  console.log(body)
  await axios.post('http://localhost:5000/deleteTodo', body).then(async response => {
    window.location.reload();
  })
}

export default function CheckboxLabels() {
  const history = useHistory();
  const { oktaAuth } = useOktaAuth();
  const [dense] = React.useState(false);
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
    let ids = [];
    for(let i = 0; i < todo.length; i++){
      let id = todo[i]._id;
      ids.push(id);
      todos.push(
      <ListItem value={ids[i]} key={ids[i]} onClick={() => deleteTodo(ids[i])}
        secondaryAction={
          <IconButton edge="end" aria-label="delete">
            <DeleteIcon />
          </IconButton>
        }
      >
        <ListItemAvatar>
          <Checkbox defaultChecked />
        </ListItemAvatar>
        <ListItemText
          primary={todo[i].todo}
        />
      </ListItem>);
    }
    return (
      <Container>
        <Typography variant="h3" component="div" gutterBottom>
          <Button variant='contained' color="error" onClick={logout}>Logout</Button>
          Welcome {user}
        </Typography>
        <List dense={dense} id="formGroup">
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
        </List>
      </Container>
    );
  }
}