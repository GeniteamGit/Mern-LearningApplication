import {getFirestore} from "firebase/firestore";
import moment from "moment";

let db = null;

const environment = 'staging'; // live or staging or it

const positionBadges = {
    1: require('../assets/img/icons/leaderboard/first.png').default,
    2: require('../assets/img/icons/leaderboard/2nd.png').default,
    3: require('../assets/img/icons/leaderboard/3rd.png').default
}
const achievementBadges = {
    speedDemon: require('../assets/img/icons/achievements/timer.png').default,
    mostlyRight: require('../assets/img/icons/achievements/postive-answer.png').default,
    highAchiever: require('../assets/img/icons/achievements/high-score.png').default,
    streakOf10: require('../assets/img/icons/achievements/accurate-answer.png').default
}
const progressColors = {
    low: '#f5365c',
    average: '#fb6340',
    satisfactory: '#5e72e4',
    success: '#2dce89'
}

export const levelNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Mini 1', 'Mini 2', 'Mini 3'];

export const RESPONSE_ENUM = {
    1: 'BEST',
    2: 'OK',
    3: 'WRONG'
}

export const getCapabilityColor = (index, alpha = 100) => {
    // alpha = alpha/100;
    alpha = 1;
    const colors = [
        `rgba(4, 115, 231, ${alpha})`,
        `rgba(255, 71, 4, ${alpha})`,
        `rgba(13, 144, 6, ${alpha})`,
        `rgba(132, 2, 231, ${alpha})`
    ];

    return colors[index % colors.length];
}

export const capabilityStyles = (index, alpha) => {
    const color = getCapabilityColor(index, alpha);

    return {
        textSize: '0.875em',
        pathColor: color,
        textColor: '#32325d',
        trailColor: '#f4f5f7',
        backgroundColor: '#3e98c7'
    }
}

export const progressStyles = (name, value) => {
    let pathColor = null;
    if (value >= 80) {
        pathColor = progressColors.success
    } else if (value >= 60) {
        pathColor = progressColors.satisfactory
    } else if (value >= 40) {
        pathColor = progressColors.average
    } else {
        pathColor = progressColors.low
    }

    return {
        textSize: '0.875em',
        pathColor: pathColor,
        textColor: '#adb5bd',
        trailColor: '#f4f5f7',
        backgroundColor: '#3e98c7'
    }
}

const mode = "light"; //(themeMode) ? themeMode : 'light';
const fonts = {
    base: "Open Sans",
};

export const colors = {
    gray: {
        100: "#f6f9fc",
        200: "#e9ecef",
        300: "#dee2e6",
        400: "#ced4da",
        500: "#adb5bd",
        600: "#8898aa",
        700: "#525f7f",
        800: "#32325d",
        900: "#212529",
    },
    0: 'rgb(17,200,239)',
    1: 'rgb(17,175,239)',
    2: 'rgb(17,150,239)',
    3: 'rgb(17,125,239)',
}
export const multiselectDropdownStyle = {
    "chips": {
        "background": "#5e72e4",
        "fontSize": ".75rem",
        "padding": "1px 10px",
        "marginBottom": "0",
        "color": "#ffffff"
    },
    "searchBox": {
        "border": "none",
        "minHeight": "calc(1.5em + 1.25rem + 2px)",
        "fontWeight": "400",
        "padding": "0.625rem 0.75rem",
        "lineHeight": "1.5",
        "fontSize": ".875rem"
    }
}

export const lineChartOptions = {
    scales: {
        xAxes: [{
            // gridLines: {
            // display: false
            // }
        }],
        yAxes: [{
            // gridLines: {
            //     display: false
            //     // color: colors.gray[900],
            //     // zeroLineColor: colors.gray[900],
            // },
            ticks: {
                beginAtZero: true
            }
        }]
    },
};

export const barGraphOptions = {
    scales: {
        xAxes: [{
            gridLines: {
                display: false,
                drawBorder: false,
                drawOnChartArea: false,
                drawTicks: false,
            },
            ticks: {
                padding: 20,
            }
        }],
        yAxes: [{
            gridLines: {
                display: true,
                drawBorder: false,
                drawTicks: false,
                color: colors.gray[200],
                zeroLineColor: colors.gray[200],
            },
            ticks: {
                beginAtZero: true,
                padding: 20,
            }
        }]
    },
};

export const leaderboardExportHeaders = [
    {displayName: 'Rank', id: 'rank'},
    {displayName: 'Name', id: 'name'},
    {displayName: 'Email', id: 'email'},
    {displayName: 'Progress', id: 'currentLevel'},
    {displayName: 'Completed', id: 'completedOnce'},
    {displayName: 'Score', id: 'currentScore'},
    {displayName: 'Tries', id: 'attempts'},
    {displayName: 'Last Updated', id: 'lastUpdated'}
];

export const getDb = () => {
    if (db) {
        return db;
    } else {
        db = getFirestore();
        return db;
    }
}

export const getPositionBadge = (position) => {
    const value = positionBadges[position];
    return value ? value : `https://via.placeholder.com/30x30/FFFFFF/000000?text=${position}`;
}

export const getAchievementBadge = (achievementName) => {
    return achievementBadges[achievementName];
}

export const renderDay = (props, currentDate, selectedDate, startDate, _endDate) => {
    const endDate = moment(_endDate).subtract(24, 'hours');

    let classes = props.className;
    if (
        startDate &&
        endDate &&
        startDate._d + "" === currentDate._d + ""
    ) {
        classes += " start-date";
    } else if (
        startDate &&
        endDate &&
        new Date(startDate._d + "") <
        new Date(currentDate._d + "") &&
        new Date(endDate._d + "") >
        new Date(currentDate._d + "")
    ) {
        classes += " middle-date";
    } else if (
        endDate &&
        endDate._d + "" === currentDate._d + ""
    ) {
        classes += " end-date";
    }
    return (
        <td {...props} className={classes}>
            {currentDate.date()}
        </td>
    );
}

export const getPercentageChange = (oldNumber, newNumber) => {
    const decreaseValue = newNumber - oldNumber;
    return oldNumber > 0 ? (decreaseValue / oldNumber) * 100 : 100;
}