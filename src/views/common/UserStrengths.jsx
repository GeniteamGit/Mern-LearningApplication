import {Card, CardBody, CardHeader, Col, Container, Row, Table} from "reactstrap";
import {buildStyles, CircularProgressbarWithChildren} from "react-circular-progressbar";
import {
    capabilityStyles,
    firebaseConstants,
    getCapabilityColor,
    getDb,
    lineChartOptions,
    multiselectDropdownStyle
} from "../../util/Constants";
import {collection, doc, getDoc, getDocs, limit, orderBy, query, where} from "firebase/firestore";
import {useEffect, useRef, useState} from "react";
import numeral from 'numeral';
import Multiselect from "multiselect-react-dropdown";
import _ from "lodash";
import Chart from "chart.js";
import {Line} from "react-chartjs-2";
import {chartOptions, parseOptions} from "variables/charts.js";

let timer = null;

const UserStrengths = (props) => {
    const [nameSearchData, setNameSearchData] = useState([]);
    const [emailSearchData, setEmailSearchData] = useState([]);
    const [loadingSearchData, setLoadingSearchData] = useState(false);
    const [selectedUser, setSelectedUser] = useState({});
    const [levelScoresData, setLevelScoresData] = useState(null);
    const [levelWiseData, setLevelWiseData] = useState(null);
    const [totalData, setTotalData] = useState(null);
    const [graphData, setGraphData] = useState({labels: [], datasets: []});
    const [message, setMessage] = useState('Select a user from dropdown(s)');
    const [capabilities, setCapabilities] = useState([]);

    if (window.Chart) {
        parseOptions(Chart, chartOptions());
    }

    const db = getDb();
    const usersRef = collection(db, firebaseConstants.dbUsers);
    const utilRef = collection(db, firebaseConstants.dbUtil);
    const searchByNameDropdown = useRef();
    const searchByEmailDropdown = useRef();

    useEffect(() => {
        getMetaData().then(data => {
            setCapabilities(data.capabilities);
        });
        handleSearch('', 'name', true).then(r => {
        });
    }, []);

    const getMetaData = async () => {
        let capabilities = [];
        const docRef = doc(utilRef, 'meta');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            capabilities = data.capabilities ? data.capabilities : [];
        }

        return {capabilities: capabilities};
    }

    const fetchData = async obj => {
        const levelWise = {capabilities: {}, levels: {}}, total = {capabilities: {}, score: 0}, levelScores = {};
        const docRef = doc(db, 'users', obj.id);
        const user = await getDoc(docRef);

        if (user.exists()) {
            const userData = {id: user.id, ...user.data()};
            setSelectedUser(userData);

            for (const [level, score] of Object.entries(userData.levelScores)) {
                // 
                total.score += score;
                levelScores[level] = score;
            }

            Object.keys(userData.capabilities).map(capabilityName => {
                const capability = userData.capabilities[capabilityName];
                // 
                if (!total.capabilities[capabilityName]) {
                    total.capabilities[capabilityName] = {
                        levels: 0, achievedScore: 0,
                        percentage: 0,
                        totalQuestions: 0,
                        totalScore: 0,
                        userSelectedValue: userData.capabilities[capabilityName].userSelectedValue
                    };
                }

                // if (capability.status && capability.scores) {
                if (capability.scores) {

                    Object.keys(capability.scores).map(levelName => {
                        if (capability.scores[levelName].totalQuestions > 0) {
                            total.capabilities[capabilityName].levels += 1;
                            total.capabilities[capabilityName].achievedScore += capability.scores[levelName].achievedScore;
                            total.capabilities[capabilityName].percentage += capability.scores[levelName].percentage;
                            total.capabilities[capabilityName].totalQuestions += capability.scores[levelName].totalQuestions;
                            total.capabilities[capabilityName].totalScore += capability.scores[levelName].totalScore;
                        }

                        if (!levelWise.capabilities[levelName]) {
                            const lName = levelName.match(/[a-zA-Z]+/g);
                            const lNumber = levelName.match(/\d+/g);
                            levelWise.capabilities[levelName] = {name: `${_.startCase(lName)} ${lNumber[0]}`};
                        }

                        if (!levelWise.capabilities[levelName][capabilityName]) {
                            levelWise.capabilities[levelName][capabilityName] = {
                                achievedScore: 0,
                                percentage: 0,
                                totalQuestions: 0,
                                totalScore: 0
                            };
                        }

                        if (!levelWise.levels[levelName]) {
                            levelWise.levels[levelName] = {score: 0};
                        }

                        levelWise.capabilities[levelName][capabilityName].achievedScore = capability.scores[levelName].achievedScore;
                        levelWise.capabilities[levelName][capabilityName].percentage = capability.scores[levelName].percentage;
                        levelWise.capabilities[levelName][capabilityName].totalQuestions = capability.scores[levelName].totalQuestions;
                        levelWise.capabilities[levelName][capabilityName].totalScore = capability.scores[levelName].totalScore;
                        levelWise.levels[levelName].score = userData.levelScores[levelName];
                    });
                }
            });

            const dataset = [];
            const levels = _.orderBy(Object.keys(levelWise.capabilities).map(levelName => ({
                level: levelName,
                name: levelName.match(/[a-zA-Z]+/g)[0],
                number: Number(levelName.match(/\d+/g)[0])
            })), ['number'], ['asc']);

            capabilities.forEach((capability, index) => {
                const levelScores = [];
                levels.forEach(data => {
                    levelScores.push(levelWise.capabilities[data.level][capability] ? numeral(levelWise.capabilities[data.level][capability].percentage).format('0,0.[0]') : 0)
                });

                const color = getCapabilityColor(index);
                dataset.push({
                    label: _.startCase(capability),
                    data: levelScores,
                    borderColor: color,
                    fill: false,
                    // tension: 0,
                    pointBackgroundColor: color,
                    pointBorderColor: color,
                    pointRadius: 4,
                    // clip: {left: -20, top: 0, right: -20, bottom: 0}
                    // categoryPercentage: 0.75,
                    // barPercentage: 0.5
                });
            });

            setLevelWiseData(levelWise);
            setTotalData(total);
            setLevelScoresData(levelScores);
            setGraphData({
                labels: levels.map(data => `${_.startCase(data.name)} ${data.number}`),
                datasets: dataset
            })
        } else {
            // doc.data() will be undefined in this case
            setLevelWiseData(null);
            setTotalData(null);
            setMessage('No user found with that email.');
        }
    }

    const handleSearch = async (searchText, searchBy, forBoth = false) => {
        let userData = [];
        const q = query(usersRef,
            where(`${searchBy}_insensitive`, '>=', searchText.toLowerCase()),
            orderBy(`${searchBy}_insensitive`),
            limit(5)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach((doc) => {
            const data = doc.data();
            userData.push({value: <span>{data.name} - <span className="">{doc.id}</span></span>, id: doc.id, ...data});
        });

        userData = userData.filter(_data => _data[`${searchBy}_insensitive`].startsWith(searchText.toLowerCase()));

        if (forBoth) {
            setNameSearchData(userData);
            setEmailSearchData(userData);
        } else {
            if (searchBy === 'name') setNameSearchData(userData);
            if (searchBy === 'email') setEmailSearchData(userData);
        }
        setLoadingSearchData(false);
    }

    return (
        <>
            {/*<div className="header pb-8 pt-5 pt-lg-8 d-flex align-items-center">*/}
            {/*    <span className="mask bg-gradient-default opacity-8"/>*/}
            {/*</div>*/}
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">

            </div>
            <Container className="mt--9" fluid>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader
                                className="border-0 d-lg-flex justify-content-lg-between align-items-lg-center">
                                <div>
                                    <h2 className="mb-md-2 mb-lg-0">User Strengths Report</h2>
                                    {
                                        selectedUser.name &&
                                        <h6 className="text-uppercase text-muted ls-1 mb-0">
                                            {selectedUser.name} | {selectedUser.email}
                                        </h6>
                                    }
                                </div>

                                <div className="d-lg-flex justify-content-lg-start align-items-lg-center">
                                    <p className="mb-0 mt-1 mr-3 text-muted custom-label">Select:</p>
                                    <div className="mr-3">
                                        <Multiselect
                                            className="form-control-alternative"
                                            ref={searchByNameDropdown}
                                            // showArrow={true}
                                            hidePlaceholder={true}
                                            displayValue="value"
                                            selectionLimit={1}
                                            placeholder="Search by Name"
                                            options={nameSearchData}
                                            closeIcon="cancel"
                                            loading={loadingSearchData}
                                            onSelect={(list, item) => {
                                                searchByEmailDropdown.current.resetSelectedValues();
                                                fetchData(item).then(r => {
                                                });
                                            }}
                                            onSearch={text => {
                                                // setNameSearchData([]);
                                                clearTimeout(timer);
                                                if (text.length >= 1) {
                                                    setLoadingSearchData(true);
                                                    timer = setTimeout(() => {
                                                        handleSearch(text, 'name').then(r => {
                                                        });
                                                    }, 1000);
                                                } else {
                                                    setLoadingSearchData(false);
                                                }
                                            }}
                                            style={multiselectDropdownStyle}
                                        />
                                    </div>
                                    <Multiselect
                                        className="form-control-alternative"
                                        ref={searchByEmailDropdown}
                                        // showArrow={true}
                                        hidePlaceholder={true}
                                        displayValue="value"
                                        selectionLimit={1}
                                        placeholder="Search by Email"
                                        options={emailSearchData}
                                        closeIcon="cancel"
                                        loading={loadingSearchData}
                                        onSelect={(list, item) => {
                                            searchByNameDropdown.current.resetSelectedValues();
                                            fetchData(item).then(r => {
                                            });
                                        }}
                                        onSearch={text => {
                                            // setEmailSearchData([]);
                                            clearTimeout(timer);
                                            if (text.length >= 1) {
                                                setLoadingSearchData(true);
                                                timer = setTimeout(() => {
                                                    handleSearch(text, 'email').then(r => {
                                                    });
                                                }, 1000);
                                            } else {
                                                setLoadingSearchData(false);
                                            }
                                        }}
                                        style={multiselectDropdownStyle}
                                    />
                                </div>
                            </CardHeader>
                        </Card>
                    </Col>
                </Row>
                {
                    levelWiseData && totalData ?
                        <>
                            <Row className="mb-4">
                                <Col lg={8}>
                                    <Card className="bg-secondary shadow mb-4 mb">
                                        <CardHeader
                                            className="bg-white border-0">
                                            <h2 className="mb-0">User Selected Values</h2>
                                        </CardHeader>
                                        <CardBody>
                                            <Row>
                                                {
                                                    capabilities.map((capability, index) => (
                                                        <Col lg={3} xs={6} className="text-center">
                                                            <CircularProgressbarWithChildren
                                                                value={numeral(totalData.capabilities[capability].userSelectedValue).format('0,0.[0]')}
                                                                styles={buildStyles(capabilityStyles(index, totalData.capabilities[capability].userSelectedValue))}
                                                            >
                                                                <h2 className="mb-0">{numeral(totalData.capabilities[capability].userSelectedValue).format('0,0.[0]')}%</h2>
                                                            </CircularProgressbarWithChildren>
                                                            <h5 className="mt-3 mb-4 mb-md-0">{_.startCase(capability)}</h5>
                                                        </Col>
                                                    ))
                                                }
                                            </Row>
                                        </CardBody>
                                    </Card>
                                    {
                                        totalData &&
                                        <Card className="bg-secondary shadow mb-4 mb-lg-0">
                                            <CardHeader
                                                className="bg-white border-0 d-flex justify-content-between align-items-center">
                                                <h2 className="mb-0">All Levels</h2>
                                                <h2 className="text-muted mb-0"><span
                                                    className="small">Score:</span> {numeral(totalData.score).format('0,0.[0]')}
                                                </h2>
                                            </CardHeader>
                                            <CardBody>
                                                <Row>
                                                    {
                                                        capabilities.map((capability, index) => (
                                                            <Col lg={3} xs={6} className="text-center">
                                                                <CircularProgressbarWithChildren
                                                                    value={numeral(totalData.capabilities[capability].percentage / totalData.capabilities[capability].levels).format('0,0.[0]')}
                                                                    styles={buildStyles(capabilityStyles(index, totalData.capabilities[capability].percentage / totalData.capabilities[capability].levels))}
                                                                >
                                                                    <h2 className="mb-0">{numeral(totalData.capabilities[capability].percentage / totalData.capabilities[capability].levels).format('0,0.[0]')}%</h2>
                                                                    <p className="fs-12 font-weight-bold mb-0">{totalData.capabilities[capability].totalQuestions ? totalData.capabilities[capability].totalQuestions : 0} questions</p>
                                                                </CircularProgressbarWithChildren>
                                                                <h5 className="mt-3 mb-4 mb-md-0">{_.startCase(capability)}</h5>
                                                            </Col>
                                                        ))
                                                    }
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    }
                                </Col>
                                <Col lg={4}>
                                    <Card className="shadow">
                                        <Table className="align-items-center" responsive>
                                            <thead className="thead-light">
                                            <tr>
                                                <th scope="col">Level</th>
                                                <th scope="col">Score</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {
                                                levelScoresData &&
                                                _.orderBy(Object.keys(levelScoresData).map(levelName => ({
                                                    level: levelName,
                                                    name: levelName.match(/[a-zA-Z]+/g),
                                                    number: Number(levelName.match(/\d+/g)[0])
                                                })), ['number'], ['asc']).map(data => (
                                                    <tr>
                                                        <td>
                                                            {`${_.startCase(data.name)} ${data.number}`}
                                                        </td>
                                                        <td>
                                                            {numeral(levelScoresData[data.level]).format('0,0.[0]')}
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                            <tr>
                                                <td className="font-weight-bolder">
                                                    Total
                                                </td>
                                                <td className="font-weight-bolder">
                                                    {numeral(totalData.score).format('0,0.[0]')}
                                                </td>
                                            </tr>
                                            </tbody>
                                        </Table>
                                    </Card>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    {
                                        levelWiseData &&
                                        <Card className="shadow mb-4">
                                            <CardBody>
                                                <div className="chart">
                                                    {/*<Bar options={barGraphOptions} data={graphData}/>*/}
                                                    <Line options={lineChartOptions} data={graphData}/>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    }
                                </Col>
                            </Row>
                            <Row>
                                {
                                    levelWiseData && Object.keys(levelWiseData.capabilities).length > 0 ?
                                        _.orderBy(Object.keys(levelWiseData.capabilities).map(levelName => ({
                                            level: levelName,
                                            name: levelName.match(/[a-zA-Z]+/g),
                                            number: Number(levelName.match(/\d+/g)[0])
                                        })), ['number'], ['asc']).map(data => (
                                            <Col lg={6} className="mb-4">
                                                <Card className="bg-secondary shadow">
                                                    <CardHeader
                                                        className="bg-white border-0 d-flex justify-content-between align-items-center">
                                                        <h2 className="mb-0">{levelWiseData.capabilities[data.level].name}</h2>
                                                        <h2 className="text-muted mb-0"><span
                                                            className="small">Score:</span> {numeral(levelWiseData.levels[data.level].score).format('0,0.[0]')}
                                                        </h2>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <Row>
                                                            {
                                                                capabilities.map((capability, index) => (
                                                                    <Col lg={3} xs={6} className="text-center">
                                                                        <CircularProgressbarWithChildren
                                                                            value={levelWiseData.capabilities[data.level][capability] ? numeral(levelWiseData.capabilities[data.level][capability].percentage).format('0,0.[0]') : 0}
                                                                            styles={buildStyles(capabilityStyles(index, levelWiseData.capabilities[data.level][capability] ? levelWiseData.capabilities[data.level][capability].score : 0))}
                                                                        >
                                                                            <h2 className="mb-0">{levelWiseData.capabilities[data.level][capability] ? `${numeral(levelWiseData.capabilities[data.level][capability].percentage).format('0,0.[0]')}` : '0'}%</h2>
                                                                            <p className="fs-12 font-weight-bold mb-0">{levelWiseData.capabilities[data.level][capability] ? `${numeral(levelWiseData.capabilities[data.level][capability].totalQuestions).format('0,0.[0]')}` : '0'} questions</p>
                                                                        </CircularProgressbarWithChildren>
                                                                        <h5 className="mt-3 mb-4 mb-md-0 smaller-h5">{_.startCase(capability)}</h5>
                                                                    </Col>
                                                                ))
                                                            }
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        )) :
                                        <Col className="text-center mt-7">
                                            <p>No level data found</p>
                                        </Col>
                                }
                            </Row>
                        </> :
                        <div className="mt-7 text-center">
                            {message}
                        </div>
                }
            </Container>
        </>
    )
}

export default UserStrengths;
