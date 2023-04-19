import {Card, CardBody, CardHeader, Col, Container, Row} from "reactstrap";
import Chart from "chart.js";
import {Bar} from "react-chartjs-2";
import {useEffect, useState} from "react";
import {barGraphOptions, firebaseConstants, getDb} from "../../util/Constants";
import {collection, getDocs, query} from "firebase/firestore";
import numeral from 'numeral';
import DataTable from "react-data-table-component";
import _ from "lodash";
import {chartOptions, parseOptions} from "../../variables/charts";

const LevelStatistics = (props) => {
    const [graphData, setGraphData] = useState({labels: [], datasets: []});
    const [tableData, setTableData] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    if (window.Chart) {
        parseOptions(Chart, chartOptions());
    }

    const db = getDb();
    const usersRef = collection(db, firebaseConstants.dbUsers);

    useEffect(async () => {
        const dataHolder = {};
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach((doc) => {
            if (doc.id !== 'analytics') {
                const userData = doc.data();
                Object.keys(userData.levelScores).map(levelName => {
                    const score = userData.levelScores[levelName];
                    if (!dataHolder[levelName]) {
                        dataHolder[levelName] = {score: 0, users: 0, max: 0, min: 100000};
                    }

                    dataHolder[levelName].score += score;
                    dataHolder[levelName].users += 1;
                    if (dataHolder[levelName].max < score) {
                        dataHolder[levelName].max = score;
                    }
                    if (dataHolder[levelName].min > score) {
                        dataHolder[levelName].min = score;
                    }
                });
            }
        });

        const tData = [];
        let actualLabels = [];
        Object.keys(dataHolder).map(level => {
            const levelName = level.match(/[a-zA-Z]+/g);
            const levelNumber = level.match(/\d+/g);
            tData.push({
                level: `${_.startCase(levelName)} ${levelNumber[0]}`,
                levelName: _.startCase(levelName),
                levelNumber: Number(levelNumber[0]),
                score: dataHolder[level].score,
                users: dataHolder[level].users,
                min: dataHolder[level].min,
                max: dataHolder[level].max
            });

            actualLabels.push({
                level: level,
                levelName: _.startCase(levelName),
                levelNumber: Number(levelNumber[0])
            });
        });

        actualLabels = _.orderBy(actualLabels, ['levelNumber'], ['asc']);

        

        setTableData(_.orderBy(tData, ['levelNumber'], ['asc']));
        setGraphData({
            labels: _.orderBy(actualLabels, ['levelNumber'], ['asc']).map(label => `${label.levelName} ${label.levelNumber}`),
            datasets: [
                {
                    label: 'Minimum',
                    data: actualLabels.map(level => dataHolder[level.level].min),
                    backgroundColor: 'rgb(243,223,3)',
                    categoryPercentage: 0.75,
                    barPercentage: 0.5
                },
                {
                    label: 'Average',
                    data: actualLabels.map(level => Math.round(((dataHolder[level.level].score / dataHolder[level.level].users) + Number.EPSILON) * 100) / 100),
                    backgroundColor: 'rgb(43,203,0)',
                    categoryPercentage: 0.75,
                    barPercentage: 0.5
                },
                {
                    label: 'Maximum',
                    data: actualLabels.map(level => dataHolder[level.level].max),
                    backgroundColor: 'rgb(1,199,170)',
                    categoryPercentage: 0.75,
                    barPercentage: 0.5
                }
            ]
        })
        setLoadingData(false);
    }, []);

    return (
        <>
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8"/>
            <Container className="mt--9" fluid>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            {/*<CardHeader className="bg-transparent">*/}
                            {/*    <h6 className="text-uppercase text-light ls-1 mb-1">*/}
                            {/*        Statistics*/}
                            {/*    </h6>*/}
                            {/*    <h2 className="text-white mb-0">Users</h2>*/}
                            {/*</CardHeader>*/}
                            <CardBody>
                                <div className="chart">
                                    <Bar options={barGraphOptions} data={graphData}/>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0">
                                <h6 className="text-uppercase text-light ls-1 mb-0">
                                    Levels
                                </h6>
                                <h2 className="mb-0">Scores</h2>
                            </CardHeader>
                            <DataTable
                                columns={[
                                    {name: 'Level', center: true, selector: row => row.level},
                                    {
                                        name: 'No. of Users', center: true,
                                        selector: row => row.users,
                                        format: row => numeral(row.users).format('0,0')
                                    },
                                    {
                                        name: 'Minimum', center: true,
                                        selector: row => row.min,
                                        format: row => numeral(row.min).format('0,0')
                                    },
                                    {
                                        name: 'Average', center: true,
                                        selector: row => (row.score / row.users),
                                        format: row => numeral(row.score / row.users).format('0,0.[00]')
                                    },
                                    {
                                        name: 'Maximum', center: true,
                                        selector: row => row.max,
                                        format: row => numeral(row.max).format('0,0')
                                    }
                                ]}
                                data={tableData}
                                progressPending={loadingData}
                                pagination
                                responsive
                                highlightOnHover
                            />
                        </Card>
                        <Col/>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default LevelStatistics;