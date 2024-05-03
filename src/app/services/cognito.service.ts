import { Injectable } from '@angular/core';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoRefreshToken
} from "amazon-cognito-identity-js";
import { environment } from 'src/environments/environment';
import { Router } from "@angular/router";
@Injectable({
  providedIn: 'root'
})
export class CognitoService {
  userPool: any;
  cognitoUser: any;
  username: string = "";
  refreshToken: string='';
  accessToken: string = '';
  constructor(private router: Router) {}

  // Login
  login(emailaddress: any, password: any) {
    let authenticationDetails = new AuthenticationDetails({
      Username: emailaddress,
      Password: password,
    });

    let poolData = {
      UserPoolId: environment.cognitoUserPoolId,
      ClientId: environment.cognitoAppClientId,
    };

    this.username = emailaddress;
    this.userPool = new CognitoUserPool(poolData);
    let userData = { Username: emailaddress, Pool: this.userPool };
    this.cognitoUser = new CognitoUser(userData);
    
    this.cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result: any) => {
        localStorage.setItem("Idtoken", result.idToken);
        localStorage.setItem("refreshToken", result.refreshToken.token);
        localStorage.setItem("accessToken", result.accessToken.jwtToken);
        localStorage.setItem("username", this.username);

     
          this.router.navigate(["/admin"]); 
        
        // this.getRefreshToken(result.refreshToken.token);
        console.log("Success Results : ", JSON.stringify(result));
      },
      // First time login attempt
      newPasswordRequired: () => {
        this.router.navigate(["/newPasswordRequired"]);
      },
      onFailure: (error: any) => {
        console.log("error", error);
      },
    });
  }

  // First time login attempt - New password require
  changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) {
    if (newPassword === confirmPassword) {
      this.cognitoUser.completeNewPasswordChallenge(
        newPassword,
        {},
        {
          onSuccess: () => {
            console.log("Reset Success");
            this.router.navigate(["/admin"]);
          },
          onFailure: () => {
            console.log("Reset Fail");
          },
        }
      );
    } else {
      console.log("Password didn't Match");
    }
  }

  // Logout 
  logOut() {
    let poolData = {
      UserPoolId: environment.cognitoUserPoolId,
      ClientId: environment.cognitoAppClientId,
    };
    this.userPool = new CognitoUserPool(poolData);
    this.cognitoUser = this.userPool.getCurrentUser();
    if (this.cognitoUser) {
      this.cognitoUser.signOut();
      this.router.navigate([""]);
    }
  }

  getRefreshToken(token:any){
    console.log("Token", token)
    var refreshToken = new CognitoRefreshToken({RefreshToken: token})
    console.log("Refresh Token", refreshToken)
  }
  checkSession(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.cognitoUser.getSession((err: any, session: any) => {
        if (err) {
          reject(err);
        } else {
          this.accessToken = session.accessToken.jwtToken;
          this.refreshToken = session.refreshToken.token;
          resolve();
        }
      });
    });
  }
  isLoggedIn(): boolean {
    return !!this.accessToken;
  }
}