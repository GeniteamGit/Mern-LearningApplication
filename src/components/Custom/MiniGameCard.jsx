import React, { useState, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  doc,
  getDocs,
  collection,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Collapse,
  Spinner,
} from "reactstrap";

import { getDb } from "../../util/Constants";

export const RESPONSE_ENUM = {
  1: "BEST",
  2: "OK",
  3: "WRONG",
};

export const MiniGameCard = (props) => {
  const [miniGameData, setMiniGameData] = useState([]);
  const [loading, setLoading] = useState(null);
  const [toggled, setToggled] = useState(0);
  const history = useHistory();
  const { lName } = useParams();
const [options  , setOptions  ] = useState([]);
  useEffect(() => {
    fetchMiniGameData();
    return () => {};
  }, []);

  const fetchMiniGameData = async () => {
    try {
      const questionQuery = query(
        collection(getDb(), "questions"),
        where("miniGame", "==", lName),
        orderBy("createdAt")
      );

      let arr = [];
      const querySnapshot = await getDocs(questionQuery);

      querySnapshot.forEach((doc) => {
        arr.push({
          id: doc.id,
          question: doc.data().question,
          options: doc.data().options,
          templateType: doc.data().miniGameTemplateType,
          correctAnswer: doc.data().correctAnswer,
          description: doc.data().description,
        });
      });
      setMiniGameData(arr);
    } catch (error) {
      
    }
  };

  const deleteQuestion = async (uid) => {
    try {
      setLoading(`deleting${uid}`);

      await deleteDoc(doc(getDb(), "questions", uid)).then((res) => {
        
        fetchMiniGameData();
      });
    } catch (error) {
      alert("delete failed error " + error);
    }

    setLoading(null);
  };

  return (
    <Col lg={8} className="order-lg-0">
      <Card className="shadow mb-3">
        <CardHeader className="border-0 d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Questions</h2>
          
{ (lName === "Mini 2" && miniGameData.length < 4) &&
          <Button
            color="primary"
            size="sm"
            onClick={() =>{
             
              history.push(`/admin/levels/mini-game-add-question/${lName}/${miniGameData.length}`)
            }}
          >
            <i className="fas fa-plus" />
          </Button>
       }
       {
        lName === "Mini 1" &&
                  <Button
            color="primary"
            size="sm"
            onClick={() =>{
              
              history.push(`/admin/levels/mini-game-add-question/${lName}/${miniGameData.length}`)
            }}
          >
            <i className="fas fa-plus" />
          </Button>
       }
              </CardHeader>
      </Card>

      {miniGameData ? (
        miniGameData.map((element, _number) => (
          <Card className="mb-1 shadow">
            <CardHeader
              className="d-flex justify-content-between align-items-center"
              onClick={() => setToggled(_number)}
            >
              <div className="d-flex justify-content-start align-items-center">
                <p className="mb-0 small">
                  Question {_number + 1}{" "}
                  <span className="ml-2">
                    <Badge color="primary">
                      Mini Game Template {element.templateType}
                    </Badge>
                  </span>
                </p>
                <p className="mb-0 small ml-2"></p>
              </div>
              <div>
              {
        lName === "Mini 1" &&
                <Button
                  color="danger"
                  size="sm"
                  disabled={loading && loading.startsWith("deleting")}
                  onClick={(e) => deleteQuestion(element.id)}
                >
                  {loading === `deleting${_number}` ? (
                    <Spinner color="white" size="sm" />
                  ) : (
                    <i className="far fa-trash-alt" />
                  )}
                </Button>
}

                <Button
                  color="default"
                  size="sm"
                  onClick={(e) =>
                    history.push(
                      `/admin/levels/mini-game-edit-question/${lName}/${element.id}`
                    )
                  }
                >
                  <i className="fas fa-pencil-alt" />
                </Button>
              </div>
            </CardHeader>
            <Collapse isOpen={toggled === _number}>
              <CardBody className="mt-0">
                <h6 className="mb-0">Question</h6>
                <p>{element.question}</p>

                <h6 className="mb-0">Answers</h6>
                <ol>
                  {element.options &&
                    element.options.map((answer, i) => {
                      return (
                        <li key={i}>
                          <p className="mb-0">{<div>{answer}</div>}</p>
                          <p className="small">
                            <Badge color="success" className="mr-2">
                              {element.correctAnswer === i && "Correct Answer"}
                            </Badge>
                          </p>
                        </li>
                      );
                    })}
                </ol>
                {element.description && (
                  <div>
                    <h6>Description</h6>
                    <p>{element.description}</p>
                  </div>
                )}
              </CardBody>
            </Collapse>
          </Card>
        ))
      ) : (
        <div className="text-center py-5 mt-5">
          <Spinner color="primary" />
        </div>
      )}
    </Col>
  );
};
