import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Spinner,
} from "reactstrap";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useHistory, useParams } from "react-router-dom";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { getDb } from "../../util/Constants";

import "../../assets/css/editMiniGame.css";

export default function EditQuestion(props) {
  const [imageFile, setImageFile] = useState(null);
  const [backgroundImageURL, setBackgroundImageURL] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [miniGameOption, setMiniGameOption] = useState("Mini 1");
  const [templateType, setTemplateType] = useState(1);
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState([""]);
  const [loading, setLoading] = useState(null);
  const [allowSave, setAllowSave] = useState(true);
  const { lName, questionIndex } = useParams();
  const [error, setError] = useState(null);

  const history = useHistory();

  const db = getDb();
  let imageURL = null;
  useEffect(() => {
    (async () => await fetchMiniGameDetails())();
    return () => {};
  }, []);

  const fetchMiniGameDetails = async () => {
    try {
      const docRef = doc(getDb(), "questions", questionIndex);
      let arr = [];

      const querySnapshot = await getDoc(docRef);

      if (querySnapshot.exists()) {
        const questionList = querySnapshot.data();

        setQuestion(questionList.question);

        if (questionList.correctAnswer)
          setCorrectAnswer(questionList.correctAnswer);

        if (questionList.description) setDescription(questionList.description);

        if (questionList.questionNumber)
          setQuestionNumber(questionList.questionNumber);

        if (questionList.backgroundImageURL) {
          setBackgroundImageURL(questionList.backgroundImageURL);
        }

        setMiniGameOption(questionList.miniGame);
        setTemplateType(questionList.miniGameTemplateType);
        setOptions(questionList.options);
        setTemplateType(questionList.miniGameTemplateType);
      } else {
        throw Error("No such document!");
      }
    } catch (error) {
      
    }
  };

  const handleImageUpload = async () => {
    const file = imageFile;

    const storage = getStorage();

    // Create a reference to a Firebase Storage location
    const storageRef = ref(storage, `images/${file.name}`);

    // Upload the file to the specified Firebase Storage location
    await uploadBytes(storageRef, file).then(async () => {
      // Get the download URL of the uploaded file

      await getDownloadURL(storageRef).then((url) => {
        imageURL = url;
      });
    });
  };

  const updateHandler = async (e) => {
    e.preventDefault();
    setLoading("saving");
    let imageUplaodError = false;
    try {
      if (templateType == 2 && imageFile) await handleImageUpload();
      e.preventDefault();
    } catch (error) {
      imageUplaodError = true;
      setError(`${error}`);
      setTimeout(() => {
        setError(undefined);
    }, 5000);
      setLoading(null);
    }

    if (imageUplaodError) return;

    try {
      const questionDocRef = doc(db, "questions", questionIndex);

      let optionsTemplate1 = [];
      if (templateType == 1) {
        options.map((element, index) => {
          if (index < 4) return optionsTemplate1.push(element);
        });
      }

      const payload = {
        question: question,
        options: templateType == 1 ? optionsTemplate1 : options,
        miniGame: miniGameOption,
        miniGameTemplateType: Number(templateType),
        description: description,
      };

      if (templateType == 2) {
        if (imageURL) payload.backgroundImageURL = imageURL;
      } else payload.correctAnswer = Number(correctAnswer);

      const res = await updateDoc(questionDocRef, payload);
      setLoading(null);

      history.push(`/admin/levels/${lName}`);
    } catch (error) {
      setError(`Failed to update Mini level details: ${error}`);
      setLoading(null);
       setTimeout(() => {
                    setError(undefined);
                }, 5000);
    }
  };
  const addOption = () => {
    setOptions([...options, ""]);
  };

  const deleteOption = (index) => {
    setOptions(options.filter((ans, i) => index !== i));
  };

  const handleChange = (index, event) => {
    const { name, value } = event.target;

    let arr = [...options];
    if (options.length == 1 && options[0] == "") {
      arr = [];
    }
    arr[index] = value;
    setOptions(arr);
  };

  return (
    <>
      <div className="header bg-gradient-info pb-8 pt-5 pt-md-8" />
      <Container className="mt--9" fluid>
        <Row className="mb-4">
          <Col>
            <Card className="shadow">
              <CardHeader className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">Edit Question</h2>
              </CardHeader>
              <CardBody>
              {
                            error &&
                            <Alert color="danger">
                                {error}
                            </Alert> 
                        }
                {loading === "data" ? (
                  <div className="text-center py-5 mt-5">
                    <Spinner color="primary" />
                  </div>
                ) : (
                  <Form onSubmit={updateHandler}>
                    {/* <Row className="mb-2">
                      <Col lg={4}>
                        <Row>
                          <Col sm={12}>
                            <FormGroup>
                              <Label for="type">
                                Select Mini Game Template
                              </Label>
                              <Input
                                type="select"
                                name="type"
                                id="type"
                                value={templateType}
                                className="form-control-alternative"
                                required
                                onChange={(e) => {
                                  // setOptions([""
                                  // ])
                                  setTemplateType(e.target.value);
                                }}
                              >
                                <option value={1}>Mini Game Template 1</option>
                                <option value={2}>Mini Game Template 2</option>
                              </Input>
                            </FormGroup>
                          </Col>
                        </Row>
                      </Col>
                    </Row> */}
                    {/* ------------------------------------------------------------------------------------------------------------------------ */}
                    {templateType == 2 ? 
                    <Row className="flex-column dflex justify-content-end align-items-end" 
                    >
                      <Col className="float-right" sm="3">
                        <label
                          for="imageUpload"
                          class={
                            imageFile ? "btn btn-success" : "btn btn-primary"
                          }
                        >
                          <i className="fa fa-upload mr-2" />
                          {imageFile ? "Image Selected" : "Update Image"}
                        </label>

                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/*"
                          onChange={(e) => {
                            // handleImageUpload(e)

                            const file = e.target.files[0];
                            const allowedTypes = ["image/jpeg", "image/png"];
                            if (file && allowedTypes.includes(file.type)) {
                              // handle image upload
                              setImageFile(e.target.files[0]);

                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onload = () => {
                                setBackgroundImageURL(reader.result);
                              };
                            } else {
                              setError(
                                "Please upload an image file in jpeg/png format only. Other formats are not allowed."
                              );
                              setTimeout(() => {
                                setError(undefined);
                            }, 5000);
                            }
                          }}
                          style={{
                            display: "none",
                          }}
                        />
                      </Col>
                      <Col sm="3">
                        <img
                          src={backgroundImageURL ?? imageFile}
                          width={"auto"}
                          height={50}
                          style={{ objectFit: "contain" }}
                          class="img-fluid"
                          alt="..."
                        />
                      </Col>
                    </Row> : ""
}
                    {/* -------------------------------------------------------------------------------------------------- */}
                    <Row>
                      <Col xs={6}>
                        <div className="">
                          <h3 className="mb-0">Question</h3>
                          <br></br>
                          <FormGroup>
                            <Input
                              type="textarea"
                              id="question"
                              rows={5}
                              required
                              value={question}
                              className="form-control-alternative"
                              onChange={(e) => setQuestion(e.target.value)}
                              maxLength={100}
                              onInput={(object) => {
                                if (
                                  object.target.value.length >
                                  object.target.maxLength
                                )
                                  object.target.value =
                                    object.target.value.slice(
                                      0,
                                      object.target.maxLength
                                    );
                              }}
                            />
                          </FormGroup>
                        </div>
                      </Col>

                      <Col xs={6}>
                        <div className="">
                          <h3 className="mb-0">Description</h3>
                          <br></br>

                          <FormGroup>
                            <Input
                              type="textarea"
                              id="description"
                              value={description}
                              rows={5}
                              required
                              className="form-control-alternative"
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </FormGroup>
                        </div>
                      </Col>

                      {/* ///////////////////////// */}
                      {/* <Col xs={4}>
                      <Row xs={12} className="flex-column dflex justify-content-end align-items-end" 
                    >
                      <Col //className="float-right" sm="3"
                      >
                        <label
                          for="imageUpload"
                          class={
                            imageFile ? "btn btn-success" : "btn btn-primary"
                          }
                        >
                          <i className="fa fa-upload mr-2" />
                          {imageFile ? "Image Selected" : "Update Image"}
                        </label>

                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/*"
                          onChange={(e) => {
                            // handleImageUpload(e)

                            const file = e.target.files[0];
                            const allowedTypes = ["image/jpeg", "image/png"];
                            if (file && allowedTypes.includes(file.type)) {
                              // handle image upload
                              setImageFile(e.target.files[0]);

                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onload = () => {
                                setBackgroundImageURL(reader.result);
                              };
                            } else {
                              alert(
                                "Please upload an image file in jpeg/png format only. Other formats are not allowed."
                              );
                            }
                          }}
                          style={{
                            display: "none",
                          }}
                        />
                      </Col>
                      <Col //sm="3"
                      >
                        <img
                          src={backgroundImageURL ?? imageFile}
                          width={230}
                          height={130}
                          style={{ objectFit: "contain" }}
                          class="img-fluid"
                          alt="..."
                        />
                      </Col>
                    </Row>
                    </Col> */}
                      {/* ////////////// */}
                    </Row>

                    {templateType == 1 ? (
                      <Row>
                        <Col xs={12}>
                          <div className="d-flex justify-content-between">
                            <h3 className="mb-0">Options</h3>
                            {/* {options < 4 && (
                              <Button
                                onClick={addOption}
                                color="success"
                                type="button"
                                size="sm"
                              >
                                <i className="fas fa-plus mr-2" />
                                Option
                              </Button>
                            )} */}
                          </div>
                          <hr className="mt-3" />
                        </Col>
                        {options.map((data, index) => {
                          if (index < 4)
                            return (
                              // <Col lg={12}>

                              <Col lg={6}>
                                <div className="p-3 border rounded mb-4 bg-lighter">
                                  <Row>
                                    <Col lg={12}>
                                      <FormGroup>
                                        <div className="d-flex justify-content-between mb-2">
                                          <Label
                                            for="optionText"
                                            className="col-8"
                                          >
                                            {` Option ${index + 1} `}
                                          </Label>

                                          <input
                                            className="checkmarkMiniGameEdit"
                                            type="radio"
                                            id="html"
                                            name="fav_language"
                                            checked={
                                              correctAnswer == index
                                                ? true
                                                : false
                                            }
                                            value={index}
                                            onChange={(e) => {
                                              setAllowSave(true);
                                              setCorrectAnswer(index);
                                            }}
                                          />
                                          <Label for="optionText">
                                            {`Correct Answer`}
                                          </Label>

                                          {/* {options.length > 1 && (
                                      <Button
                                        color="danger"
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                        if (correctAnswer >= index){
                                          setAllowSave(false);
                                          setCorrectAnswer(-1);
                                        }
                                          deleteOption(index)
                                        }}
                                      >
                                        <i className="far fa-trash-alt" />
                                      </Button>
                                    )} */}
                                        </div>
                                        <Input
                                          rows={10}
                                          type="text"
                                          id="optionText"
                                          value={data}
                                          required
                                          name="option"
                                          className="form-control-alternative"
                                          onChange={(event) =>
                                            handleChange(index, event)
                                          }
                                        />
                                      </FormGroup>
                                    </Col>
                                  </Row>
                                </div>
                              </Col>
                            );
                        })}
                      </Row>
                    ) : (
                      <Row>
                        <Col xs={12}>
                          <div className="d-flex justify-content-between">
                            <h3 className="mb-0">Options</h3>
                            {/* { options.length < 100 && (
                            <Button
                              onClick={addOption}
                              color="success"
                              type="button"
                              size="sm"
                            >
                              <i className="fas fa-plus mr-2" />
                              Option
                            </Button>
                          )} */}
                          </div>
                          <hr className="mt-3" />
                        </Col>
                        {options.map((data, index) => (
                          // <Col lg={12}>
                          <Col lg={6}>
                            <div className="p-3 border rounded mb-4 bg-lighter">
                              <Row>
                                <Col lg={12}>
                                  <FormGroup>
                                    <div className="d-flex justify-content-between mb-2">
                                      <Label for="optionText">
                                        {` Option ${index + 1} `}
                                      </Label>

                                      {/* {options.length > 1 && (
                                      <Button
                                        color="danger"
                                        type="button"
                                        size="sm"
                                        onClick={() => deleteOption(index)}
                                      >
                                        <i className="far fa-trash-alt" />
                                      </Button>
                                    )} */}
                                    </div>
                                    <Input
                                      rows={10}
                                      type="text"
                                      id="optionText"
                                      value={data}
                                      required
                                      name="option"
                                      className="form-control-alternative"
                                      onChange={(event) =>
                                        handleChange(index, event)
                                      }
                                    />
                                  </FormGroup>
                                </Col>
                              </Row>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    )}

                    <Row>
                      <Col className="text-right">
                        <Button
                          color="danger"
                          onClick={() => history.goBack()}
                          disabled={loading === "saving"}
                        >
                          Cancel
                        </Button>

                        {!allowSave ? (
                          <Button
                            color="primary"
                            onClick={() => {
                              setError("correct Answer is required");
                              setTimeout(() => {
                                setError(undefined);
                            }, 5000);
                            }}
                            disabled={loading === "saving"}
                          >
                            {loading === "saving" ? (
                              <Spinner color="light" size="sm" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        ) : (
                          <Button
                            color="primary"
                            type="submit"
                            disabled={loading === "saving"}
                          >
                            {loading === "saving" ? (
                              <Spinner color="light" size="sm" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </Form>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
