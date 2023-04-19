import {Card, CardBody, CardHeader, Col, Container, Row,} from "reactstrap";
import Header from "components/Headers/Header.js";
import {firebaseConstants, getDb, getPercentageChange} from "../../util/Constants";
import {collection, getDocs, query, where} from "firebase/firestore";
import {useEffect, useState} from "react";
import moment from "moment";

const Index = (props) => {
    const [newUsersCount, setNewUsersCount] = useState(0);
    const [newUsersChange, setNewUsersChange] = useState(0);

    const db = getDb();
    const usersRef = collection(db, firebaseConstants.dbUsers);

    useEffect(() => {
        getUserInPastTwoWeeks().then(r => {
        })
    }, []);

    const getUserInPastTwoWeeks = async () => {
        let totalCount = 0, thisWeekCount = 0, previousWeekCount = 0;
        // .format('Do MMM YYYY hh:mm a')
        const oneWeekBefore = moment().subtract(1, 'week').startOf('isoWeek');
        const twoWeekBefore = moment().subtract(2, 'week').startOf('isoWeek');
        const q = query(usersRef,
            where('userCreated', '>', twoWeekBefore.valueOf())
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach((doc) => {
            const data = doc.data();
            totalCount++;
            if (data.userCreated >= oneWeekBefore.valueOf()) {
                thisWeekCount++;
            } else {
                previousWeekCount++;
            }
        });

        setNewUsersCount(thisWeekCount);
        setNewUsersChange(getPercentageChange(previousWeekCount, thisWeekCount));

        
    }

    return (
        <>
            <Header data={{
                newUsers: {
                    count: newUsersCount,
                    change: newUsersChange
                },
                completed: {
                    count: 0,
                    change: 0
                }
            }}/>
            {/* Page content */}
            <Container className="mt--7" fluid>
                <Row>
                    <Col className="mb-5 mb-xl-0" xl="8">
                        <Card className="bg-gradient-default shadow">
                            <CardHeader className="bg-transparent">
                                <Row className="align-items-center">
                                    <Col>
                                        <h6 className="text-uppercase text-light ls-1 mb-1">
                                            Overview
                                        </h6>
                                        <h2 className="text-white mb-0">Competencies</h2>
                                    </Col>
                                </Row>
                            </CardHeader>
                            <CardBody>
                                {/* Chart */}
                                <div className="chart">
                                    {/*<Line*/}
                                    {/*    data={chartExample1[chartExample1Data]}*/}
                                    {/*    options={chartExample1.options}*/}
                                    {/*    getDatasetAtEvent={(e) => 
                                    {/*/>*/}
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl="4">
                        <Card className="shadow">
                            <CardHeader className="bg-transparent">
                                <Row className="align-items-center">
                                    <div className="col">
                                        <h6 className="text-uppercase text-muted ls-1 mb-1">
                                            Overview
                                        </h6>
                                        <h2 className="mb-0">Users</h2>
                                    </div>
                                </Row>
                            </CardHeader>
                            <CardBody>
                                {/* Chart */}
                                <div className="chart">
                                    {/*<Bar*/}
                                    {/*    data={chartExample2.data}*/}
                                    {/*    options={chartExample2.options}*/}
                                    {/*/>*/}
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default Index;
