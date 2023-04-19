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
    Spinner
} from "reactstrap";
import {arrayUnion, collection, doc, getDoc, updateDoc} from "firebase/firestore";
import {useEffect, useState} from "react";
import {Link, useHistory} from "react-router-dom";
import {createLevel, getLevels} from "../../util/SheetManager";
import _ from "lodash";
import {firebaseConstants, getDb, levelNames} from "../../util/Constants";

export default function AddLevel(props) {
    const [data, setData] = useState(null);
    const [levelName, setLevelName] = useState("0");
    const [passingScore, setPassingScore] = useState(100);
    const [time, setTime] = useState("60");
    const [isFinal, setIsFinal] = useState(false);
    const [difficulty, setDifficulty] = useState("easy");
    const [tQuestions, setTQuestions] = useState([1, 1, 1]);
    const [minAttempts, setMinAttempts] = useState([1, 1, 1]);
    const [level, setLevel] = useState(1);
    const [goalText, setGoalText] = useState("");
    const [levelDifficultyScores, setLevelDifficultyScores] = useState({});
    const [loading, setLoading] = useState('data');

    const history = useHistory();
    const db = getDb();
    const utilRef = collection(db, firebaseConstants.dbUtil);

    useEffect(async () => {
        if (props.sheetsLoaded) {
            try {
                getMetaData().then(data => {
                    setLevelDifficultyScores(data.levelDifficultyScores || {easy: 250, medium: 375, hard: 500});
                });

                const _data = await getLevels();

                const _difference = _.difference(levelNames, _data.map(d => d['Tab Name']));

                if (_difference.length > 0) {
                    setLevelName(_difference[0]);
                } else {
                    history.push('/admin/levels');
                }

                setData(_data);
                setLoading(null);
            } catch (e) {
                setData(null);
                setLoading(null);
            }
        }
    }, [props.sheetsLoaded]);

    useEffect(() => {
        const attempts = minAttempts.reduce((a, b) => Number(a) + Number(b), 0);
        setPassingScore(attempts * levelDifficultyScores[difficulty]);
    }, [minAttempts, difficulty, levelDifficultyScores]);

    const getMetaData = async () => {
        let data = {};
        const docRef = doc(utilRef, 'meta');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            data = docSnap.data();
        }

        return data;
    }

    const handleSubmit = async e => {
        setLoading('saving');
        e.preventDefault();

        if (isFinal) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].Final === 'y') {
                    data[i].Final = 'n';
                    await data[i].save();
                    break;
                }
            }
        }

        const _data = {
            'Tab Name': levelName,
            'Final': isFinal ? 'y' : 'n',
            'Passing Score': passingScore,
            'Time(sec)': time,
            'Total Questions': Number.isInteger(Number(levelName)) ? tQuestions.join("|") : `L=${level}`,
            'Min Attempt': Number.isInteger(Number(levelName)) ? minAttempts.join("|") : '',
            'hasdifficulty': 'FALSE',
            'Goal_text': goalText,
            'Difficulty Level': difficulty
        };

        await createLevel(_data);

        if (Number.isInteger(Number(levelName))) {
            await updateDoc(utilRef, {
                levels: arrayUnion(levelName)
            });
        }

        history.push('/admin/levels');
    }

    return (
        <>
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8"/>
            <Container className="mt--9" fluid>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">Add Level</h2>
                            </CardHeader>
                            <CardBody>
                                {
                                    loading === 'data' ?
                                        <div className="text-center py-5">
                                            <Spinner color="primary"/>
                                        </div> :
                                        data ?
                                            <Form onSubmit={handleSubmit}>
                                                <Row>
                                                    <Col lg={3}>
                                                        <FormGroup>
                                                            <Label for="tabName">Level Name</Label>
                                                            <Input type="select" name="Tab Name" id="tabName"
                                                                   value={levelName}
                                                                   className="form-control-alternative" required
                                                                   onChange={e => {
                                                                       setLevelName(e.target.value);
                                                                   }}
                                                            >
                                                                {
                                                                    levelNames.map(i => (
                                                                        !(data.map(d => d['Tab Name']).includes(i)) &&
                                                                        <option>{i}</option>
                                                                    ))
                                                                }
                                                            </Input>
                                                        </FormGroup>
                                                    </Col>
                                                    <Col lg={3}>
                                                        <FormGroup>
                                                            <Label for="passingScore">Passing Score</Label>
                                                            <Input type="number" id="passingScore"
                                                                   value={passingScore || ""}
                                                                   required
                                                                   maxLength={3}
                                                                   onInput={object => {
                                                                       if (object.target.value.length > object.target.maxLength)
                                                                           object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                   }}
                                                                   placeholder="0" className="form-control-alternative"
                                                                   onChange={e => setPassingScore(e.target.value)}/>
                                                        </FormGroup>
                                                    </Col>
                                                    <Col lg={3}>
                                                        <FormGroup>
                                                            <Label for="time">Time</Label>
                                                            <Input
                                                                type="select"
                                                                required
                                                                id="time"
                                                                value={time}
                                                                className="form-control-alternative"
                                                                onChange={(e) =>
                                                                    setTime(e.target.value)
                                                                }
                                                            >
                                                                <option value="60">60 seconds</option>
                                                                <option value="90">90 seconds</option>
                                                                <option value="120">120 seconds</option>
                                                                <option value="180">180 seconds</option>
                                                            </Input>
                                                        </FormGroup>
                                                    </Col>
                                                    <Col lg={3}>
                                                        <FormGroup>
                                                            <Label for="difficulty">Difficulty Level</Label>
                                                            <Input
                                                                type="select"
                                                                required
                                                                id="difficulty"
                                                                value={difficulty}
                                                                className="form-control-alternative"
                                                                onChange={(e) =>
                                                                    setDifficulty(e.target.value)
                                                                }
                                                            >
                                                                <option value="easy">Easy</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="hard">Hard</option>
                                                            </Input>
                                                        </FormGroup>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <FormGroup>
                                                            <Label for="goalText">Level Objective</Label>
                                                            <Input type="textarea" name="Goal_text" id="goalText"
                                                                   rows={10}
                                                                   value={goalText}
                                                                   onChange={e => setGoalText(e.target.value)}
                                                                   className="form-control-alternative"/>
                                                        </FormGroup>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <FormGroup className="mt-4">
                                                            <div className="d-flex justify-content-start">
                                                                <label className="switch mr-2">
                                                                    <Input type="checkbox" name="Final" id="isFinal"
                                                                           checked={isFinal}
                                                                           onChange={e => setIsFinal(e.target.checked)}/>
                                                                    <span className="switch-slider round"/>
                                                                </label>
                                                                <Label for="isFinal">is Final</Label>
                                                            </div>
                                                        </FormGroup>
                                                        {
                                                            Number.isInteger(Number(levelName)) ?
                                                                <>
                                                                    <FormGroup>
                                                                        <Label>Total Questions</Label>
                                                                        <Row>
                                                                            <Col lg={4}>
                                                                                <p className="mb-0 small">Questions</p>
                                                                                <Input type="number" name="questions"
                                                                                       value={tQuestions[0]} required
                                                                                       maxLength={2}
                                                                                       onInput={object => {
                                                                                           if (object.target.value.length > object.target.maxLength)
                                                                                               object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                                       }}
                                                                                       className="form-control-alternative"
                                                                                       onChange={e => setTQuestions([e.target.value, tQuestions[1], tQuestions[2]])}/>
                                                                            </Col>
                                                                            <Col lg={4}>
                                                                                <p className="mb-0 small">Emails</p>
                                                                                <Input type="number" name="emails"
                                                                                       value={tQuestions[1]} required
                                                                                       maxLength={2}
                                                                                       onInput={object => {
                                                                                           if (object.target.value.length > object.target.maxLength)
                                                                                               object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                                       }}
                                                                                       className="form-control-alternative"
                                                                                       onChange={e => setTQuestions([tQuestions[0], e.target.value, tQuestions[2]])}/>
                                                                            </Col>
                                                                            <Col lg={4}>
                                                                                <p className="mb-0 small">SMS</p>
                                                                                <Input type="number" name="sms"
                                                                                       value={tQuestions[2]} required
                                                                                       maxLength={2}
                                                                                       onInput={object => {
                                                                                           if (object.target.value.length > object.target.maxLength)
                                                                                               object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                                       }}
                                                                                       className="form-control-alternative"
                                                                                       onChange={e => setTQuestions([tQuestions[0], tQuestions[1], e.target.value])}/>
                                                                            </Col>
                                                                        </Row>
                                                                    </FormGroup>
                                                                    <FormGroup>
                                                                        <Label>Minimum Attempts</Label>
                                                                        <Row>
                                                                            <Col lg={4}>
                                                                                <p className="mb-0 small">Questions</p>
                                                                                <Input type="number" name="questions"
                                                                                       value={minAttempts[0]} required
                                                                                       maxLength={2}
                                                                                       onInput={object => {
                                                                                           if (object.target.value.length > object.target.maxLength)
                                                                                               object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                                       }}
                                                                                       className="form-control-alternative"
                                                                                       onChange={e => setMinAttempts([e.target.value, minAttempts[1], minAttempts[2]])}/>
                                                                            </Col>
                                                                            <Col lg={4}>
                                                                                <p className="mb-0 small">Emails</p>
                                                                                <Input type="number" name="emails"
                                                                                       value={minAttempts[1]} required
                                                                                       maxLength={2}
                                                                                       onInput={object => {
                                                                                           if (object.target.value.length > object.target.maxLength)
                                                                                               object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                                       }}
                                                                                       className="form-control-alternative"
                                                                                       onChange={e => setMinAttempts([minAttempts[0], [e.target.value], minAttempts[2]])}/>
                                                                            </Col>
                                                                            <Col lg={4}>
                                                                                <p className="mb-0 small">SMS</p>
                                                                                <Input type="number" name="sms"
                                                                                       value={minAttempts[2]} required
                                                                                       maxLength={2}
                                                                                       onInput={object => {
                                                                                           if (object.target.value.length > object.target.maxLength)
                                                                                               object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                                       }}
                                                                                       className="form-control-alternative"
                                                                                       onChange={e => setMinAttempts([minAttempts[0], minAttempts[1], [e.target.value]])}/>
                                                                            </Col>
                                                                        </Row>
                                                                    </FormGroup>
                                                                </> :
                                                                <>
                                                                    <FormGroup>
                                                                        <Label for="level">Level</Label>
                                                                        <Input type="number" id="level" value={level}
                                                                               maxLength={2}
                                                                               onInput={object => {
                                                                                   if (object.target.value.length > object.target.maxLength)
                                                                                       object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                               }}
                                                                               onChange={e => setLevel(e.target.value)}
                                                                               className="form-control-alternative"
                                                                               required/>
                                                                    </FormGroup>
                                                                </>
                                                        }
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col className="text-right">
                                                        <Link className="btn btn-danger" to="/admin/levels">
                                                            Cancel
                                                        </Link>
                                                        <Button
                                                            color="primary"
                                                            type="submit"
                                                            disabled={loading === 'saving'}
                                                        >
                                                            {
                                                                loading === 'saving' ?
                                                                    <Spinner color="light" size="sm"/> :
                                                                    'Save'
                                                            }
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </Form> :
                                            <div className="text-center">
                                                <Alert color="danger">
                                                    Something went wrong while loading data, try refreshing the page.
                                                </Alert>
                                            </div>
                                }
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}