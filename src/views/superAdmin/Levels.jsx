import {Badge, Button, Card, CardHeader, Col, Container, Form, Input, Row, Spinner} from "reactstrap";
import DataTable from "react-data-table-component";
import numeral from "numeral";
import {useEffect, useState} from "react";
import {getLevels, getMiscellaneousData} from "../../util/SheetManager";
import {Link, useHistory} from "react-router-dom";
import {arrayRemove, arrayUnion, doc, updateDoc} from "firebase/firestore";
import {getDb} from "../../util/Constants";
import _ from "lodash";

export default function Levels(props) {
    const [sheetData, setSheetData] = useState([]);
    const [miscellaneousData, setMiscellaneousData] = useState([]);
    const [loadingLevelData, setLoadingLevelData] = useState(true);
    const [toggledClearRows, setToggleClearRows] = useState(false);
    const [selectedRowsData, setSelectedRowsData] = useState([]);
    const [dummyState, setDummyState] = useState(false);

    const [editing, setEditing] = useState(null);
    const [lAbilities, setLAbilities] = useState({});
    const [loading, setLoading] = useState(null);

    const history = useHistory();
    const db = getDb();

    useEffect(async () => {
        if (props.signedInUser) {
            if (props.sheetsLoaded) {
                try {
                    const _sheetData = await getLevels();
                    const _miscellaneousData = await getMiscellaneousData();
                    setSheetData(_sheetData.sort((a, b) => a['Sorting Order'] - b['Sorting Order']));
                    setMiscellaneousData(_miscellaneousData);
                    setLoadingLevelData(false);
                } catch (e) {
                    setSheetData([]);
                    setLoadingLevelData(false);
                }
            }
        }
    }, [props.signedInUser, props.sheetsLoaded]);

    const onRowsSelected = ({selectedRows}) => {
        setSelectedRowsData(selectedRows);
    }

    const saveToSheet = () => {
        sheetData.forEach(async (_d, _i) => {
            if (sheetData[_i].updated) {
                sheetData[_i]['Sorting Order'] = _i + 1;
                await sheetData[_i].save();
            }
        });
    }

    const move = (arr, old_index, new_index) => {
        while (old_index < 0) {
            old_index += arr.length;
        }
        while (new_index < 0) {
            new_index += arr.length;
        }
        if (new_index >= arr.length) {
            let k = new_index - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    };

    const moveUp = () => {
        const _data = sheetData;
        selectedRowsData.forEach(_row => {
            const _index = _data.findIndex((_d, _index) => _d['Tab Name'] === _row['Tab Name']);
            const endIndex = _index - 1;
            _data[_index].updated = true;
            const _x = endIndex >= 0 ? endIndex : (endIndex + _data.length);
            _data[_x].updated = true;
            move(_data, _index, endIndex);
            
        });

        setSheetData(_data);
        
        setDummyState(!dummyState);
    }

    const moveDown = () => {
        const _data = sheetData;
        selectedRowsData.forEach(_row => {
            const _index = _data.findIndex((_d, _index) => _d['Tab Name'] === _row['Tab Name']);
            const endIndex = (_index + 1) % _data.length;
            _data[_index].updated = true;
            _data[endIndex].updated = true;
            move(_data, _index, endIndex);
        });

        setSheetData(_data);
        setDummyState(!dummyState);
    }

    const makeFinal = async (_lName) => {
        setLoading('making final');
        const data = await Promise.all(sheetData.map(async _data => {
            if (_data['Tab Name']) {
                // already final
                if (_data['Final'] === 'y') {
                    _data['Final'] = 'n';
                    await _data.save();
                }
                // make new final
                if (_data['Tab Name'] === _lName) {
                    _data['Final'] = 'y';
                    await _data.save();
                }
            }
            return _data;
        }));
        setSheetData(
            data
        );

        setLoading(null);
    }

    return (
        <>
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8"/>
            <Container className="mt--9" fluid>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">Levels</h2>
                                <div>
                                    <Button
                                        disabled={selectedRowsData.length === 0}
                                        color="default"
                                        onClick={moveUp}
                                    >
                                        <i className="fas fa-chevron-up"/>
                                    </Button>
                                    <Button
                                        disabled={selectedRowsData.length === 0}
                                        color="default"
                                        onClick={moveDown}
                                    >
                                        <i className="fas fa-chevron-down"/>
                                    </Button>
                                    <Button
                                        disabled={selectedRowsData.length === 0}
                                        color="primary"
                                        onClick={saveToSheet}
                                    >
                                        Save
                                    </Button>
                                    {
                                        (sheetData.length > 0 && sheetData.filter(_data => _data['Tab Name']).length <= 11) &&
                                        <Link className="btn btn-primary" to="levels/new">
                                            <i className="fas fa-plus"/>
                                        </Link>
                                    }
                                </div>
                            </CardHeader>
                            <div className="pb-2">
                                <DataTable
                                    columns={[
                                        // {
                                        //     name: '',
                                        //     center: true,
                                        //     width: '50px',
                                        //     selector: row => null,
                                        //     cell: row => {
                                        //         if (row['Final'] === 'y')
                                        //             return <Badge color="primary">Final</Badge>
                                        //         else return ""
                                        //     }
                                        // },
                                        {
                                            name: 'Level Name',
                                            minWidth: '10%',
                                            wrap: true,
                                            center: true,
                                            selector: row => row['Tab Name']
                                        },
                                        {
                                            name: 'Passing Score', center: true,
                                            selector: row => row['Passing Score'],
                                            cell: row => (
                                                <div>{numeral(row['Passing Score']).format("0,0")}</div>
                                            )
                                        },
                                        {
                                            name: 'Time (sec)',
                                            wrap: true,
                                            selector: row => row['Time(sec)'],
                                            cell: row => <div>{row['Time(sec)']}<span
                                                className="small text-muted ml-1">seconds</span></div>
                                        },
                                        {
                                            name: 'Questions',
                                            selector: row => row['Total Questions'],
                                            cell: row => {
                                                let _values = [], isLevel = Number.isInteger(Number(row['Tab Name']));
                                                if (isLevel) {
                                                    _values = row['Total Questions'].split("|");
                                                }
                                                return (
                                                    <div>
                                                        {
                                                            isLevel ?
                                                                <div className="py-1">
                                                                    <div>{_values[0]}<span
                                                                        className="small text-muted ml-1">Questions</span>
                                                                    </div>
                                                                    <div>{_values[1]}<span
                                                                        className="small text-muted ml-2">Emails</span>
                                                                    </div>
                                                                    <div>{_values[2]}<span
                                                                        className="small text-muted ml-2">SMS</span>
                                                                    </div>
                                                                </div> :
                                                                <div>
                                                                    {row['Total Questions']}
                                                                </div>
                                                        }
                                                    </div>
                                                )
                                            }
                                        },
                                        {
                                            name: 'Min. Attempts',
                                            selector: row => row['Min Attempt'],
                                            cell: row => {
                                                let _values = [], isLevel = Number.isInteger(Number(row['Tab Name']));
                                                if (isLevel) {
                                                    _values = row['Min Attempt'].split("|");
                                                }
                                                return (
                                                    <div>
                                                        {
                                                            isLevel &&
                                                            <div className="py-1">
                                                                <div>{_values[0]}<span
                                                                    className="small text-muted ml-1">Questions</span>
                                                                </div>
                                                                <div>{_values[1]}<span
                                                                    className="small text-muted ml-2">Emails</span>
                                                                </div>
                                                                <div>{_values[2]}<span
                                                                    className="small text-muted ml-2">SMS</span></div>
                                                            </div>
                                                        }
                                                    </div>
                                                )
                                            }
                                        },
                                        {
                                            name: 'Difficulty',
                                            center: true,
                                            selector: row => (row['Difficulty Level'] ? _.startCase(row['Difficulty Level']) : 'N/A')
                                        },
                                        {
                                            name: 'Level Objective',
                                            minWidth: '20%',
                                            wrap: true,
                                            center: true,
                                            selector: row => row.Goal_text,
                                            cell: row => {
                                                return (
                                                    <div className="small">
                                                        {row.Goal_text}
                                                    </div>
                                                )
                                            }
                                        },
                                        {
                                            name: '',
                                            // center: true,
                                            width: '200px',
                                            selector: row => null,
                                            cell: row => (
                                                <div className="d-flex justify-content-end w-100 px-2">
                                                    {
                                                        row['Final'] === 'n' ?
                                                            <Button
                                                                color="secondary"
                                                                size="sm"
                                                                disabled={loading === 'making final'}
                                                                onClick={() => makeFinal(row['Tab Name'])}
                                                            >
                                                                Final
                                                            </Button> :
                                                            <div className="px-2">
                                                                <Badge color="primary">Final</Badge>
                                                            </div>
                                                    }
                                                    <Button
                                                        color="default"
                                                        size="sm"
                                                        onClick={() => history.push(`levels/${row['Tab Name']}/edit`)}
                                                    >
                                                        <i className="fas fa-pencil-alt"/>
                                                    </Button>
                                                    
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        onClick={() => history.push(`levels/${row['Tab Name']}`)}
                                                    >
                                                        <i className="far fa-eye"/>
                                                    </Button>
                                                </div>
                                            )
                                        }
                                    ]}
                                    data={sheetData}
                                    progressPending={loadingLevelData}
                                    selectableRows
                                    onSelectedRowsChange={onRowsSelected}
                                    clearSelectedRows={toggledClearRows}
                                    highlightOnHover
                                    responsive
                                    persistTableHead
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col lg={8}>
                        <Card className="shadow mb-4 mb-lg-0">
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">Skills</h2>
                                {/*<Button*/}
                                {/*    color="primary"*/}
                                {/*>*/}
                                {/*    <i className="fas fa-plus"/>*/}
                                {/*</Button>*/}
                            </CardHeader>
                            <DataTable
                                columns={[
                                    {
                                        name: 'Name', minWidth: '20%', maxWidth: '30%',
                                        wrap: true, center: true,
                                        selector: row => row['Leadership Abilities'],
                                        cell: row => (
                                            <div className="w-100 text-center">
                                                {
                                                    editing === row['Leadership Abilities'] ?
                                                        <div className="d-flex justify-content-center">
                                                            <Input bsSize="sm" className="form-control-alternative"
                                                                   type="text" name={row['Leadership Abilities']}
                                                                   value={lAbilities.name}
                                                                   onChange={e => setLAbilities({
                                                                       ...lAbilities,
                                                                       name: e.target.value
                                                                   })}
                                                                   style={{maxWidth: '95%'}}/>
                                                        </div> :
                                                        <span>{row['Leadership Abilities']}</span>
                                                }
                                            </div>
                                        )
                                    },
                                    {
                                        name: 'Text', wrap: true,
                                        selector: row => row['Leadership Text'],
                                        cell: row => (
                                            <div className="w-100">
                                                {
                                                    editing === row['Leadership Abilities'] ?
                                                        <div className="d-flex justify-content-center">
                                                            <Input bsSize="sm" className="form-control-alternative my-2"
                                                                   type="textarea" name={row['Leadership Text']}
                                                                   value={lAbilities.text}
                                                                   onChange={e => setLAbilities({
                                                                       ...lAbilities,
                                                                       text: e.target.value
                                                                   })}
                                                                   style={{maxWidth: '95%'}}/>
                                                        </div> :
                                                        <span>{row['Leadership Text']}</span>
                                                }
                                            </div>
                                        )
                                    },
                                    {
                                        name: '',
                                        center: true,
                                        width: '10%',
                                        selector: row => null,
                                        cell: row => (
                                            <div>
                                                {
                                                    editing === row['Leadership Abilities'] &&
                                                    <Button
                                                        disabled={loading === row['Leadership Abilities']}
                                                        className="px-2 ml-0 mr-2"
                                                        color="success"
                                                        size="sm"
                                                        onClick={async e => {
                                                            e.preventDefault();
                                                            setLoading(row['Leadership Abilities']);

                                                            e.preventDefault();

                                                            let _index = -1;
                                                            let oldAbilityName = "";
                                                            const _data = miscellaneousData.map((_row, i) => {
                                                                if (_row['Leadership Abilities'] === row['Leadership Abilities']) {
                                                                    oldAbilityName = _row['Leadership Abilities'];
                                                                    _row['Leadership Abilities'] = lAbilities.name;
                                                                    _row['Leadership Text'] = lAbilities.text;
                                                                    _index = i;
                                                                }
                                                                return _row;
                                                            });

                                                            if (_index >= 0) {
                                                                await _data[_index].save();
                                                            }

                                                            

                                                            const utilsRef = doc(db, "util", "meta");
                                                            await updateDoc(utilsRef, {
                                                                capabilities: arrayRemove(_.camelCase(oldAbilityName))
                                                            });
                                                            await updateDoc(utilsRef, {
                                                                capabilities: arrayUnion(_.camelCase(lAbilities.name))
                                                            });

                                                            setMiscellaneousData(_data);

                                                            setLoading(null);
                                                            setEditing(null);
                                                        }}
                                                    >
                                                        {
                                                            loading === row['Leadership Abilities'] ?
                                                                <Spinner size="sm" color="light"/> :
                                                                <i className="fas fa-check"/>
                                                        }
                                                    </Button>
                                                }
                                                <Button
                                                    className="px-2"
                                                    color={editing === row['Leadership Abilities'] ? "danger" : "default"}
                                                    size="sm"
                                                    onClick={() => {
                                                        if (editing === row['Leadership Abilities']) {
                                                            setEditing(null);
                                                        } else {
                                                            setLAbilities({
                                                                name: row['Leadership Abilities'],
                                                                text: row['Leadership Text']
                                                            })
                                                            setEditing(row['Leadership Abilities']);
                                                        }
                                                    }}
                                                >
                                                    {
                                                        editing === row['Leadership Abilities'] ?
                                                            <i className="fas fa-times"/> :
                                                            <i className="fas fa-pencil-alt"/>
                                                    }
                                                </Button>
                                            </div>
                                        )
                                    }
                                ]}
                                data={miscellaneousData.filter(_data => _data['Leadership Abilities'])}
                                progressPending={loadingLevelData}
                                responsive
                                highlightOnHover
                                persistTableHead
                            />
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="shadow">
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">Characters</h2>
                                {/*<Button*/}
                                {/*    color="primary"*/}
                                {/*    onClick={toggleModal}*/}
                                {/*>*/}
                                {/*    <i className="fas fa-plus"/>*/}
                                {/*</Button>*/}
                            </CardHeader>
                            <DataTable
                                columns={[
                                    {
                                        name: 'Character',
                                        wrap: true, center: true, minWidth: '20%', maxWidth: '30%',
                                        selector: row => row.Characters
                                    },
                                    {
                                        name: 'Name', minWidth: '50%',
                                        selector: row => row.Names,
                                        cell: row => (
                                            <div className="w-100">
                                                {
                                                    editing === row.Characters ?
                                                        <Form
                                                            className="d-flex justify-content-around align-items-center"
                                                            onSubmit={async e => {
                                                                setLoading(row.Characters);

                                                                e.preventDefault();

                                                                let _index = -1;
                                                                const _data = miscellaneousData.map((_row, i) => {
                                                                    if (_row.Characters === row.Characters) {
                                                                        _row.Names = e.target[0].value;
                                                                        _index = i;
                                                                    }
                                                                    return _row;
                                                                });

                                                                if (_index >= 0) {
                                                                    await _data[_index].save();
                                                                }

                                                                setMiscellaneousData(_data);

                                                                setLoading(null);
                                                                setEditing(null);
                                                            }}>
                                                            <Input bsSize="sm" className="form-control-alternative"
                                                                   type="text" name={row.Characters}
                                                                   defaultValue={row.Names} required
                                                                   style={{maxWidth: '75%'}}/>
                                                            <Button
                                                                disabled={loading === row.Characters}
                                                                className="px-2 ml-2 mr-0"
                                                                color="success"
                                                                size="sm"
                                                                type="submit"
                                                            >
                                                                {
                                                                    loading === row.Characters ?
                                                                        <Spinner size="sm" color="light"/> :
                                                                        <i className="fas fa-check"/>
                                                                }
                                                            </Button>
                                                        </Form> :
                                                        <span>{row.Names}</span>
                                                }
                                            </div>
                                        )
                                    },
                                    {
                                        name: '',
                                        minWidth: '10%',
                                        maxWidth: '15%',
                                        selector: row => null,
                                        cell: row => (
                                            <div>
                                                <Button
                                                    color={editing === row.Characters ? "danger" : "default"}
                                                    size="sm"
                                                    onClick={() => editing === row.Characters ? setEditing(null) : setEditing(row.Characters)}
                                                >
                                                    {
                                                        editing === row.Characters ?
                                                            <i className="fas fa-times"/> :
                                                            <i className="fas fa-pencil-alt"/>
                                                    }
                                                </Button>
                                            </div>
                                        )
                                    }
                                ]}
                                data={miscellaneousData.filter(_data => _data.Characters)}
                                progressPending={loadingLevelData}
                                highlightOnHover
                                responsive
                                persistTableHead
                            />
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}