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
import {getMiscellaneousData, getQuestion} from "../../util/SheetManager";
import {firebaseConstants, getDb, levelNames} from "../../util/Constants";
import {collection, doc, getDoc} from "firebase/firestore";


export default function EditQuestion(props) {
    const [data, setData] = useState(null);
    const [type, setType] = useState("Email");
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
        reward: "",
        response: "1"
    }]);
    const [difficulty, setDifficulty] = useState("");
    const [loading, setLoading] = useState("data");

    const {lName, questionIndex} = useParams();
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
                        setAbilities(_d);
                    });

                    if (levelNames.includes(lName)) {
                        const _data = await getQuestion(lName, questionIndex);
                        if (_data) {
                            const responses = _data['Response'].split("|");
                            const rewards = _data['Reward'].split("|");
                            const options = [
                                {
                                    option: _data['Answer One'],
                                    animation: _data['Response One'],
                                    reward: rewards[0],
                                    response: responses[0]
                                },
                            ];

                            if (_data['Answer Two']) {
                                options.push({
                                    option: _data['Answer Two'],
                                    animation: _data['Response Two'],
                                    reward: rewards.length >= 2 ? rewards[1] : 0,
                                    response: responses.length >= 2 ? responses[1] : "1"
                                });
                            }
                            if (_data['Answer Three']) {
                                options.push({
                                    option: _data['Answer Three'],
                                    animation: _data['Response Three'],
                                    reward: rewards.length >= 3 ? rewards[2] : 0,
                                    response: responses.length >= 3 ? responses[2] : "1"
                                });
                            }
                            if (_data['Answer Four']) {
                                options.push({
                                    option: _data['Answer Four'],
                                    animation: _data['Response Four'],
                                    reward: rewards.length >= 4 ? rewards[3] : 0,
                                    response: responses.length >= 4 ? responses[3] : "1"
                                });
                            }

                            setType(_data['Type']);
                            setLeadershipAbility(_data['Leadership Ability']);
                            setName(_data['Name']);
                            setSubject(_data['Subject']);
                            setEmail(_data['Email']);
                            setQuestion(_data['Question']);
                            setDifficulty(_data['Difficulty']);
                            setOptions(options);
                            setData(_data);
                            setLoading(null);
                        } else {
                            history.goBack();
                        }
                    } else {
                        history.goBack();
                    }
                } catch (e) {
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
        setOptions([...options, {
            option: "",
            animation: "sad",
            reward: "",
            response: "1",
        }]);
    };

    const deleteOption = (index) => {
        setOptions(options.filter((ans, i) => index !== i));
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

        const _data = data;
        _data['Type'] = type;
        _data['Leadership Ability'] = leadershipAbility;
        _data['Difficulty'] = difficulty;
        _data['Question'] = question;
        _data['Subject'] = type === 'Email' ? subject : "";
        _data['Name'] = type !== 'Question' ? name : "";
        _data['Email'] = type === 'Email' ? email : "";
        _data['Answer One'] = options[0].option;
        _data['Response One'] = type === 'Question' && options[0] ? options[0].animation : "";
        _data['Answer Two'] = options[1] ? options[1].option : "";
        _data['Response Two'] = type === 'Question' && options[1] ? options[1].animation : "";
        _data['Answer Three'] = options[2] ? options[2].option : "";
        _data['Response Three'] = type === 'Question' && options[2] ? options[2].animation : "";
        _data['Answer Four'] = options[3] ? options[3].option : "";
        _data['Response Four'] = type === 'Question' && options[3] ? options[3].animation : "";
        _data['Response'] = options.map(_ans => _ans.response).join("|");
        _data['Reward'] = options.map(_ans => _ans.reward).join("|");

        await _data.save();

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
                                <h2 className="mb-0">Edit Question</h2>
                            </CardHeader>
                            <CardBody>
                                {
                                    loading === 'data' ?
                                        <div className="text-center py-5 mt-5">
                                            <Spinner color="primary"/>
                                        </div> :
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
                                        </Form>
                                }
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}
