import {Redirect, Route, Switch} from "react-router-dom";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import AdminLayout from "./layouts/Admin";
import AuthLayout from "./layouts/Auth";
import React, {useEffect, useState} from "react";
import {Spinner} from "reactstrap";
import {getDb} from "./util/Constants";
import {doc, getDoc} from "firebase/firestore";

const App = () => {
    const [signedInUser, setSignedInUser] = useState(getAuth().currentUser);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const db = getDb();

    useEffect(async () => {
        onAuthStateChanged(getAuth(), async (user) => {
            if (user && !isLoggedIn) {
                let _user = user;
                const adminsRef = doc(db, "admins", user.uid);
                const adminSnap = await getDoc(adminsRef);

                const utilsRef = doc(db, "util", "meta");
                const utilSnap = await getDoc(utilsRef);

                if (adminSnap.exists()) {
                    _user = {..._user, ...adminSnap.data(), sheetId: utilSnap.data().sheetId};
                } else {
                    _user.role = "superAdmin";
                    
                }

                localStorage.setItem('progressUser', JSON.stringify({..._user}));
                setSignedInUser(_user);
                setIsLoggedIn(true);
            } else {
                setSignedInUser(null);
                setIsLoggedIn(false);
            }
            setIsLoading(false);
        });
    }, []);

    return (
        <>
            {
                isLoading ?
                    <div className="text-center mt-7">
                        <Spinner
                            color={'primary'}
                            size={''}
                        >
                            Loading...
                        </Spinner>
                    </div> :
                    <Switch>
                        <Route path="/admin" render={props => {
                            if (signedInUser) return <AdminLayout {...props} signedInUser={signedInUser}/>;
                            return <Redirect to="/auth/login"/>
                        }}/>
                        <Route path="/auth" render={props => {
                            if (!signedInUser) return <AuthLayout {...props} signedInUser={signedInUser}/>;
                            return <Redirect to="/admin/leaderboard"/>
                        }}/>
                        <Redirect from="/" to="/admin/leaderboard"/>
                    </Switch>
            }
        </>
    )
}

export default App;