/*!

=========================================================
* Argon Dashboard React - v1.2.1
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2021 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
/*eslint-disable*/

// reactstrap components
import {Col, Container, Row} from "reactstrap";

const Login = () => {
  return (
      <>
        <footer className="py-5">
          <Container>
            <Row className="align-items-center justify-content-around">
              <Col xl="6">
                <div className="copyright text-center text-muted">
                  © {new Date().getFullYear()}{" "}
                  <a
                      className="font-weight-bold ml-1"
                      href="https://activ8games.com" target="_blank"
                  >
                    Activ8Games
                  </a>
                </div>
              </Col>

            </Row>
          </Container>
        </footer>
      </>
  );
};

export default Login;
