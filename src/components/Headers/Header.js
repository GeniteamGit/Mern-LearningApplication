import {Card, CardBody, CardTitle, Col, Container, Row} from "reactstrap";
import classNames from "classnames";
import numeral from 'numeral';

const Header = ({data}) => {
  return (
      <>
        <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
          <Container fluid>
            <div className="header-body">
              {/* Card stats */}
              <Row>
                <Col lg="6" xl="3">
                  <Card className="card-stats mb-4 mb-xl-0">
                    <CardBody>
                      <Row>
                        <div className="col">
                          <CardTitle
                              tag="h5"
                              className="text-uppercase text-muted mb-0"
                          >
                            New users
                          </CardTitle>
                          <span className="h2 font-weight-bold mb-0">{data.newUsers.count}</span>
                        </div>
                        <Col className="col-auto">
                          <div className="icon icon-shape bg-warning text-white rounded-circle shadow">
                            <i className="fas fa-users"/>
                          </div>
                        </Col>
                      </Row>
                      <p className="mt-3 mb-0 text-muted text-sm">
                      <span className={classNames("mr-2", {
                        "text-danger": data.newUsers.change < 0,
                        "text-success": data.newUsers.change >= 0,
                      })}>
                        <i className={classNames("fas", {
                          "fa-arrow-down": data.newUsers.change < 0,
                          "fa-arrow-up": data.newUsers.change >= 0,
                        })}/> {numeral(data.newUsers.change).format('0,0.00')}%
                      </span>{" "}
                        <span className="text-nowrap">Since last week</span>
                      </p>
                    </CardBody>
                  </Card>
                </Col>
                <Col lg="6" xl="3">
                  <Card className="card-stats mb-4 mb-xl-0">
                    <CardBody>
                      <Row>
                        <div className="col">
                          <CardTitle
                              tag="h5"
                              className="text-uppercase text-muted mb-0"
                          >
                            Completed
                          </CardTitle>
                          <span className="h2 font-weight-bold mb-0">{data.completed.count}</span>
                        </div>
                        <Col className="col-auto">
                          <div className="icon icon-shape bg-yellow text-white rounded-circle shadow">
                            <i className="fas fa-check"/>
                          </div>
                        </Col>
                      </Row>
                      <p className="mt-3 mb-0 text-muted text-sm">
                      <span className={classNames("mr-2", {
                        "text-danger": data.completed.change < 0,
                        "text-success": data.completed.change >= 0,
                      })}>
                        <i className={classNames("fas", {
                          "fa-arrow-down": data.completed.change < 0,
                          "fa-arrow-up": data.completed.change >= 0,
                        })}/> {numeral(data.completed.change).format('0,0.00')}%
                      </span>{" "}
                        <span className="text-nowrap">Since yesterday</span>
                      </p>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </div>
          </Container>
        </div>
      </>
  );
};

export default Header;
