import BlockExplorer from "./app"
import React from "react"
import ReactDOM from "react-dom"
import {Login, fakeAuth} from 'Pages/login'
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => (
    <Component {...props} />
  )} />
)

const Root = document.getElementById("root") 
Root? ReactDOM.render(<BrowserRouter>
                          <Switch>
							              <Route path="/explorer/overview" exact component={BlockExplorer}/>
                            <PrivateRoute path="/(\w+/|)(\w+/|)(.*|)" component={BlockExplorer}/>
                          </Switch>
                    </BrowserRouter>, Root) : false;
