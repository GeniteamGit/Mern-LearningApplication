import { useEffect, useState } from "react";
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
import {
  collection,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firebaseConstants, getDb } from "../../../util/Constants";
import { useHistory } from "react-router-dom";
import _, { isMatch } from "lodash";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

export default function AddUser() {
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [userData, setUserData] = useState({});
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState("data");
  const [startDate, setStartDate] = useState(new Date());
  const [isChecked, setIsChecked] = useState(false);

  const history = useHistory();

  const db = getDb();
  const utilRef = collection(db, firebaseConstants.dbUtil);
  const usersRef = collection(db, firebaseConstants.dbUsers);

  useEffect(() => {
    getMetaData().then((_data) => {
      setMetadata(_data);

      setUserData({
        ...userData,
        department: _data.departments ? _data.departments[0] : "",
        region: _data.regions ? _data.regions[0] : "",
        capabilities: Object.fromEntries(
          _data.capabilities.map((key) => [key, 0])
        ),
      });

      setLoading(null);
    });
  }, []);

  const getMetaData = async () => {
    let data = {};
    const docRef = doc(utilRef, "meta");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      data = docSnap.data();
    }

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading("saving");
    
    

    try {

        let expiryDate = null;
        if(isChecked){
         
         if(moment()._d < userData.expiryDate){
             expiryDate = moment(userData.expiryDate).valueOf();
         }else {
             alert("timestamp not set or is before tomorrow");
             throw "timestamp not set or is before tomorrow";
         }
        
        }
        else {
         expiryDate = null;
        }

      let isMatched = false;
      let passwordHash = null;

      
      if (confirmPassword.length > 0 && userData.password > 0) {
        if (confirmPassword.localeCompare(userData.password) === 0) {
          isMatched = true;
         
          var hash = bcrypt.hashSync(userData.password, salt);
          if(!hash){
            alert("Password hashing failed");
            throw "Password hashing failed";
        }else {
            passwordHash = hash;
        }

        } else {
          alert("Password not match");
          throw "Password not match";
        }
      }

      await setDoc(doc(db, "users", userData.email), {
        achievementCount: 0,
        achievements: {
          highAchiever: 0,
          mostlyRight: 0,
          speedDemon: 0,
          streakOf10: 0,
        },
        attempts: 1,
        avatar: -1,
        capabilities: {}, // populate
        completed: false,
        completedOnce: false,
        currentLevel: 1,
        currentScore: 0,
        department: userData.department,
        email: userData.email,
        email_insensitive: userData.email.toLowerCase(),
        isActive: true,
        canExpire: isChecked,
        lastCompletedScore: 0,
        lastUpdated: Date.now(),
        levelScores: {},
        levels: {},
        name: userData.name,
        name_insensitive: userData.name.toLowerCase(),
        region: userData.region,
        userCreated: Date.now(),
        expiryDate: expiryDate,
        password: passwordHash,
      });

      await updateDoc(doc(db, "users", "analytics"), {
        population: increment(1),
      });

      history.push("/admin/users");
    } catch (e) {
      
      setLoading(null);
    }

  };

  return (
    <>
      <div className="header bg-gradient-info pb-8 pt-5 pt-md-8" />
      <Container className="mt--9" fluid>
        <Row className="mb-4">
          <Col>
            <Card className="shadow">
              <CardHeader className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">Add User</h2>
              </CardHeader>
              <CardBody>
                {loading !== "data" ? (
                  <Form onSubmit={handleSubmit}>
                    <Row className="mb-2 justify-content-center">
                      <Col lg={8}>
                        <Row>
                          <Col lg={6}>
                            <FormGroup>
                              <Label for="name">Name</Label>
                              <Input
                                type="text"
                                name="name"
                                id="name"
                                value={userData.name}
                                className="form-control-alternative"
                                required
                                onChange={(e) => {
                                  setUserData({
                                    ...userData,
                                    name: e.target.value,
                                    name_insensitive:
                                      e.target.value.toLowerCase(),
                                  });
                                }}
                                maxLength="25"
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
                          </Col>
                          <Col lg={6}>
                            <FormGroup>
                              <Label for="email">Email</Label>
                              <Input
                                type="email"
                                name="email"
                                id="email"
                                value={userData.email}
                                className="form-control-alternative"
                                required
                                onChange={(e) => {
                                  setUserData({
                                    ...userData,
                                    email: e.target.value,
                                    email_insensitive:
                                      e.target.value.toLowerCase(),
                                  });
                                }}
                                maxLength="40"
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
                          </Col>
                          <Col lg={6}>
                            <FormGroup>
                              <Label for="name">Password</Label>
                              <Input
                                type="password"
                                name="passowrd"
                                id="password"
                                value={userData.password}
                                className="form-control-alternative"
                                required
                                onChange={(e) => {
                                  setUserData({
                                    ...userData,
                                    password: e.target.value,
                                    // name_insensitive: e.target.value.toLowerCase()
                                  });
                                }}
                                maxLength="25"
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
                          </Col>
                          <Col lg={6}>
                            <FormGroup>
                              <Label for="name">Confirm Password</Label>
                              <Input
                                type="password"
                                name="passowrd"
                                id="password"
                                //value={userData.password}
                                className="form-control-alternative"
                                required
                                onChange={(e) => {
                                  setConfirmPassword(e.target.value);
                                }}
                                maxLength="25"
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
                          </Col>
                          <Col lg={6}>
                            <FormGroup>
                              <Label for="type">Department</Label>
                              <Input
                                type="select"
                                name="department"
                                id="department"
                                value={userData.department}
                                className="form-control-alternative"
                                required
                                onChange={(e) => {
                                  setUserData({
                                    ...userData,
                                    department: e.target.value,
                                  });
                                }}
                              >
                                {metadata.departments &&
                                  metadata.departments.map((_department) => (
                                    <option
                                      value={_department}
                                      key={_department}
                                    >
                                      {_.startCase(_department)}
                                    </option>
                                  ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col lg={6}>
                            <FormGroup>
                              <Label for="type">Region</Label>
                              <Input
                                type="select"
                                name="region"
                                id="region"
                                value={userData.region}
                                className="form-control-alternative"
                                required
                                onChange={(e) => {
                                  setUserData({
                                    ...userData,
                                    region: e.target.value,
                                  });
                                }}
                              >
                                {metadata.regions &&
                                  metadata.regions.map((_region) => (
                                    <option value={_region} key={_region}>
                                      {_.startCase(_region)}
                                    </option>
                                  ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col lg={6}>
                            <FormGroup>
                              <Input
                                onChange={(e) => {
                                  setIsChecked(e.target.checked);
                                  if (!e.target.checked) {
                                    setUserData({
                                      ...userData,
                                      expiryDate: null,
                                    });
                                  }
                                }}
                                type="checkbox"
                              />
                              <Label check>Can expire?</Label>
                            </FormGroup>
                          </Col>
                          <Col lg={6}>
                            <FormGroup>
                              <DatePicker
                                disabled={!isChecked}
                                selected={startDate}
                                onChange={(date) => {
                                  setStartDate(date)
                                  setUserData({
                                    ...userData,
                                    expiryDate: date,
                                  });
                                }}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col className="text-right">
                            <Button
                              color="danger"
                              onClick={() => history.goBack()}
                              disabled={loading === "saving"}
                            >
                              Cancel
                            </Button>
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
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Form>
                ) : (
                  <div className="text-center py-5 mt-5">
                    <Spinner color="primary" />
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
