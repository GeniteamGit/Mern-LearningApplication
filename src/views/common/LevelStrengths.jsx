import {Card, CardBody, CardHeader, Col, Container, Progress, Row} from "reactstrap";
import {useEffect, useState} from "react";
import {capabilityStyles, firebaseConstants, getCapabilityColor, getDb, lineChartOptions} from "../../util/Constants";
import {collection, doc, getDoc, getDocs, query} from "firebase/firestore";
import numeral from "numeral";
import DataTable from "react-data-table-component";
import {buildStyles, CircularProgressbarWithChildren} from "react-circular-progressbar";
import _ from "lodash";
import {Line} from "react-chartjs-2";
import {chartOptions, parseOptions} from "variables/charts.js";
import Chart from "chart.js";

const LevelStrengths = (props) => {
    const [tableData, setTableData] = useState([]);
    const [totalData, setTotalData] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [capabilities, setCapabilities] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    if (window.Chart) {
        parseOptions(Chart, chartOptions());
    }

    const db = getDb();
    const usersRef = collection(db, firebaseConstants.dbUsers);
    const utilRef = collection(db, firebaseConstants.dbUtil);

    useEffect(async () => {
        getMetaData().then(data => {
            setCapabilities(data.capabilities);
            getData(data.capabilities).then(data2 => {
                setTotalData(data2.totalData);
                setTableData(data2.tableData);
                setGraphData(data2.graphData);
                setLoadingData(false);
            });
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

    const getData = async (_capabilities) => {
        const dataHolder = {}, _totalData = {levels: 0};
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach((doc) => {
            if (doc.id !== 'analytics') {
                const userData = doc.data();

                const hasAddedUserInLevel = [];
                Object.keys(userData.capabilities).map(capabilityName => {
                    const capability = userData.capabilities[capabilityName];
                    // 
                    // if (capability.status && capability.scores) {
                    if (capability.scores) {
                        Object.keys(capability.scores).map(levelName => {
                            if (!dataHolder[levelName]) {
                                dataHolder[levelName] = {users: 0};
                            }

                            if (!hasAddedUserInLevel.includes(levelName)) {
                                dataHolder[levelName].users += 1;
                                hasAddedUserInLevel.push(levelName);
                            }

                            if (!dataHolder[levelName][capabilityName]) {
                                dataHolder[levelName][capabilityName] = {
                                    achievedScore: 0,
                                    percentage: 0,
                                    totalQuestions: 0,
                                    totalScore: 0
                                };
                            }
                            dataHolder[levelName][capabilityName].achievedScore += capability.scores[levelName].achievedScore;
                            dataHolder[levelName][capabilityName].percentage += capability.scores[levelName].percentage;
                            dataHolder[levelName][capabilityName].totalQuestions += capability.scores[levelName].totalQuestions;
                            dataHolder[levelName][capabilityName].totalScore += capability.scores[levelName].totalScore;
                        });
                    }
                });
            }
        });

        Object.keys(dataHolder).map(levelObj => {
            _totalData.levels++;
            _capabilities.map(cap => {
                // 
                if (!_totalData[cap]) {
                    _totalData[cap] = {percentage: 0, totalQuestions: 0}
                }

                _totalData[cap].percentage += (dataHolder[levelObj].users ? (dataHolder[levelObj][cap].percentage / dataHolder[levelObj].users) : 0);
                _totalData[cap].totalQuestions += dataHolder[levelObj][cap].totalQuestions;
            })
        });

        const dataset = [];
        const levels = _.orderBy(Object.keys(dataHolder).map(levelName => ({
            level: levelName,
            name: levelName.match(/[a-zA-Z]+/g)[0],
            number: Number(levelName.match(/\d+/g)[0])
        })), ['number'], ['asc']);

        _capabilities.forEach((capability, index) => {
            const levelScores = [];
            levels.forEach(data => {
                levelScores.push(dataHolder[data.level][capability] ? numeral(dataHolder[data.level].users ? (dataHolder[data.level][capability].percentage / dataHolder[data.level].users) : 0).format('0,0.[0]') : 0)
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

        const tData = [];
        Object.keys(dataHolder).map(level => {
            const levelName = level.match(/[a-zA-Z]+/g);
            const levelNumber = level.match(/\d+/g);
            tData.push({
                level: `${_.startCase(levelName)} ${levelNumber[0]}`,
                levelName: _.startCase(levelName),
                levelNumber: Number(levelNumber[0]),
                ...dataHolder[level]
            });
        });

        return {
            totalData: _totalData,
            tableData: _.orderBy(tData, ['levelNumber'], ['asc']),
            graphData: {
                labels: levels.map(data => `${_.startCase(data.name)} ${data.number}`),
                datasets: dataset
            }
        };
    }

    const getTableColumns = () => {
        const columns = [
            {name: 'Level', center: true, selector: row => row.level},
            {
                name: 'No. of Users',
                center: true,
                selector: row => row.users,
                format: row => numeral(row.users).format('0,0')
            }
        ];

        capabilities.forEach(capability => {
            columns.push({
                name: _.startCase(capability),
                center: true,
                selector: row => (row[capability] / row.users),
                format: row => (
                    <div className="d-flex align-items-center">
                        <span
                            className="mr-2">{numeral(row.users ? (row[capability].percentage / row.users) : 0).format('0,0.[0]')}%</span>
                        <div>
                            <Progress
                                max="100"
                                value={row[capability] / row.users}
                                barClassName="bg-gradient-success"
                            />
                        </div>
                    </div>
                )
            })
        });

        return columns;
    }

    const getReducedValue = (_data, _capability) => {

        return {percentage: 0, questions: 0}
    }

    return (
        <>
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8"/>
            <Container className="mt--9" fluid>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0">
                                <h6 className="text-uppercase text-light ls-1 mb-0">
                                    Level-wise
                                </h6>
                                <h2 className="mb-0">Strength Report</h2>
                            </CardHeader>
                            <DataTable
                                columns={getTableColumns()}
                                data={tableData}
                                progressPending={loadingData}
                                pagination
                                responsive
                                highlightOnHover
                            />
                        </Card>
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col>
                        {
                            graphData &&
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
                <Row className="mb-4">
                    <Col>
                        {
                            totalData &&
                            <Card className="bg-secondary shadow mb-4 mb-lg-0">
                                <CardHeader
                                    className="bg-white border-0 d-flex justify-content-between align-items-center">
                                    <h2 className="mb-0">All Levels</h2>
                                    {/*<h2 className="text-muted mb-0"><span*/}
                                    {/*    className="small">Score:</span> {numeral(totalData.score).format('0,0.[0]')}*/}
                                    {/*</h2>*/}
                                </CardHeader>
                                <CardBody>
                                    <Row className="justify-content-around">
                                        {
                                            capabilities.map((capability, index) => (
                                                <Col lg={2} xs={6} key={`total_${capability}`} className="text-center">
                                                    <CircularProgressbarWithChildren
                                                        value={numeral(totalData.levels ? (totalData[capability].percentage / totalData.levels) : 0).format('0,0.[0]')}
                                                        // styles={buildStyles(progressStyles(levelData.initiative / levelData.users))}
                                                        styles={buildStyles(capabilityStyles(index, totalData[capability].percentage / totalData.levels))}
                                                    >
                                                        <h2 className="mb-0">{numeral(totalData.levels ? (totalData[capability].percentage / totalData.levels) : 0).format('0,0.[0]')}%</h2>
                                                        <p className="fs-12 font-weight-bold mb-0">{totalData.levels ? totalData[capability].totalQuestions : 0} questions</p>
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
                </Row>
                <Row className="mb-4">
                    {
                        tableData && tableData.map(levelData => (
                            <Col lg={6} key={`traits_${levelData.level}`}>
                                <Card className="shadow mb-3">
                                    <CardHeader className="border-0">
                                        {/*<h6 className="text-uppercase text-light ls-1 mb-1">*/}
                                        {/*    Overview*/}
                                        {/*</h6>*/}
                                        <h2 className="mb-0">{levelData.level}</h2>
                                    </CardHeader>
                                    <CardBody>
                                        <Row>
                                            {
                                                capabilities.map((capability, index) => (
                                                    <Col md={3} xs={6} className="text-center"
                                                         key={`traits_${capability}`}>
                                                        <CircularProgressbarWithChildren
                                                            value={numeral(levelData.users ? (levelData[capability].percentage / levelData.users) : 0).format('0,0.[0]')}
                                                            // styles={buildStyles(progressStyles(levelData.initiative / levelData.users))}
                                                            styles={buildStyles(capabilityStyles(index, levelData[capability].percentage / levelData.users))}
                                                        >
                                                            <h2 className="mb-0">{numeral(levelData.users ? (levelData[capability].percentage / levelData.users) : 0).format('0,0.[0]')}%</h2>
                                                            <p className="fs-12 font-weight-bold mb-0">{levelData.users ? levelData[capability].totalQuestions : 0} questions</p>
                                                        </CircularProgressbarWithChildren>
                                                        <h5 className="mt-3 mb-4 mb-md-0">{_.startCase(capability)}</h5>
                                                    </Col>
                                                ))
                                            }
                                        </Row>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))
                    }
                </Row>
            </Container>
        </>
    )
}

export default LevelStrengths;