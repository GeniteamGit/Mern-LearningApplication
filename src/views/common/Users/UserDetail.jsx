import {Card, CardBody, CardHeader, Col, Container, Row} from "reactstrap";
import {buildStyles, CircularProgressbar} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const UserDetail = (props) => {

    return (
        <>
            <div className="header pb-8 pt-5 pt-lg-8 d-flex align-items-center">
                <span className="mask bg-gradient-default opacity-8"/>
            </div>
            <Container className="mt--7" fluid>
                <Row>
                    <Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
                        <Card className="shadow">
                            <CardHeader className="border-0">
                                <h3 className="mb-0">Level 1</h3>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col xs={3} className="text-center">
                                        <CircularProgressbar
                                            value={50} text={`50%`}
                                            styles={buildStyles({
                                                pathColor: `rgba(94, 114, 228, 1)`,
                                                textColor: '#172b4d',
                                                trailColor: '#f4f5f7',
                                                backgroundColor: '#3e98c7',
                                            })}
                                        />
                                        <h5 className="mt-3 mb-0">Initiative</h5>
                                    </Col>
                                    <Col xs={3} className="text-center">
                                        <CircularProgressbar
                                            value={70} text={`70%`}
                                            styles={buildStyles({
                                                pathColor: `rgba(94, 114, 228, 1)`,
                                                textColor: '#172b4d',
                                                trailColor: '#f4f5f7',
                                                backgroundColor: '#3e98c7',
                                            })}
                                        />
                                        <h5 className="mt-3 mb-0">Innovation</h5>
                                    </Col>
                                    <Col xs={3} className="text-center">
                                        <CircularProgressbar
                                            value={80} text={`80%`}
                                            styles={buildStyles({
                                                pathColor: `rgba(94, 114, 228, 1)`,
                                                textColor: '#172b4d',
                                                trailColor: '#f4f5f7',
                                                backgroundColor: '#3e98c7',
                                            })}
                                        />
                                        <h5 className="mt-3 mb-0">Teamwork</h5>
                                    </Col>
                                    <Col xs={3} className="text-center">
                                        <CircularProgressbar
                                            value={20} text={`20%`}
                                            styles={buildStyles({
                                                pathColor: `rgba(94, 114, 228, 1)`,
                                                textColor: '#172b4d',
                                                trailColor: '#f4f5f7',
                                                backgroundColor: '#3e98c7',
                                            })}
                                        />
                                        <h5 className="mt-3 mb-0">Results Orientation</h5>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col className="order-xl-1" xl="8">
                        <Card className="shadow">
                            <CardHeader>
                                <h3 className="mb-0">Answers</h3>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col>
                                        <p className="small text-muted mb-0">Level 1 <span
                                            className="mx-2">|</span> Category</p>
                                        <h3 className="mb-0">Lorem ipsum dolor sit amet, consectetur adipisicing
                                            elit.</h3>
                                        <p className="small text-muted mb-2">Score: 20</p>
                                        <ul className="list-unstyled ">
                                            <li>
                                                <i className="fas fa-angle-right mr-2"/> quaerat quibusdam voluptate
                                                voluptates!
                                            </li>
                                            <li>
                                                <i className="fas fa-angle-right mr-2"/> quaerat quibusdam voluptate
                                                voluptates!
                                            </li>
                                            <li>
                                                <i className="fas fa-angle-right mr-2"/> quaerat quibusdam voluptate
                                                voluptates!
                                            </li>
                                            <li>
                                                <i className="fas fa-angle-right mr-2"/> quaerat quibusdam voluptate
                                                voluptates!
                                            </li>
                                        </ul>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default UserDetail;