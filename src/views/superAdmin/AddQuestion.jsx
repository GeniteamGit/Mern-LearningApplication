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
import {useEffect, useState} from "react";
import {useHistory, useParams} from "react-router-dom";
import {createQuestion, getLevel, getMiscellaneousData} from "../../util/SheetManager";
import {collection, doc, getDoc} from "firebase/firestore";
import {firebaseConstants, getDb} from "../../util/Constants";

export default function AddQuestion(props) {
    const [levelData, setLevelData] = useState(null);
    const [type, setType] = useState("Question");
    const [leadershipAbility, setLeadershipAbility] = useState("");
    const [abilities, setAbilities] = useState([]);
    const [optionRewards, setOptionRewards] = useState({});
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [email, setEmail] = useState("");
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState([{
        option: '',
        animation: "sad",
        reward: "500",
        response: "1"
    }]);
    const [difficulty, setDifficulty] = useState("Easy");
    const [loading, setLoading] = useState("data");

    const {lName} = useParams();
    const history = useHistory();

    const db = getDb();
    const utilRef = collection(db, firebaseConstants.dbUtil);

    useEffect(async () => {
        if (props.signedInUser) {
            if (props.sheetsLoaded) {
                try {
                    getMetaData().then(data => {
                        setOptionRewards(data.optionRewards || {best: 500, ok: 250, wrong: 0});
                    });
                    getMiscellaneousData().then(_miscData => {
                        const _d = _miscData.filter(_data => _data['Leadership Abilities']).map(_data => _data['Leadership Abilities']);
                        setLeadershipAbility(_d[0]);
                        setAbilities(_d);
                    });
                    getLevel(lName).then(_level => {
                        if (_level) {
                            setLevelData(_level);
                            setLoading(null);
                        } else {
                            history.goBack();
                        }
                    });
                } catch (e) {
                    setLevelData(null);
                    setLoading(null);
                }
            }
        }
    }, [props.signedInUser, props.sheetsLoaded]);

    useEffect(() => {
        let questionLimit = 0, optionLimit = 0;
        if (type === 'Question') {
            questionLimit = 100;
            optionLimit = 60;
        } else if (type === 'SMS') {
            questionLimit = 200;
            optionLimit = 40;
        } else if (type === 'Email') {
            questionLimit = 300;
            optionLimit = 30;
        }

        setQuestion(question.slice(0, questionLimit));
        setOptions(options.map(_option => ({..._option, option: _option.option.slice(0, optionLimit)})));
    }, [type]);

    const getMetaData = async () => {
        let data = {};
        const docRef = doc(utilRef, 'meta');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            data = docSnap.data();
        }

        return data;
    }

    const addOption = () => {
        const rowsInput = {
            option: '',
            animation: 'sad',
            reward: '500',
            response: '1',
        };

        setOptions([...options, rowsInput]);
    };

    const deleteOption = (index) => {
        setOptions(options.filter((ans, i) => {
            return index !== i;
        }));
    };

    const handleChange = (index, event) => {
        const {name, value} = event.target;
        const rowsInput = [...options];
        rowsInput[index][name] = value;

        if (name === 'response') {
            rowsInput[index]['reward'] = value === '1' ? optionRewards.best : (value === '2' ? optionRewards.ok : optionRewards.wrong) // 1 is best, 2 is ok, 3 is wrong
        }

        setOptions(rowsInput);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading('saving');

        await createQuestion(lName, {
            'Type': type,
            'Leadership Ability': leadershipAbility,
            'Name': type !== 'Question' ? name : "",
            'Subject': type === 'Email' ? subject : "",
            'Email': type === 'Email' ? email : "",
            'Question': question,
            'Answer One': options[0].option,
            'Response One': type === 'Question' ? options[0].animation : "",
            'Answer Two': options[1] ? options[1].option : "",
            'Response Two': type === 'Question' && options[1] ? options[1].animation : "",
            'Answer Three': options[2] ? options[2].option : "",
            'Response Three': type === 'Question' && options[2] ? options[2].animation : "",
            'Answer Four': options[3] ? options[3].option : "",
            'Response Four': type === 'Question' && options[3] ? options[3].animation : "",
            'Response': options.map(_ans => _ans.response).join("|"),
            'Reward': options.map(_ans => _ans.reward).join("|"),
            'Difficulty': difficulty
        });

        history.push(`/admin/levels/${lName}`);
    };


    return (
        <>
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8"/>
            <Container className="mt--9" fluid>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">Add Question</h2>
                            </CardHeader>
                            <CardBody>
                                {
                                    levelData ?
                                        <Form onSubmit={handleSubmit}>
                                            <Row className="mb-2">
                                                <Col lg={4}>
                                                    <Row>
                                                        <Col sm={12}>
                                                            <FormGroup>
                                                                <Label for="type">Type</Label>
                                                                <Input
                                                                    type="select"
                                                                    name="type"
                                                                    id="type"
                                                                    value={type}
                                                                    className="form-control-alternative"
                                                                    required
                                                                    onChange={(e) => {
                                                                        setType(e.target.value);
                                                                    }}
                                                                >
                                                                    <option value="Question">Question</option>
                                                                    <option value="Email">Email</option>
                                                                    <option value="SMS">SMS</option>
                                                                </Input>
                                                            </FormGroup>
                                                        </Col>
                                                        <Col sm={12}>
                                                            <FormGroup>
                                                                <Label for="leadershipAbility">
                                                                    Leadership Ability
                                                                </Label>
                                                                <Input
                                                                    type="select"
                                                                    required
                                                                    id="leadershipAbility"
                                                                    value={leadershipAbility}
                                                                    className="form-control-alternative"
                                                                    onChange={(e) =>
                                                                        setLeadershipAbility(e.target.value)
                                                                    }
                                                                >
                                                                    {
                                                                        abilities.map(_ability => <option
                                                                            value={_ability}>{_ability}</option>)
                                                                    }
                                                                </Input>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                </Col>

                                                <Col lg={8}>
                                                    <Row>
                                                        {type === "Email" && (
                                                            <Col lg={4}>
                                                                <FormGroup>
                                                                    <Label for="Email">Email</Label>
                                                                    <Input
                                                                        type="text"
                                                                        id="Email"
                                                                        required
                                                                        value={email}
                                                                        maxLength={30}
                                                                        onInput={object => {
                                                                            if (object.target.value.length > object.target.maxLength)
                                                                                object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                        }}
                                                                        className="form-control-alternative"
                                                                        onChange={(e) => setEmail(e.target.value)}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        )}
                                                        {(type === "Email" || type === "SMS") && (
                                                            <Col lg={type === "SMS" ? "12" : "4"}>
                                                                <FormGroup>
                                                                    <Label for="name">Name</Label>
                                                                    <Input
                                                                        type="text"
                                                                        id="name"
                                                                        required
                                                                        maxLength={20}
                                                                        onInput={object => {
                                                                            if (object.target.value.length > object.target.maxLength)
                                                                                object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                        }}
                                                                        value={name}
                                                                        className="form-control-alternative"
                                                                        onChange={(e) => setName(e.target.value)}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        )}
                                                        {type === "Email" && (
                                                            <Col lg={4}>
                                                                <FormGroup>
                                                                    <Label for="subject">Subject</Label>
                                                                    <Input
                                                                        type="text"
                                                                        id="subject"
                                                                        required
                                                                        maxLength={40}
                                                                        onInput={object => {
                                                                            if (object.target.value.length > object.target.maxLength)
                                                                                object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                        }}
                                                                        value={subject}
                                                                        className="form-control-alternative"
                                                                        onChange={(e) => setSubject(e.target.value)}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        )}
                                                    </Row>
                                                    <FormGroup>
                                                        <Label for="question">
                                                            Question
                                                        </Label>
                                                        <Input
                                                            type="textarea"
                                                            id="question"
                                                            rows={5}
                                                            required
                                                            value={question}
                                                            className="form-control-alternative"
                                                            onChange={(e) => setQuestion(e.target.value)}
                                                            maxLength={type === "Question" ? 100 : (type === "SMS" ? 200 : 300)}
                                                            onInput={object => {
                                                                if (object.target.value.length > object.target.maxLength)
                                                                    object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                            }}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col xs={12}>
                                                    <div className="d-flex justify-content-between">
                                                        <h3 className="mb-0">Options</h3>
                                                        {options.length < 4 && (
                                                            <Button
                                                                onClick={addOption}
                                                                color="success"
                                                                type="button"
                                                                size="sm"
                                                            >
                                                                <i className="fas fa-plus mr-2"/>
                                                                Option
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <hr className="mt-3"/>
                                                </Col>
                                                {options.map((data, index) => (
                                                    // <Col lg={12}>
                                                    <Col lg={6}>
                                                        <div className="p-3 border rounded mb-4 bg-lighter">
                                                            <Row>
                                                                <Col lg={8}>
                                                                    <FormGroup>
                                                                        <div
                                                                            className="d-flex justify-content-between mb-2">
                                                                            <Label for="optionText">
                                                                                {` Option ${index + 1} `}
                                                                            </Label>
                                                                            {options.length > 1 && (
                                                                                <Button
                                                                                    color="danger"
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    onClick={() => deleteOption(index)}
                                                                                >
                                                                                    <i className="far fa-trash-alt"/>
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                        <Input
                                                                            rows={10}
                                                                            type="textarea"
                                                                            id="optionText"
                                                                            value={data.option}
                                                                            required
                                                                            name="option"
                                                                            className="form-control-alternative"
                                                                            onChange={(event) =>
                                                                                handleChange(index, event)
                                                                            }
                                                                            maxLength={type === "Question" ? 60 : (type === "SMS" ? 40 : 30)}
                                                                            onInput={object => {
                                                                                if (object.target.value.length > object.target.maxLength)
                                                                                    object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                                            }}
                                                                        />
                                                                    </FormGroup>
                                                                </Col>
                                                                <Col lg={4}>
                                                                    {type === "Question" && (
                                                                        <FormGroup>
                                                                            <Label for="animation">
                                                                                Animation
                                                                            </Label>
                                                                            <Input
                                                                                type="select"
                                                                                name="animation"
                                                                                id="animation"
                                                                                value={data.animation}
                                                                                required
                                                                                className="form-control-alternative"
                                                                                onChange={(event) =>
                                                                                    handleChange(index, event)
                                                                                }
                                                                            >
                                                                                <option value="sad">Sad</option>
                                                                                <option value="happy">Happy</option>
                                                                                <option value="angry">Angry</option>
                                                                                <option value="normal">Normal
                                                                                </option>
                                                                            </Input>
                                                                        </FormGroup>
                                                                    )}

                                                                    <FormGroup>
                                                                        <Label for="reward">
                                                                            Reward
                                                                        </Label>
                                                                        <Input
                                                                            type="text"
                                                                            id="reward"
                                                                            required
                                                                            name="reward"
                                                                            readOnly
                                                                            value={data.reward}
                                                                            className="form-control-alternative"
                                                                        />
                                                                    </FormGroup>
                                                                    <FormGroup>
                                                                        <Label for="response">
                                                                            Response
                                                                        </Label>
                                                                        <Input
                                                                            type="select"
                                                                            id="response"
                                                                            name="response"
                                                                            value={data.response}
                                                                            required
                                                                            className="form-control-alternative"
                                                                            onChange={(event) =>
                                                                                handleChange(index, event)
                                                                            }
                                                                        >
                                                                            <option value="1">Best</option>
                                                                            <option value="2">Ok</option>
                                                                            <option value="3">Wrong</option>
                                                                        </Input>
                                                                    </FormGroup>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                            <Row>
                                                <Col className="text-right">
                                                    <Button color="danger" onClick={() => history.goBack()}
                                                            disabled={loading === 'saving'}>
                                                        Cancel
                                                    </Button>
                                                    <Button color="primary" type="submit"
                                                            disabled={loading === 'saving'}>
                                                        {
                                                            loading === 'saving' ?
                                                                <Spinner color="light" size="sm"/> :
                                                                'Save'
                                                        }
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </Form> :
                                        <div className="text-center py-5 mt-5">
                                            <Spinner color="primary"/>
                                        </div>
                                }
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}
