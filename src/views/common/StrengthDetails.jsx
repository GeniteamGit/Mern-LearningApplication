import {Button, Card, CardBody, CardHeader, Col, Container, Input, Row} from "reactstrap";
import Multiselect from "multiselect-react-dropdown";
import {firebaseConstants, getDb, multiselectDropdownStyle} from "../../util/Constants";
import DataTable from "react-data-table-component";
import numeral from "numeral";
import {useEffect, useRef, useState} from "react";
import {collection, doc, getDoc, getDocs, query, where} from "firebase/firestore";
import _ from "lodash";

let timer = null;

export default function StrengthDetails() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeLeaderboard, setActiveLeaderboard] = useState([]);
    const [leaderboardToExport, setLeaderboardToExport] = useState("");
    const [departmentsData, setDepartmentsData] = useState([]);
    const [regionsData, setRegionsData] = useState([]);
    const [capabilitiesData, setCapabilitiesData] = useState([]);
    const [department, setDepartment] = useState(null);
    const [regions, setRegions] = useState([]);
    const [filters, setFilters] = useState({});
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
    const [nameSearchData, setNameSearchData] = useState([]);
    const [emailSearchData, setEmailSearchData] = useState([]);
    const [loadingSearchData, setLoadingSearchData] = useState(false);

    const departmentDropdown = useRef();
    const regionDropdown = useRef();
    const searchByNameDropdown = useRef();
    const searchByEmailDropdown = useRef();

    const db = getDb();
    const usersRef = collection(db, firebaseConstants.dbUsers);
    const utilRef = collection(db, firebaseConstants.dbUtil);

    useEffect(async () => {
        getMetaData().then(data => {
            setDepartmentsData(data.departments);
            setRegionsData(data.regions);
            setCapabilitiesData(data.capabilities);
        });
        await getLeaderboard();
    }, []);

    useEffect(() => {
        let _data = leaderboard;

        if (department || regions.length > 0) {
            _data = _data.filter(_user => {
                let isInDept = true, isInRegion = true;

                if (regions.length > 0) {
                    isInRegion = regions.includes(_user.region)
                }
                if (department) {
                    isInDept = (_user.department === department);
                }

                return isInDept && isInRegion;
            });
        }

        _data = _data.filter(_user => {
            let shouldReturn = true;
            for (const _capability of Object.keys(filters)) {
                if (_user.capabilities[_capability].percentage) {
                    if (((_user.capabilities[_capability].percentage / _user.capabilities[_capability].levels) < Number(filters[_capability]))) {
                        shouldReturn = false;
                        break;
                    }
                } else if ((_user.capabilities[_capability].percentage < Number(filters[_capability]))) {
                    shouldReturn = false;
                    break;
                }
            }

            return shouldReturn;
        });

        setActiveLeaderboard(_data);
    }, [department, regions, filters]);

    const getMetaData = async () => {
        let _dept = [], _regions = [], _capabilities = [];
        const docRef = doc(utilRef, 'meta');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            _dept = data.departments ? data.departments : [];
            _regions = data.regions ? data.regions : [];
            _capabilities = data.capabilities ? data.capabilities : [];
        }

        return {departments: _dept, regions: _regions, capabilities: _capabilities};
    }

    const getLeaderboard = async () => {
        let data = [], q = null;

        q = query(usersRef, where('completedOnce', '==', true));
        const querySnapshot = await getDocs(q);

        querySnapshot.docs.forEach((doc, index) => {
            const _user = parseUser({rank: index + 1, id: doc.id, ...doc.data()});
            data.push(_user);
            // startRank++;
        });

        setLeaderboard(data);
        setActiveLeaderboard(data);

        const _searchData = data.slice(0, data.length % 5).map(user => ({
            ...user,
            value: <span>{user.name} - <span className="">{user.email}</span></span>
        }));
        setNameSearchData(_searchData)
        setEmailSearchData(_searchData);

        setLoadingLeaderboard(false);
    }

    const getConstraints = () => {
        const constraints = [];

        if (department) {
            constraints.push(where('department', '==', department));
        }
        if (regions.length > 0) {
            constraints.push(where('region', 'in', regions));
        }
        return constraints;
    }

    const handleSearch = async (searchText, searchBy) => {
        let userData = [];

        if (searchText) {
            const unsortedData = activeLeaderboard
                .filter(user => user[searchBy].toLowerCase().startsWith(searchText.toLowerCase()) || user[searchBy].toLowerCase().includes(searchText.toLowerCase()))
                .slice(0, 10)
                .map(user => ({...user, value: <span>{user.name} - <span className="">{user.email}</span></span>}));
            userData = _.orderBy(unsortedData, [searchBy], ['desc']);
        } else {
            userData = activeLeaderboard.slice(0, 10).map(user => ({
                ...user,
                value: <span>{user.name} - <span className="">{user.email}</span></span>
            }));
        }

        searchBy === 'name' ? setNameSearchData(userData) : setEmailSearchData(userData);
        setLoadingSearchData(false);
    }

    const removeSearch = (list, item) => {
        setActiveLeaderboard(leaderboard);
    }

    const clearFilters = () => {
        departmentDropdown.current.resetSelectedValues();
        regionDropdown.current.resetSelectedValues();
        searchByNameDropdown.current.resetSelectedValues();
        searchByEmailDropdown.current.resetSelectedValues();
        setDepartment(null);
        setRegions([]);
        setFilters({});
    }

    const parseUser = (_user) => {
        let total = {};

        Object.keys(_user.capabilities).map(capabilityName => {
            const capability = _user.capabilities[capabilityName];
            if (!total[capabilityName]) {
                total[capabilityName] = {
                    levels: 0, achievedScore: 0,
                    percentage: 0,
                    totalQuestions: 0,
                    totalScore: 0
                };
            }

            // if (capability.status && capability.scores) {
            if (capability.scores) {

                Object.keys(capability.scores).map(levelName => {
                    if (capability.scores[levelName].totalQuestions > 0) {
                        total[capabilityName].levels += 1;
                        total[capabilityName].achievedScore += capability.scores[levelName].achievedScore;
                        total[capabilityName].percentage += capability.scores[levelName].percentage;
                        total[capabilityName].totalQuestions += capability.scores[levelName].totalQuestions;
                        total[capabilityName].totalScore += capability.scores[levelName].totalScore;
                    }
                });
            }
        });

        return {..._user, capabilities: total};
    }

    const getColumns = () => {
        const _columns = [
            {name: '#', center: true, width: '50px', selector: row => row.rank},
            {name: 'Name', wrap: true, minWidth: '15%', selector: row => row.name},
            {name: 'Email', wrap: true, minWidth: '15%', selector: row => row.email},
            {name: 'Region', center: true, minWidth: '5%', selector: row => row.region},
            {name: 'Dept.', center: true, minWidth: '5%', selector: row => row.department},
            {
                name: 'Score',
                center: true,
                width: '10%',
                selector: row => row.completedOnce,
                cell: row => {
                    return (
                        <div className="text-center">
                            {
                                row.completedOnce ?
                                    <div>
                                        {/*<i className="fas fa-check text-success"/>*/}
                                        {/*<span className="mx-1">&#9679;</span>*/}
                                        {numeral(row.lastCompletedScore).format('0,0')}
                                    </div> :
                                    <i className="fas fa-times text-danger"/>
                            }
                        </div>
                    )
                }
            },
        ];

        return [
            ..._columns,
            ...(capabilitiesData.map(_capability => {
                return {
                    name: _.startCase(_capability),
                    center: true,
                    width: '10%',
                    selector: row => row.capabilities,
                    cell: row => {
                        return (
                            <span>{numeral(row.capabilities[_capability].percentage / row.capabilities[_capability].levels).format('0,0.[0]')}%</span>
                        )
                    }
                }
            }))
        ];
    }

    return (
        <>
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
            </div>
            <Container className="mt--9" fluid>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">Filters</h2>
                                <p className="mb-0 small text-muted">* showing only completed</p>
                            </CardHeader>
                            <CardBody>
                                <Row className="mb-4">
                                    <Col md={2}>
                                        <h5 className="text-muted">Department</h5>
                                        <Multiselect
                                            ref={departmentDropdown}
                                            className="form-control-alternative mb-1"
                                            isObject={false}
                                            showArrow={true}
                                            selectionLimit={1}
                                            placeholder="Search"
                                            options={departmentsData}
                                            closeIcon="cancel"
                                            onSelect={(list, item) => setDepartment(item)}
                                            onRemove={(list, item) => setDepartment(null)}
                                            style={multiselectDropdownStyle}
                                        />
                                        <p className="mb-0 small text-muted float-right">Single Select</p>
                                    </Col>
                                    <Col md={2}>
                                        <h5 className="text-muted">Region</h5>
                                        <Multiselect
                                            ref={regionDropdown}
                                            className="form-control-alternative mb-1"
                                            isObject={false}
                                            showArrow={true}
                                            placeholder="Search"
                                            options={regionsData}
                                            closeIcon="cancel"
                                            onSelect={(list, item) => setRegions([...regions, item])}
                                            onRemove={(list, item) => setRegions(regions.filter(i => i !== item))}
                                            style={multiselectDropdownStyle}
                                        />
                                        <p className="mb-0 small text-muted float-right">Multi Select</p>
                                    </Col>
                                    {
                                        capabilitiesData.length > 0 && capabilitiesData.map(_capability => (
                                            <Col md={2}>
                                                <h5 className="text-muted">{_.startCase(_capability)}</h5>
                                                <Input type="number" min="0" max="100" placeholder="0"
                                                       className="form-control-alternative" name={_capability}
                                                       value={filters[_capability] || ""}
                                                       onChange={e => {
                                                           setFilters({...filters, [e.target.name]: e.target.value})
                                                       }}
                                                       maxLength={3}
                                                       onInput={object => {
                                                           if (object.target.value.length > object.target.maxLength)
                                                               object.target.value = object.target.value.slice(0, object.target.maxLength)
                                                       }}
                                                />
                                            </Col>
                                        ))
                                    }
                                </Row>
                                <Row>
                                    <Col className="text-right">
                                        <Button
                                            color="danger"
                                            // size="sm"
                                            // disabled={!department && regions.length === 0}
                                            onClick={clearFilters}
                                        >
                                            Clear
                                        </Button>
                                        {/*<Button*/}
                                        {/*    color="primary"*/}
                                        {/*    // size="sm"*/}
                                        {/*    disabled={!department && regions.length === 0}*/}
                                        {/*    onClick={applyFilters}*/}
                                        {/*>*/}
                                        {/*    Apply*/}
                                        {/*</Button>*/}
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">Strength Details</h2>
                                <Row>
                                    <Col>
                                        <Multiselect
                                            className="form-control-alternative"
                                            ref={searchByNameDropdown}
                                            // showArrow={true}
                                            hidePlaceholder={true}
                                            displayValue="value"
                                            selectionLimit={1}
                                            placeholder="Search by Name"
                                            options={nameSearchData}
                                            closeIcon="cancel"
                                            loading={loadingSearchData}
                                            onSelect={(list, item) => {
                                                searchByEmailDropdown.current.resetSelectedValues();
                                                setActiveLeaderboard([item]);
                                            }}
                                            onRemove={removeSearch}
                                            onSearch={text => {
                                                // setNameSearchData([]);
                                                clearTimeout(timer);
                                                // if (text.length >= 1) {
                                                setLoadingSearchData(true);
                                                timer = setTimeout(() => {
                                                    handleSearch(text, 'name').then(r => {
                                                    });
                                                }, 500);
                                                // } else {
                                                //     setLoadingSearchData(false);
                                                // }
                                            }}
                                            style={multiselectDropdownStyle}
                                        />
                                    </Col>
                                    <Col>
                                        <Multiselect
                                            className="form-control-alternative"
                                            ref={searchByEmailDropdown}
                                            // showArrow={true}
                                            hidePlaceholder={true}
                                            displayValue="value"
                                            selectionLimit={1}
                                            placeholder="Search by Email"
                                            options={emailSearchData}
                                            closeIcon="cancel"
                                            loading={loadingSearchData}
                                            onSelect={(list, item) => {
                                                searchByNameDropdown.current.resetSelectedValues();
                                                setActiveLeaderboard([item]);
                                            }}
                                            onRemove={removeSearch}
                                            onSearch={text => {
                                                // setEmailSearchData([]);
                                                clearTimeout(timer);
                                                // if (text.length >= 1) {
                                                setLoadingSearchData(true);
                                                timer = setTimeout(() => {
                                                    handleSearch(text, 'email').then(r => {
                                                    });
                                                }, 500);
                                                // } else {
                                                //     setLoadingSearchData(false);
                                                // }
                                            }}
                                            style={multiselectDropdownStyle}
                                        />
                                    </Col>
                                    {/*<Col>*/}
                                    {/*    <CSVLink*/}
                                    {/*        headers={leaderboardExportHeaders}*/}
                                    {/*        data={leaderboardToExport}*/}
                                    {/*        asyncOnClick={true}*/}
                                    {/*        onClick={exportToCSV}*/}
                                    {/*        filename={"Progress-leaderboard2.csv"}*/}
                                    {/*        className="btn btn-default"*/}
                                    {/*        target="_blank"*/}
                                    {/*    >*/}
                                    {/*        Download CSV*/}
                                    {/*    </CSVLink>*/}
                                    {/*</Col>*/}
                                </Row>
                            </CardHeader>
                            <DataTable
                                columns={getColumns()}
                                data={activeLeaderboard}
                                progressPending={loadingLeaderboard}
                                pagination
                                responsive
                                persistTableHead
                                highlightOnHover
                            />
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}