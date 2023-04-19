import Login from "views/examples/Login.js";
import Leaderboard from "../views/common/Leaderboard";
import Users from "../views/common/Users/Users";
import UserDetail from "../views/common/Users/UserDetail";
import AddUser from "../views/common/Users/AddUser";
import EditUser from "../views/common/Users/EditUser";
import LevelStatistics from "../views/common/LevelStatistics";
import LevelStrengths from "../views/common/LevelStrengths";
import UserStrengths from "../views/common/UserStrengths";
import StrengthDetails from "../views/common/StrengthDetails";
import OverallStrengths from "../views/common/OverallStrengths";

const routes = [
    {
        path: "/index",
        name: "Leaderboard",
        icon: "fas fa-chart-line text-orange",
        component: Leaderboard,
        layout: "/admin",
        display: true,
    },
    {
        path: "/users",
        name: "Users",
        icon: "fas fa-users text-yellow",
        component: Users,
        layout: "/admin",
        display: true
    },
    {
        path: "/users/new",
        name: "Add User",
        icon: "fas fa-users text-yellow",
        component: AddUser,
        layout: "/admin",
        display: false
    },
    {
        path: "/users/:userId/edit",
        name: "Edit User",
        icon: "fas fa-users text-yellow",
        component: EditUser,
        layout: "/admin",
        display: false
    },
    {
        path: "/users/:id",
        name: "User Details",
        icon: "fas fa-users text-yellow",
        component: UserDetail,
        layout: "/admin",
        display: false
    },
    {
        path: "/level-statistics",
        name: "Level Statistics",
        icon: "fas fa-star text-blue",
        component: LevelStatistics,
        layout: "/admin",
        display: true
    },
    {
        path: "/level-strengths",
        name: "Level Strengths",
        icon: "far fa-chart-bar text-blue",
        component: LevelStrengths,
        layout: "/admin",
        display: true
    },
    {
        path: "/user-strengths",
        name: "User Strengths Report",
        icon: "fas fa-chart-pie text-danger",
        component: UserStrengths,
        layout: "/admin",
        display: true
    },
    {
        path: "/strength-details",
        name: "Strength Details Report",
        icon: "far fa-list-alt text-success",
        component: StrengthDetails,
        layout: "/admin",
        display: true
    },
    {
        path: "/competency-report",
        name: "Competency Report",
        icon: "fas fa-file-contract text-warning",
        component: OverallStrengths,
        layout: "/admin",
        display: true
    }, {
        path: "/login",
        name: "Login",
        icon: "ni ni-key-25 text-info",
        component: Login,
        layout: "/auth",
    },
    // {
    //   path: "/register",
    //   name: "Register",
    //   icon: "ni ni-circle-08 text-pink",
    //   component: Register,
    //   layout: "/auth",
    // },
];

export default routes;