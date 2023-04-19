import {
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
import { collection, addDoc } from "firebase/firestore";
import { useHistory, useParams } from "react-router-dom";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { getDb } from "../../util/Constants";
import moment from "moment";

const template2 = [
  { optionsCount: 5, backgroundImageURL: "https://firebasestorage.googleapis.com/v0/b/progress-staging.appspot.com/o/Mini%202%2F01-background.png?alt=media&token=f17087dc-8130-4e2c-aef9-8cfb6395ebc9"},
  {optionsCount: 8, backgroundImageURL: "https://firebasestorage.googleapis.com/v0/b/progress-staging.appspot.com/o/Mini%202%2F02-background.png?alt=media&token=b434278c-56d4-4a5d-ac48-b861e33d28a0"},
  {optionsCount: 5, backgroundImageURL: "https://firebasestorage.googleapis.com/v0/b/progress-staging.appspot.com/o/Mini%202%2F03-background.png?alt=media&token=3f5da72e-3659-4078-a804-664e82afc2fe"},
  {optionsCount: 5, backgroundImageURL: "https://firebasestorage.googleapis.com/v0/b/progress-staging.appspot.com/o/Mini%202%2F04-background.png?alt=media&token=02293f33-a7f1-4b43-8d34-797e9389c2c8"}
];

export default function EditQuestion(props) {
  const [imageFile, setImageFile] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [miniGameOption, setMiniGameOption] = useState("Mini 1");
  const [templateType, setTemplateType] = useState(1);
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([""]);
  const [allowSave, setAllowSave] = useState(true);
  const [loading, setLoading] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);

  const { lName, questionIndex } = useParams();
  const history = useHistory();
  let imageURL = null;

  useEffect(async () => {
    await fetchMiniGameDetails();
    return () => {};
  }, [lName, questionIndex]);

  const fetchMiniGameDetails = async () => {
    try {
      if (lName) {
        setMiniGameOption(lName);
        if(lName==="Mini 2")
        setTemplateType(2)
        else if (lName ==="Mini 1")
          setTemplateType(1)
      };
      if(questionIndex) setQuestionNumber(questionIndex);
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

  const onFormSubmtHandler = async (e) => {
    e.preventDefault();

   
    try {
      
      setLoading("saving");
      if(templateType == 2 && !imageFile){
        throw Error('Please Select an Image to upload.');
      }
      if (templateType == 2) 
      await handleImageUpload();

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
        createdAt: moment().unix() * 1000,
        questionNumber: Number(questionNumber),
      }

      if(templateType == 2){
        payload.backgroundImageURL = imageURL;
      }

      else
       payload.correctAnswer = Number(correctAnswer);

      const docRef = await addDoc(collection(getDb(), "questions"), payload);

      setLoading(null);
      history.push(`/admin/levels/${lName}`);
    } catch (error) {
      setLoading(null);
      alert(error);
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
    if (options.length == 1 && options[0] == "") arr = [];
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
                <h2 className="mb-0">Add Mini Game {templateType} Question</h2>
              </CardHeader>
              <CardBody>
                {loading === "data" ? (
                  <div className="text-center py-5 mt-5">
                    <Spinner color="primary" />
                  </div>
                ) : (
                  <Form onSubmit={(e) => onFormSubmtHandler(e)}>
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

                    <Row>
                      <Col xs={6}>
                        <div className="">
                          <h3 className="mb-0">Question</h3>

                          <FormGroup>
                            <Input
                              type="textarea"
                              id="question"
                              rows={5}
                              required
                              className="form-control-alternative"
                              onChange={(e) => setQuestion(e.target.value)}
                            />
                          </FormGroup>
                        </div>
                      </Col>
                  
                        <Col xs={6}>
                          <div className="">
                            <h3 className="mb-0">Description</h3>

                            <FormGroup>
                              <Input
                                type="textarea"
                                id="description"
                                rows={5}
                                value={description}
                                required
                                className="form-control-alternative"
                                onChange={(e) => setDescription(e.target.value)}
                              />
                            </FormGroup>
                          </div>
                        </Col>
                    </Row>

                    {templateType == 1 ? (
                      <Row>
                        <Col xs={12}>
                          <div className="d-flex justify-content-between">
                            <h3 className="mb-0">Options</h3>
                            {/* {options.length < 4 && (
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
                        {Array.apply(null, Array(4)).map((data, index) => {
                          if (index < 4)
                            return (
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
                                                if (correctAnswer >= index) {
                                                  setAllowSave(false);
                                                  setCorrectAnswer(-1);
                                                }

                                                deleteOption(index);
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
                            {/* {options.length < 100 && (
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
                            <label for="imageUpload" class={imageFile ? "btn btn-success":"btn btn-primary"} >
                              <i className="fa fa-upload mr-2" />
                              {imageFile ? "Image Selected" : "Upload Image"} 
                            </label>
                           
                            <input
                              type="file"
                              id="imageUpload"
                              accept=".jpg,.jpeg,.png"
                              onChange={(e)=>{ 
                                const file = e.target.files[0];
                                const allowedTypes = ['image/jpeg', 'image/png'];
                                if (file && allowedTypes.includes(file.type)) {
                                  // handle image upload
                                  setImageFile(e.target.files[0])
                                } else {
                                  alert('Please upload an image file in jpeg/png format only. Other formats are not allowed.');
                                }
                              }}
                              style={{ 
                                 display: "none"
                             }}
                            />
                          </div>
                          <hr className="mt-3" />
                        </Col>
                        {
                           Array.apply(null, Array(template2[questionNumber].optionsCount)).map((data, index) =>(
                        // options.map((data, index) => (
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
                              alert("correct Answer is required");
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
