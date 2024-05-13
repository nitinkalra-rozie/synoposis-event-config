import { Injectable } from '@angular/core';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoRefreshToken
} from "amazon-cognito-identity-js";
import { environment } from 'src/environments/environment';
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from 'rxjs'; // Import for token expiration handling

@Injectable({
  providedIn: 'root'
})
export class CognitoService {
  userPool: any;
  cognitoUser: any;
  username: string = "";
  refreshToken: string='';
  accessToken: string = '';
  private authStateSubject = new BehaviorSubject<boolean>(false); // Subject for authentication state

  constructor(private router: Router) {
    this.checkSession().then(() => {
      // Attempt auto login if session exists
      if (this.isLoggedIn()) {
        this.router.navigate(["/admin"]); // Or your desired admin route
        this.authStateSubject.next(true); // Update auth state
      }
    });
  }
  ngOnInit(): void {
    // Check localStorage on component initialization
    this.accessToken = localStorage.getItem("accessToken") || '';
    this.refreshToken = localStorage.getItem("refreshToken") || '';
    this.username = localStorage.getItem("username") || '';
  }
  // Login
  login(emailaddress: any, password: any) {
    const authenticationDetails = new AuthenticationDetails({
      Username: emailaddress,
      Password: password,
    });

    const poolData = {
      UserPoolId: environment.cognitoUserPoolId,
      ClientId: environment.cognitoAppClientId,
    };

    this.username = emailaddress;
    this.userPool = new CognitoUserPool(poolData);
    const userData = { Username: emailaddress, Pool: this.userPool };
    this.cognitoUser = new CognitoUser(userData);

    this.cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result: any) => {
        console.log("result", JSON.stringify(result));
        localStorage.setItem("Idtoken", result.idToken.jwtToken);
        localStorage.setItem("refreshToken", result.refreshToken.token);
        localStorage.setItem("accessToken", result.accessToken.jwtToken);
        localStorage.setItem("username", this.username);

        this.refreshToken = result.refreshToken.token;
        this.accessToken = result.accessToken.jwtToken;
        this.router.navigate(["/admin"]); // Or your desired admin route
        this.authStateSubject.next(true); // Update auth state
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
          onSuccess: (result:any) => {
            console.log("Reset Success",result);
            localStorage.setItem("Idtoken", result.idToken.jwtToken);
            localStorage.setItem("refreshToken", result.refreshToken.token);
            localStorage.setItem("accessToken", result.accessToken.jwtToken);
            localStorage.setItem("username", this.username);
    
            this.refreshToken = result.refreshToken.token;
            this.accessToken = result.accessToken.jwtToken;
            this.router.navigate(["/admin"]); 
            this.authStateSubject.next(true);
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
    const poolData = {
      UserPoolId: environment.cognitoUserPoolId,
      ClientId: environment.cognitoAppClientId,
    };
    this.userPool = new CognitoUserPool(poolData);
    this.cognitoUser = this.userPool.getCurrentUser();
    if (this.cognitoUser) {
      this.cognitoUser.signOut();
      this.router.navigate([""]);
      localStorage.removeItem("Idtoken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("username");
      localStorage.removeItem("postInsideInterval")
      localStorage.removeItem("transcriptTimeOut")

      this.refreshToken = '';
      this.accessToken = ''; // Clear stored tokens
      this.authStateSubject.next(false); // Update auth state
    }
  }

  getRefreshToken(token: any) {
    console.log("Token", token);
    const refreshToken = new CognitoRefreshToken({ RefreshToken: token });
    console.log("Refresh Token", refreshToken); // (Optional for debugging)
  }

  // Improved check
  checkSession(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.userPool = new CognitoUserPool({
        UserPoolId: environment.cognitoUserPoolId,
        ClientId: environment.cognitoAppClientId,
      });
      this.cognitoUser = this.userPool.getCurrentUser();
      if (this.cognitoUser != null) {
        this.cognitoUser.getSession((err: any, session: any) => {
          if (err) {
            // Handle session retrieval error (e.g., expired token)
            console.error("Session retrieval error:", err);
            localStorage.removeItem("Idtoken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("username");
            this.refreshToken = '';
            this.accessToken = '';
            this.authStateSubject.next(false); // Update auth state to reflect unauthenticated state
            reject(err);
          } else {
            console.log("inside refresh loging",JSON.stringify(session))
            this.accessToken = session.accessToken.jwtToken;
            this.refreshToken = session.refreshToken.token;
            resolve();
            this.authStateSubject.next(true); // Update auth state to reflect authenticated state
          }
        });
      } else {
        // No user found in session, consider user not logged in
        localStorage.removeItem("Idtoken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("username");
        this.refreshToken = '';
        this.accessToken = '';
        this.authStateSubject.next(false); // Update auth state to reflect unauthenticated state
        resolve();
      }
    });
  }
  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

}