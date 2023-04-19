import { useEffect, useState } from "react";
import { getLevel, getQuestions } from "../../util/SheetManager";
import { useHistory, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Collapse,
  Container,
  Row,
  Spinner,
} from "reactstrap";


import { MiniGameCard } from "../../components/Custom/MiniGameCard";
import { RESPONSE_ENUM } from "../../util/Constants";
import { getDb } from "../../util/Constants";


export default function LevelDetails(props) {
  const [levelData, setLevelData] = useState(null);
  const [questionsData, setQuestionsData] = useState(null);
  const [miniGameData, setMiniGameData] = useState([]);
  const [loading, setLoading] = useState(null);
  const [toggled, setToggled] = useState(0);

  const history = useHistory();
  const { lName } = useParams();

  useEffect(async () => {
    if (props.signedInUser) {
      if (props.sheetsLoaded) {
        try {
          getLevel(lName).then((_level) => setLevelData(_level));
          if (Number.isInteger(Number(lName))) {
            getQuestions(lName).then((_questions) =>
              setQuestionsData(_questions)
            );
          }
        } catch (e) {
          setLevelData(null);
          setQuestionsData(null);
        }
      }
    }
  }, [props.signedInUser, props.sheetsLoaded]);


  
  const deleteQuestion = async (_index) => {
    setLoading(`deleting${_index}`);
    let toDelete = null;
    const _data = questionsData.filter((_question, i) => {
      if (i === _index) {
        toDelete = _question;
        return false;
      } else {
        return true;
      }
    });

    if (toDelete) await toDelete.delete();

    setQuestionsData(_data);
    setLoading(null);
  };



  return (
    <>
      <div className="header bg-gradient-info pb-8 pt-5 pt-md-8" />
      <Container className="mt--9" fluid>
        <Row className="mb-4">
          <Col
            lg={4} //{Number.isInteger(Number(lName)) ? 4 : 12}
            className="order-lg-1 mb-3 mb-lg-0"
          >
            <Card className="shadow">
              <CardHeader className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">Details</h2>
                <Button
                  color="default"
                  size="sm"
                  onClick={() =>
                    history.push(`/admin/levels/${levelData["Tab Name"]}/edit`)
                  }
                >
                  <i className="fas fa-pencil-alt" />
                </Button>
              </CardHeader>
              {levelData ? (
                <CardBody>
                  <Row>
                    <Col xs={6}>
                      <p className="mb-0 small text-muted">Name</p>
                      <h2>{levelData["Tab Name"]}</h2>
                    </Col>
                    {/* <Col xs={6}>
                      {levelData["Final"] === "y" && (
                        <h2 className="mb-0">
                          <Badge color="primary">Final Level</Badge>
                        </h2>
                      )}
                    </Col> */}
                    <Col xs={6}>
                      <p className="mb-0 small text-muted">Passing Score</p>
                      <h2>{levelData["Passing Score"]}</h2>
                    </Col>
                    <Col xs={6}>
                      <p className="mb-0 small text-muted">Time</p>
                      <h2>
                        {levelData["Time(sec)"]}{" "}
                        <span className="small">seconds</span>
                      </h2>
                    </Col>
                    {Number.isInteger(Number(levelData["Tab Name"])) ? (
                      <>
                        <Col xs={6}>
                          <p className="mb-0 small text-muted">
                            Total Questions
                          </p>
                          <h2 className="mb-0">
                            {levelData["Total Questions"].split("|")[0]}
                            <span className="small font-weight-light">
                              {" "}
                              questions
                            </span>
                          </h2>
                          <h2 className="mb-0">
                            {levelData["Total Questions"].split("|")[1]}
                            <span className="small font-weight-light">
                              {" "}
                              emails
                            </span>
                          </h2>
                          <h2 className="mb-0">
                            {levelData["Total Questions"].split("|")[2]}
                            <span className="small font-weight-light">
                              {" "}
                              sms
                            </span>
                          </h2>
                        </Col>
                        <Col xs={6}>
                          <p className="mb-0 small text-muted">Min. Attempts</p>
                          <h2 className="mb-0">
                            {levelData["Min Attempt"].split("|")[0]}
                            <span className="small font-weight-light">
                              {" "}
                              questions
                            </span>
                          </h2>
                          <h2 className="mb-0">
                            {levelData["Min Attempt"].split("|")[1]}
                            <span className="small font-weight-light">
                              {" "}
                              emails
                            </span>
                          </h2>
                          <h2 className="mb-0">
                            {levelData["Min Attempt"].split("|")[2]}
                            <span className="small font-weight-light">
                              {" "}
                              sms
                            </span>
                          </h2>
                        </Col>
                      </>
                    ) : (
                      <Col xs={6}>
                        <p className="mb-0 small text-muted">Level</p>
                        <h2>{levelData["Total Questions"].split("=")[1]}</h2>
                      </Col>
                    )}
                    <Col xs={12} className="mt-3">
                      <p className="mb-0 small text-muted">Goal</p>
                      <p className="mb-0 text-dark">{levelData["Goal_text"]}</p>
                    </Col>
                  </Row>
                </CardBody>
              ) : (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                </div>
              )}
            </Card>
          </Col>
          {
            //normal level contains numbers mini games contains string in lname so,
            Number.isInteger(Number(lName)) ? (
              <Col lg={8} className="order-lg-0">
                <Card className="shadow mb-3">
                  <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                    <h2 className="mb-0">Questions</h2>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={() =>
                        history.push(
                          `/admin/levels/${levelData["Tab Name"]}/add-question`
                        )
                      }
                    >
                      <i className="fas fa-plus" />
                    </Button>
                  </CardHeader>
                </Card>

                {questionsData ? (
                  questionsData.map((_question, _number) => (
                    <Card className="mb-1 shadow">
                      <CardHeader
                        className="d-flex justify-content-between align-items-center"
                        onClick={() => setToggled(_number)}
                      >
                        <div className="d-flex justify-content-start align-items-center">
                          <p className="mb-0 small">
                            Question {_number + 1}{" "}
                            <span className="ml-2">
                              <Badge color="primary">{_question["Type"]}</Badge>
                            </span>
                          </p>
                          <p className="mb-0 small ml-2">
                            <Badge color="warning">
                              {_question["Leadership Ability"]}
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <Button
                            color="danger"
                            size="sm"
                            disabled={loading && loading.startsWith("deleting")}
                            onClick={(e) => deleteQuestion(_number)}
                          >
                            {loading === `deleting${_number}` ? (
                              <Spinner color="white" size="sm" />
                            ) : (
                              <i className="far fa-trash-alt" />
                            )}
                          </Button>
                          <Button
                            color="default"
                            size="sm"
                            onClick={(e) =>
                              history.push(
                                `/admin/levels/${lName}/edit-question/${_number}`
                              )
                            }
                          >
                            <i className="fas fa-pencil-alt" />
                          </Button>
                        </div>
                      </CardHeader>
                      <Collapse isOpen={toggled === _number}>
                        <CardBody className="mt-0">
                          {_question["Type"] !== "Question" && (
                            <Row>
                              <Col md={4} xs={6}>
                                <h6 className="mb-0">Name</h6>
                                <p>{_question["Name"]}</p>
                              </Col>
                              {_question["Type"] === "Email" && (
                                <>
                                  <Col md={4} xs={6}>
                                    <h6 className="mb-0">Subject</h6>
                                    <p>{_question["Subject"]}</p>
                                  </Col>
                                  <Col md={4} xs={6}>
                                    <h6 className="mb-0">Email</h6>
                                    <p>{_question["Email"]}</p>
                                  </Col>
                                </>
                              )}
                            </Row>
                          )}

                          <h6 className="mb-0">Question</h6>
                          <p>{_question["Question"]}</p>

                          <h6 className="mb-0">Answers</h6>
                          <ol>
                            {_question["Answer One"] && (
                              <li>
                                <p className="mb-0">
                                  {_question["Answer One"]}
                                </p>
                                <p className="small">
                                  <Badge color="info" className="mr-2">
                                    {_question["Response One"]}
                                  </Badge>
                                  <Badge color="success" className="mr-2">
                                    {
                                      RESPONSE_ENUM[
                                        _question["Response"].split("|")[0]
                                      ]
                                    }
                                  </Badge>
                                  <Badge color="danger" className="mr-2">
                                    {_question["Reward"].split("|")[0]}
                                  </Badge>
                                </p>
                              </li>
                            )}
                            {_question["Answer Two"] && (
                              <li>
                                <p className="mb-0">
                                  {_question["Answer Two"]}
                                </p>
                                <p className="small">
                                  <Badge color="info" className="mr-2">
                                    {_question["Response Two"]}
                                  </Badge>
                                  <Badge color="success" className="mr-2">
                                    {
                                      RESPONSE_ENUM[
                                        _question["Response"].split("|")[1]
                                      ]
                                    }
                                  </Badge>
                                  <Badge color="danger" className="mr-2">
                                    {_question["Reward"].split("|")[1]}
                                  </Badge>
                                </p>
                              </li>
                            )}
                            {_question["Answer Three"] && (
                              <li>
                                <p className="mb-0">
                                  {_question["Answer Three"]}
                                </p>
                                <p className="small">
                                  <Badge color="info" className="mr-2">
                                    {_question["Response Three"]}
                                  </Badge>
                                  <Badge color="success" className="mr-2">
                                    {
                                      RESPONSE_ENUM[
                                        _question["Response"].split("|")[2]
                                      ]
                                    }
                                  </Badge>
                                  <Badge color="danger" className="mr-2">
                                    {_question["Reward"].split("|")[2]}
                                  </Badge>
                                </p>
                              </li>
                            )}
                            {_question["Answer Four"] && (
                              <li>
                                <p className="mb-0">
                                  {_question["Answer Four"]}
                                </p>
                                <p className="small">
                                  <Badge color="info" className="mr-2">
                                    {_question["Response Four"]}
                                  </Badge>
                                  <Badge color="success" className="mr-2">
                                    {
                                      RESPONSE_ENUM[
                                        _question["Response"].split("|")[3]
                                      ]
                                    }
                                  </Badge>
                                  <Badge color="danger" className="mr-2">
                                    {_question["Reward"].split("|")[0]}
                                  </Badge>
                                </p>
                              </li>
                            )}
                          </ol>
                        </CardBody>
                      </Collapse>
                    </Card>
                    // <div className="mb-4">
                    //     <div className="d-flex justify-content-between align-items-center">
                    //         <p className="mb-0 small">Question {_number+1} <span className="ml-2"><Badge color="primary">{_question['Type']}</Badge></span></p>
                    //         <p className="mb-0 small"><Badge color="warning">{_question['Leadership Ability']}</Badge></p>
                    //     </div>
                    //     <hr className="my-1"/>
                    //     {
                    //         _question['Type'] !== 'Question' &&
                    //         <Row>
                    //             <Col md={4} xs={6}>
                    //                 <h6 className="mb-0">Name</h6>
                    //                 <p className="mb-1">{_question['Name']}</p>
                    //             </Col>
                    //             {
                    //                 _question['Type'] === 'Email' &&
                    //                 <>
                    //                     <Col md={4} xs={6}>
                    //                         <h6 className="mb-0">Subject</h6>
                    //                         <p className="mb-1">{_question['Subject']}</p>
                    //                     </Col>
                    //                     <Col md={4} xs={6}>
                    //                         <h6 className="mb-0">Email</h6>
                    //                         <p className="mb-1">{_question['Email']}</p>
                    //                     </Col>
                    //                 </>
                    //             }
                    //         </Row>
                    //     }
                    //     <h4 className="font-weight-normal">{_question['Question']}</h4>
                    // </div>
                  ))
                ) : (
                  <div className="text-center py-5 mt-5">
                    <Spinner color="primary" />
                  </div>
                )}
              </Col>
            ) : <MiniGameCard/>
          }
        </Row>
      </Container>
    </>
  );
}
