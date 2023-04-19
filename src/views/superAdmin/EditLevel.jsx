import {
    Alert,
    Badge,
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
import {useHistory, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {getLevel} from "../../util/SheetManager";
import {firebaseConstants, getDb, levelNames} from "../../util/Constants";
import {collection, doc, getDoc} from "firebase/firestore";

export default function EditLevel(props) {
    const [data, setData] = useState(null);
    const [previousLevelName, setPreviousLevelName] = useState("0");
    const [levelName, setLevelName] = useState("0");
    const [passingScore, setPassingScore] = useState(100);
    const [time, setTime] = useState(100);
    const [isFinal, setIsFinal] = useState(false);
    const [difficulty, setDifficulty] = useState("easy");
    const [tQuestions, setTQuestions] = useState([1, 1, 1]);
    const [minAttempts, setMinAttempts] = useState([1, 1, 1]);
    const [level, setLevel] = useState(1);
    const [goalText, setGoalText] = useState("");
    const [levelDifficultyScores, setLevelDifficultyScores] = useState({});
    const [loading, setLoading] = useState('data');

    const history = useHistory();
    const {lName} = useParams();

    const db = getDb();
    const utilRef = collection(db, firebaseConstants.dbUtil);

    useEffect(async () => {
        if (props.sheetsLoaded) {
            if (levelNames.includes(lName)) {
                try {
                    getMetaData().then(data => {
                        setLevelDifficultyScores(data.levelDifficultyScores || {easy: 250, medium: 375, hard: 500});
                    });

                    // const _data = await getLevels();
                    const _level = await getLevel(lName);

                    const isLevel = Number.isInteger(Number(_level['Tab Name']));

                    setLevelName(lName);
                    setPreviousLevelName(lName);
                    setIsFinal(_level['Final'] === 'y');
                    setPassingScore(_level['Passing Score']);
                    setTime(_level['Time(sec)']);
                    setDifficulty(_level['Difficulty Level'] ?? "easy");
                    setTQuestions(isLevel ? _level['Total Questions'].split("|") : [0, 0, 0]);
                    setMinAttempts(isLevel ? _level['Min Attempt'].split("|") : [0, 0, 0]);
                    setLevel(isLevel ? 1 : _level['Total Questions'].split("=")[1]);
                    setGoalText(_level['Goal_text']);

                    setData(_level);
                    setLoading(null);
                } catch (e) {
                    setData(null);
                    setLoading(null);
                }
            } else {
                history.push('/admin/levels');
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

        const _data = data;

        _data['Tab Name'] = levelName;
        _data['Passing Score'] = passingScore;
        _data['Time(sec)'] = time;
        _data['Total Questions'] = Number.isInteger(Number(levelName)) ? tQuestions.join("|") : `L=${level}`;
        _data['Min Attempt'] = Number.isInteger(Number(levelName)) ? minAttempts.join("|") : '';
        _data['Goal_text'] = goalText;
        _data['Difficulty Level'] = difficulty;

        await _data.save();

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
                                <h2 className="mb-0">Edit Level</h2>
                                {isFinal && <h2 className="mb-0"><Badge color="primary">Final Level</Badge></h2>}
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
                                                                    levelNames
                                                                        .filter(_levelName => Number.isInteger(Number(previousLevelName)) ? Number.isInteger(Number(_levelName)) : !Number.isInteger(Number(_levelName)))
                                                                        .map(_levelName =>
                                                                            <option>{_levelName}</option>)
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
                                                        <Button
                                                            color="danger"
                                                            onClick={() => history.goBack()}
                                                        >
                                                            Cancel
                                                        </Button>
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