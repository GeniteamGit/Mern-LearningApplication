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
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseConstants, getDb } from "../../../util/Constants";
import { useHistory, useParams } from "react-router-dom";
import _ from "lodash";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

export default function EditUser() {
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [userData, setUserData] = useState({});
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState("data");
  const [startDate, setStartDate] = useState(new Date());
  const [isChecked, setIsChecked] = useState(false);

  const history = useHistory();
  let { userId } = useParams();
  userId = decodeURIComponent(userId);

  const db = getDb();
  const utilRef = collection(db, firebaseConstants.dbUtil);
  const usersRef = collection(db, firebaseConstants.dbUsers);

  useEffect(() => {
    getMetaData().then(async (_data) => {
      setMetadata(_data);
    });

    getUser().then((_user) => {
      _user.password = null;
      setUserData(_user);
      if (_user.canExpire) setIsChecked(_user.canExpire);
      setLoading(null);
    });
  }, []);

  const getUser = async () => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: doc.id, ...docSnap.data() };
    } else {
      // doc.data() will be undefined in this case
      history.goBack();
    }
  };

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
      if (isChecked) {
        if (moment()._d < userData.expiryDate) {
          expiryDate = moment(userData.expiryDate).valueOf();
        } else {
          alert("timestamp not set or is before tomorrow");
          throw "timestamp not set or is before tomorrow";
        }
      } else {
        expiryDate = null;
      }

      let isMatched = false;
      let passwordHash = null;

      
      if (confirmPassword && userData.password) {
        if (confirmPassword.length > 0 && userData.password.length > 0) {
          if (confirmPassword.localeCompare(userData.password) === 0) {
            isMatched = true;
            
            let hash = await bcrypt.hashSync(userData.password, salt);
            
            
            
            if (!hash) {
              alert("Password hashing failed");
              throw "Password hashing failed";
            } else {
              passwordHash = hash;

              await setDoc(
                doc(db, "users", userId),
                {
                  department: userData.department,
                  email: userData.email,
                  email_insensitive: userData.email.toLowerCase(),
                  isActive: true,
                  name: userData.name,
                  name_insensitive: userData.name.toLowerCase(),
                  region: userData.region,
                  password: passwordHash,
                  expiryDate: expiryDate,
                  canExpire: isChecked,
                },
                { merge: true }
              );
            }
          } else {
            alert("Password not match");
            throw "Password not match";
          }
        } else {
          alert(
            "Password is undefiend " +
              confirmPassword +
              " " +
              typeof confirmPassword.length +
              " " +
              typeof userData.password.length +
              " " +
              userData.password
          );
          throw "Password not undefiend";
        }
      } else {
        await setDoc(
          doc(db, "users", userId),
          {
            department: userData.department,
            email: userData.email,
            email_insensitive: userData.email.toLowerCase(),
            isActive: true,
            name: userData.name,
            name_insensitive: userData.name.toLowerCase(),
            region: userData.region,
            //password: passwordHash,
            expiryDate: expiryDate,
            canExpire: isChecked,
          },
          { merge: true }
        );
        //alert("Password is undefiend " + confirmPassword + " "+ typeof(confirmPassword.length) + " "+ typeof(userData.password.length) + " " +  userData.password);
        //throw "Password not undefiend";
      }

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
                <h2 className="mb-0">Edit User</h2>
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
                                readOnly
                              />
                            </FormGroup>
                          </Col>
                          <Col lg={6}>
                            <FormGroup>
                              <Label for="name">New Password (Optional)</Label>
                              <Input
                                type="password"
                                name="passowrd"
                                id="password"
                                value={userData.password}
                                className="form-control-alternative"
                                //required
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
                                //required
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
                                defaultChecked={
                                  userData.canExpire ? true : false
                                }
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
                              {/* <input type="checkbox" name="canexpire" value=""  ></input> */}
                              <Label check checked>
                                {" "}
                                Can expire?
                              </Label>
                            </FormGroup>
                          </Col>
                          <Col lg={6}>
                            <FormGroup>
                              <DatePicker
                                disabled={!isChecked}
                                selected={startDate}
                                onChange={(date) => {
                                  setStartDate(date);
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
