import {Card, CardBody, CardHeader, Col, Container, Row} from "reactstrap";
import {useEffect, useState} from "react";
import {collection, doc, getDoc, getDocs, query} from "firebase/firestore";
import {firebaseConstants, getDb, multiselectDropdownStyle} from "../../util/Constants";
import _ from "lodash";
import Multiselect from "multiselect-react-dropdown";
import DataTable from "react-data-table-component";
import numeral from "numeral";
import classNames from "classnames";

export default function OverallStrengths(props) {
    const [showing, setShowing] = useState("all");
    const [grades, setGrades] = useState([]);
    const [stats, setStats] = useState({});
    const [users, setUsers] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [showingData, setShowingData] = useState([]);
    const [capability, setCapability] = useState(null);
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [regions, setRegions] = useState([]);
    const [capabilitiesData, setCapabilitiesData] = useState([]);
    const [gradesData, setGradesData] = useState([]);
    const [departmentsData, setDepartmentsData] = useState([]);
    const [regionsData, setRegionsData] = useState([]);

    const db = getDb();
    const usersRef = collection(db, firebaseConstants.dbUsers);
    const utilRef = collection(db, firebaseConstants.dbUtil);

    useEffect(() => {
        getMetaData().then(data => {
            const stats = {};

            // Object.keys(data.grades).map(gradeName => {
            //     stats[gradeName] = {};
            // });
            // setStats(stats);
            setGrades(_.orderBy(data.grades, ['order'], ['asc']));
            setCapabilitiesData(data.capabilities);
            setGradesData(data.grades.map(_grade => _grade.name));
            setDepartmentsData(data.departments);
            setRegionsData(data.regions);
        });
        getUsersData().then(data => {
            setStats(data._stats);
            setUsers(data._users);
            setShowingData(data._users);
            // setTableData(data.users);
        });
    }, []);

    useEffect(() => {
        if (users.length > 0 && capability) {
            let data = [];
            data = showingData.map(user => {
                if (capability) {
                    // const _cap = _.camelCase(capability);
                    const _cap = capability;
                    user.capability = {
                        name: capability,
                        value: numeral(user[_cap].percentage / user[_cap].levels).format('0,0.[00]')
                    };

                    let category = '';
                    for (const _grade of grades) {
                        if ((_grade.start - 1) < user.capability.value && (_grade.end + 1) > user.capability.value) {
                            category = _.startCase(_grade.name);
                            break;
                        }
                    }

                    user.category = category;
                }

                return user;
            }).filter(user => {
                let result = true;

                if (capability) {
                    result = result && user.capability.name === capability;
                }
                if (categories.length > 0) {
                    result = result && categories.includes(user.category);
                }
                if (departments.length > 0) {
                    result = result && departments.includes(user.department);
                }
                if (regions.length > 0) {
                    result = result && regions.includes(user.region);
                }

                return result;
            });

            setTableData(data);
        } else {
            setTableData([]);
        }
    }, [capability, categories, departments, regions, showingData]);

    useEffect(() => {
        if (users.length > 0) {
            
            if (showing === 'completed') {
                const _data = users.filter(user => user.completedOnce);
                setShowingData(_data);
            } else {
                setShowingData(users);
            }
        }
    }, [showing]);

    // stats -> capability1 -> [{user: dicota@geniteam.pk, percentage: 200, levels: 2}]

    const getUsersData = async () => {
        const _stats = {}, _users = [];
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach((doc) => {
            if (doc.id !== 'analytics') {
                const userData = doc.data();
                const user = {id: doc.id};
                // _users.push({id: doc.id, ...userData});

                Object.keys(userData.capabilities).map(capabilityName => {
                    const capability = userData.capabilities[capabilityName];
                    const userObject = {user: doc.id, percentage: 0, levels: 0};

                    // if (capability.status && capability.scores) {
                    if (capability.scores) {
                        if (!_stats[capabilityName]) {
                            _stats[capabilityName] = [];
                        }

                        Object.keys(capability.scores).map(levelName => {
                            if (capability.scores[levelName].totalQuestions > 0) {
                                userObject.percentage += capability.scores[levelName].percentage;
                                userObject.levels++;
                            }
                        });
                        // 
                        _stats[capabilityName].push(userObject);
                        user[capabilityName] = userObject;
                    }
                });
                _users.push({
                    id: doc.id, ...user,
                    name: userData.name,
                    email: userData.email,
                    department: userData.department,
                    region: userData.region,
                    completedOnce: userData.completedOnce
                });
            }
        });

        return {_stats: _stats, _users: _users};
    }

    const getMetaData = async () => {
        const docRef = doc(utilRef, 'meta');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }

        return {};
    }

    return (
        <>
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">

            </div>
            <Container className="mt--9" fluid>
                <Row>
                    {
                        grades.map(grade => (
                            <Col lg={3} md={6} className="mb-4">
                                <Card className="bg-secondary shadow">
                                    <CardHeader
                                        className="bg-white border-0">
                                        <p className="text-muted small mb-0">Users</p>
                                        <h2 className="mb-0">{_.startCase(grade.name)}</h2>
                                    </CardHeader>
                                    <CardBody>
                                        {
                                            Object.keys(stats).map(capabilityName => (
                                                <div className="d-flex justify-content-between mb-0">
                                                    <p className="text-muted mb-0">{_.startCase(capabilityName)}</p>
                                                    <p className="text-primary font-weight-bold mb-0">{
                                                        stats[capabilityName].filter(user => {
                                                            const percentage = user.percentage / user.levels;
                                                            return (grade.start - 1) < percentage && (grade.end + 1) > percentage;
                                                        }).length || '-'
                                                    }</p>
                                                </div>
                                            ))
                                        }
                                    </CardBody>
                                </Card>
                            </Col>
                        ))
                    }
                </Row>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">Filters</h2>
                                <div className="d-flex justify-content-start">
                                    <label htmlFor="site_state"
                                           className={classNames('fw-bold', {'text-muted': showing !== 'all'})}>
                                        All Users
                                        {/*<span className="badge bg-primary small ms-2">discounted</span>*/}
                                    </label>
                                    <label className="switch mx-2">
                                        <input id="site_state" type="checkbox" onChange={({target}) => {
                                            target.checked ? setShowing('completed') : setShowing('all')
                                        }}/>
                                        <span className="switch-slider always-on round"/>
                                    </label>
                                    {/*<div className="form-check form-switch" style={{paddingLeft: 0}}>*/}
                                    {/*    <input type="checkbox" className="form-check-input always-on-switch" id="site_state"*/}
                                    {/*           onChange={({target}) => {*/}
                                    {/*               target.checked ? setShowing('all') : setShowing('completed')*/}
                                    {/*           }}*/}
                                    {/*    />*/}
                                    {/*</div>*/}
                                    <label htmlFor="site_state"
                                           className={classNames('fw-bold', {'text-muted': showing !== 'completed'})}>
                                        Only Completed
                                    </label>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col>
                                        <Row>
                                            <Col lg={3}>
                                                <h5 className="text-muted">Competency</h5>
                                                <Multiselect
                                                    className="form-control-alternative mb-1"
                                                    isObject={false}
                                                    showArrow={true}
                                                    selectionLimit={1}
                                                    placeholder="Search"
                                                    options={capabilitiesData.map(data => _.startCase(data))}
                                                    closeIcon="cancel"
                                                    onSelect={(list, item) => setCapability(capabilitiesData.find(_cap => item === _.startCase(_cap)))}
                                                    onRemove={(list, item) => setCapability(null)}
                                                    style={multiselectDropdownStyle}
                                                />
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <p className="mb-0 small text-muted">Required</p>
                                                    <p className="mb-0 small text-muted">Single Select</p>
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <h5 className="text-muted">Category</h5>
                                                <Multiselect
                                                    className="form-control-alternative mb-1"
                                                    isObject={false}
                                                    showArrow={true}
                                                    placeholder="Search"
                                                    options={gradesData.map(data => _.startCase(data))}
                                                    closeIcon="cancel"
                                                    onSelect={(list, item) => setCategories([...categories, item])}
                                                    onRemove={(list, item) => setCategories(categories.filter(i => i !== item))}
                                                    style={multiselectDropdownStyle}
                                                />
                                                <p className="mb-0 small text-muted float-right">Multi Select</p>
                                            </Col>
                                            <Col lg={3}>
                                                <h5 className="text-muted">Department</h5>
                                                <Multiselect
                                                    className="form-control-alternative mb-1"
                                                    isObject={false}
                                                    showArrow={true}
                                                    placeholder="Search"
                                                    options={departmentsData}
                                                    closeIcon="cancel"
                                                    onSelect={(list, item) => setDepartments([...departments, item])}
                                                    onRemove={(list, item) => setDepartments(departments.filter(i => i !== item))}
                                                    style={multiselectDropdownStyle}
                                                />
                                                <p className="mb-0 small text-muted float-right">Multi Select</p>
                                            </Col>
                                            <Col lg={3}>
                                                <h5 className="text-muted">Region</h5>
                                                <Multiselect
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
                                        </Row>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            {/*<CardHeader className="border-0">*/}
                            {/*    <h2 className="mb-0">Leaderboard</h2>*/}
                            {/*</CardHeader>*/}
                            <DataTable
                                columns={[
                                    {name: 'Name', wrap: true, minWidth: '20%', selector: row => row.name},
                                    {name: 'Email', wrap: true, minWidth: '25%', selector: row => row.email},
                                    {
                                        name: 'Competency', wrap: true, minWidth: '20%', cell: row => (
                                            `${row.capability.name} - ${row.capability.value}%`
                                        )
                                    },
                                    {name: 'Category', wrap: true, selector: row => row.category},
                                    {name: 'Department', wrap: true, selector: row => row.department},
                                    {name: 'Region', wrap: true, selector: row => row.region},
                                ]}
                                data={tableData}
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