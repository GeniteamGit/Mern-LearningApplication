## Progress | Learning Application

### Introduction

At enhancing employee engagement and learning through the use of surveys and quizzes related to online gaming. Our
platform offers a fast-paced and engaging way for employees to learn and assess their knowledge and skills, while also
providing detailed analytical reports for the backend. Through situational-based learning, we aim to increase the
efficiency and effectiveness of employees while also evaluating four strengths in one go. Our dynamic content and
leaderboard feature offer multi-level engagement for employees, and our analytical reports provide detailed insights for
employers to improve their training programs. Overall, our platform offers an innovative and effective solution for
employee training and development.
<br>The product is owned by Activ8 Games & developed by Geniteam as sole development partner. This product was used in
Local & international conferences online at various levels.

### Features
<ol>
<li>Surveys and quizzes related to online gaming</li>
<li>Situational-based learning to increase employee efficiency and effectiveness</li>
<li>Fast-paced learning and assessments</li>
<li>Multi-level engagement for employees</li>
<li>Evaluation of four strengths in one go</li>
<li>Backend leaderboard to track employee progress and performance</li>
<li>Detailed analytical reports for the backend</li>
<li>Customizable content for tailored learning experiences</li>
<li>User-friendly interface for easy navigation</li>
<li>Multi-language support for international companies</li>
<li>Integration with company LMS and HR systems</li>
<li>Secure data storage and protection of employee information.</li>
</ol>

### Main Technologies/Libraries Used

<ul>
<li>React.js</li>
<li>Firebase</li>
<li>bootstrap</li>
<li>reactstrap</li>
<li>google-spreadsheet</li>
<li>moment</li>
<li>multiselect-react-dropdown</li>
<li>node-sass</li>
<li>nouislider</li>
<li>react-chartjs-2</li>
<li>react-circular-progressbar</li>
<li>react-copy-to-clipboard</li>
<li>react-csv</li>
<li>react-data-table-component</li>
<li>react-datepicker</li>
<li>react-loading-skeleton</li>
<li>styled-components</li>
</ul>

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more
information about test.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### 🗄️ Project Structure

Most of the code lives in the `src` folder and looks like this:

````
.
├── public
├── src/
│   ├── assets/
│   │   ├── css
│   │   ├── fonts
│   │   ├── img
│   │   ├── plugins
│   │   └── scss
│   ├── components/
│   │   ├── Custom
│   │   ├── Datepicker
│   │   ├── Footers
│   │   ├── Headers
│   │   ├── Navbars
│   │   └── Sidebar
│   ├── layouts/
│   │   ├── Admin.js
│   │   └── Auth.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── common.js
│   │   ├── index.js
│   │   └── superAdmin.js
│   ├── util/
│   │   ├── Constants.js
│   │   └── SheetManager.js
│   ├── variables/
│   │   └── charts.js
│   ├── views/
│   │   ├── admin
│   │   ├── common/
│   │   │   ├── Users
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── LevelStatistics.jsx
│   │   │   ├── LevelStrengths.jsx
│   │   │   ├── OverallStrengths.jsx
│   │   │   └── StrengthDetails.jsx
│   │   ├── examples
│   │   └── superAdmin/
│   │       ├── AddLevel.jsx
│   │       ├── AddQuestion.jsx
│   │       ├── EditLevel.jsx
│   │       ├── EditQuestion.jsx
│   │       ├── Index.jsx
│   │       ├── LevelDetails.jsx
│   │       ├── Levels.jsx
│   │       ├── MiniGameAddQuestion.jsx
│   │       └── MiniGameAddQuestion.jsx
│   ├── App.js
│   └── index.js
├── .gitignore
├── package.json
└── Readme.md
````