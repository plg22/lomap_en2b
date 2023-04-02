import { useState } from "react";
import { Button, TextField, FormGroup, Container } from "@mui/material";
import { login } from "@inrupt/solid-client-authn-browser";

import "./login.css"

const Login = () => {
    const [idp, setIdp] = useState("https://inrupt.net");

    const handleClick = async (e : any) => {
      e.preventDefault();
      login({
        redirectUrl: "http://localhost:3000/",
        oidcIssuer: idp,
        clientName: "LoMap"
      });
    };

    return (
      <Container>
        <h1 className="loginHeader"> Login </h1>
        <p className="loginText"> Welcome to LoMap!</p>
        <p className="loginText"> This application runs using the solid principles, this means, you need an account on a pod provider to use it. </p>
        <p className="loginText"> If you already have one, please log in.</p>
        <p className="loginText"> If not, please create an account in a pod provider as inrupt.net</p>
        <FormGroup>
          <TextField
            label="Identity Provider"
            placeholder="Identity Provider"
            type="url"
            value={idp}
            onChange={(e : any) => setIdp(e.target.value)}
            InputProps={{
              endAdornment: (
                <Button onClick={handleClick} variant="contained">
                    Login
                </Button>
              ),
            }}
          />
        </FormGroup>
      </Container>
    );
  }

export default Login;