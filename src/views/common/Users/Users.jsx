import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    FormGroup,
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    Row,
    Spinner
} from "reactstrap";
import {Link, useHistory} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    startAfter,
    updateDoc,
    where
} from "firebase/firestore";
import {firebaseConstants, getDb, multiselectDropdownStyle, renderDay} from "../../../util/Constants";
import DataTable from "react-data-table-component";
import moment from "moment";
import Multiselect from "multiselect-react-dropdown";
import ReactDatetime from "react-datetime";
import _ from "lodash";

let timer = null;

const Users = (props) => {
    const [users, setUsers] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [activeUserCount, setActiveUserCount] = useState(0);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [levelsData, setLevelsData] = useState([]);
    const [departmentsData, setDepartmentsData] = useState([]);
    const [regionsData, setRegionsData] = useState([]);
    const [level, setLevel] = useState(null);
    const [department, setDepartment] = useState(null);
    const [regions, setRegions] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [lastVisible, setLastVisible] = useState(null);
    const [nameSearchData, setNameSearchData] = useState([]);
    const [emailSearchData, setEmailSearchData] = useState([]);
    const [loadingSearchData, setLoadingSearchData] = useState(false);
    const [loading, setLoading] = useState(null);

    const db = getDb();
    const usersRef = collection(db, firebaseConstants.dbUsers);
    const utilRef = collection(db, firebaseConstants.dbUtil);
    const history = useHistory();

    const searchByNameDropdown = useRef();
    const searchByEmailDropdown = useRef();
    const levelDropdown = useRef();
    const departmentDropdown = useRef();
    const regionDropdown = useRef();

    useEffect(() => {
        getMetaData().then(data => {
            setLevelsData(data.levels);
            setDepartmentsData(data.departments);
            setRegionsData(data.regions);
        });
        getAnalytics().then(data => {
            setUserCount(data);
            setActiveUserCount(data);
        });
    }, []);

    useEffect(async () => {
        const selectedName = searchByNameDropdown.current.getSelectedItems();
        const selectedEmail = searchByEmailDropdown.current.getSelectedItems();
        if (selectedName.length === 0 && selectedEmail.length === 0) {
            if (users.length < ((rowsPerPage * currentPage) - rowsPerPage + 1)) {
                await getUsers(true, false);
            } else {
                setActiveUsers(users.slice((currentPage * rowsPerPage) - rowsPerPage, currentPage * rowsPerPage));
            }
        }
    }, [currentPage, rowsPerPage]);

    const getMetaData = async () => {
        let dept = [], levels = [], regions = [];
        const docRef = doc(utilRef, 'meta');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            dept = data.departments ? data.departments : [];
            levels = data.levels ? data.levels : [];
            regions = data.regions ? data.regions : [];
        }

        return {departments: dept, levels: levels, regions: regions};
    }

    const getAnalytics = async () => {
        if (userCount) {
            return userCount
        } else {
            let count = 0;
            const docRef = doc(usersRef, 'analytics');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                count = data.userCount;
            }

            return count;
        }
    }

    const getUsers = async (useLastVisible, useConstraints) => {
        const data = [], constraints = useConstraints ? getConstraints() : [], order = getOrder(useConstraints),
            limits = [];
        let q = null;

        if (constraints.length === 0) {
            limits.push(limit(rowsPerPage))
        }

        if (useLastVisible && lastVisible) {
            q = query(usersRef, ...constraints, ...order,
                startAfter(lastVisible),
                ...limits
            );
        } else {
            q = query(usersRef, ...constraints, ...order,
                ...limits
            );
        }
        const querySnapshot = await getDocs(q);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        querySnapshot.docs.forEach((doc) => {
            data.push({id: doc.id, ...doc.data()});
        });

        // 

        if (useConstraints) {
            setUsers(data);
            setActiveUsers(data.slice((currentPage * rowsPerPage) - rowsPerPage, currentPage * rowsPerPage));
            setActiveUserCount(data.length);
        } else {
            const count = await getAnalytics();
            setActiveUserCount(count);
            setUsers([...users, ...data]);
            setActiveUsers(data);
        }

        setNameSearchData(data.map(_data => ({
            value: <span>{_data.name} - <span className="">{_data.id}</span></span>,
            rank: 1, id: _data.id, ..._data
        })));

        setEmailSearchData(data.map(_data => ({
            value: <span>{_data.name} - <span className="">{_data.id}</span></span>,
            rank: 1, id: _data.id, ..._data
        })));

        setLoadingUsers(false);
    }

    const applyFilters = () => {
        setLoadingUsers(true);
        setLastVisible(null);
        setUsers([]);
        setActiveUsers([]);
        setActiveUserCount(0);

        searchByNameDropdown.current.resetSelectedValues();
        searchByEmailDropdown.current.resetSelectedValues();

        getUsers(false, true).then(r => {
        })
    }

    const clearFilters = () => {
        setLevel(null);
        setDepartment(null);
        setRegions([]);
        setStartDate(null);
        setEndDate(null);

        setLoadingUsers(true);
        setLastVisible(null);
        setUsers([]);
        setActiveUsers([]);
        setActiveUserCount(0);

        searchByNameDropdown.current.resetSelectedValues();
        searchByEmailDropdown.current.resetSelectedValues();
        levelDropdown.current.resetSelectedValues();
        departmentDropdown.current.resetSelectedValues();
        regionDropdown.current.resetSelectedValues();

        getUsers(false, false).then(r => {
        })
    }

    const getConstraints = () => {
        const constraints = [];
        if (level) {
            constraints.push(where('currentLevel', '==', Number(level)));
        }
        if (department) {
            constraints.push(where('department', '==', department));
        }
        if (regions.length > 0) {
            constraints.push(where('region', 'in', regions));
        }
        if (startDate) {
            constraints.push(where('lastUpdated', '>', startDate.valueOf()));
        }
        if (endDate) {
            constraints.push(where('lastUpdated', '<', endDate.valueOf()));
        }
        return constraints;
    }

    const getOrder = (useConstraints) => {
        if (useConstraints) {
            const order = [];
            if (startDate || endDate) {
                order.push(orderBy('lastUpdated'))
            }
            return order;
        } else {
            return [orderBy('name')]
        }
    }

    const handleSearch = async (searchText, searchBy) => {
        const constraints = getConstraints();
        let userData = [];

        if (constraints.length > 0) { // constraints applied
            const unsortedData = users
                .filter(user => user[searchBy].toLowerCase().includes(searchText.toLowerCase()))
                .slice(0, 10)
                .map(user => ({...user, value: <span>{user.name} - <span className="">{user.email}</span></span>}));
            userData = _.orderBy(unsortedData, [searchBy], ['desc']);
        } else {
            const q = query(usersRef,
                where(`${searchBy}_insensitive`, '>=', searchText.toLowerCase()),
                orderBy(`${searchBy}_insensitive`),
                limit(10)
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.docs.forEach((doc) => {
                const data = doc.data();
                userData.push({
                    value: <span>{data.name} - <span className="">{doc.id}</span></span>,
                    id: doc.id, ...data
                });
            });
        }

        userData = userData.filter(_data => _data[`${searchBy}_insensitive`].startsWith(searchText.toLowerCase()));

        searchBy === 'name' ? setNameSearchData(userData) : setEmailSearchData(userData);
        setLoadingSearchData(false);
    }

    const removeSearch = (list, item) => {
        setActiveUsers(users.slice((currentPage * rowsPerPage) - rowsPerPage, currentPage * rowsPerPage));
        setActiveUserCount(userCount);
    }

    return (
        <>
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8"/>
            <Container className="mt--9" fluid>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0">
                                <h2 className="mb-0">Filters</h2>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col lg={7}>
                                        <Row>
                                            <Col md={4}>
                                                <h5 className="text-muted">Level</h5>
                                                <Multiselect
                                                    ref={levelDropdown}
                                                    className="form-control-alternative mb-1"
                                                    isObject={false}
                                                    showArrow={true}
                                                    // singleSelect={true}
                                                    selectionLimit={1}
                                                    placeholder="Search"
                                                    options={levelsData}
                                                    closeIcon="cancel"
                                                    onSelect={(list, item) => setLevel(item)}
                                                    onRemove={(list, item) => setLevel(null)}
                                                    style={multiselectDropdownStyle}
                                                />
                                                <p className="mb-0 small text-muted float-right">Single Select</p>
                                            </Col>
                                            <Col md={4}>
                                                <h5 className="text-muted">Department</h5>
                                                <Multiselect
                                                    ref={departmentDropdown}
                                                    className="form-control-alternative mb-1"
                                                    isObject={false}
                                                    showArrow={true}
                                                    singleSelect={true}
                                                    placeholder="Search"
                                                    options={departmentsData}
                                                    closeIcon="cancel"
                                                    onSelect={(list, item) => setDepartment(item)}
                                                    onRemove={(list, item) => setDepartment(null)}
                                                    style={multiselectDropdownStyle}
                                                />
                                                <p className="mb-0 small text-muted float-right">Single Select</p>
                                            </Col>
                                            <Col md={4}>
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
                                        </Row>
                                    </Col>
                                    <Col lg={5}>
                                        <Row>
                                            <Col xs={6}>
                                                <h5 className="text-muted">Start Date</h5>
                                                <FormGroup>
                                                    <InputGroup className="input-group-alternative">
                                                        <InputGroupAddon addonType="prepend">
                                                            <InputGroupText>
                                                                <i className="ni ni-calendar-grid-58"/>
                                                            </InputGroupText>
                                                        </InputGroupAddon>
                                                        <ReactDatetime
                                                            inputProps={{
                                                                placeholder: "DD/MM/YYYY"
                                                            }}
                                                            timeFormat={false}
                                                            renderDay={(props, currentDate, selectedDate) => renderDay(props, currentDate, selectedDate, startDate, endDate)}
                                                            onChange={e => setStartDate(e)}
                                                        />
                                                    </InputGroup>
                                                </FormGroup>
                                            </Col>
                                            <Col xs={6}>
                                                <h5 className="text-muted">End Date</h5>
                                                <FormGroup>
                                                    <InputGroup className="input-group-alternative">
                                                        <InputGroupAddon addonType="prepend">
                                                            <InputGroupText>
                                                                <i className="ni ni-calendar-grid-58"/>
                                                            </InputGroupText>
                                                        </InputGroupAddon>
                                                        <ReactDatetime
                                                            inputProps={{
                                                                placeholder: "DD/MM/YYYY"
                                                            }}
                                                            timeFormat={false}
                                                            renderDay={(props, currentDate, selectedDate) => renderDay(props, currentDate, selectedDate, startDate, endDate)}
                                                            onChange={e => setEndDate(e.add(24, 'hours'))}
                                                        />
                                                    </InputGroup>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col className="text-right">
                                        <Button
                                            color="danger"
                                            // size="sm"
                                            disabled={!level && !department && regions.length === 0 && !startDate && !endDate}
                                            onClick={clearFilters}
                                        >
                                            Clear
                                        </Button>
                                        <Button
                                            color="primary"
                                            // size="sm"
                                            disabled={!level && !department && regions.length === 0 && !startDate && !endDate}
                                            onClick={applyFilters}
                                        >
                                            Apply
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0 d-md-flex justify-content-md-between">
                                <h2 className="mb-0">Users</h2>
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
                                                setActiveUsers([item]);
                                                setActiveUserCount(1);
                                            }}
                                            onRemove={removeSearch}
                                            onSearch={text => {
                                                // setNameSearchData([]);
                                                clearTimeout(timer);
                                                if (text.length >= 1) {
                                                    setLoadingSearchData(true);
                                                    timer = setTimeout(() => {
                                                        handleSearch(text, 'name').then(r => {
                                                        });
                                                    }, 1000);
                                                } else {
                                                    setLoadingSearchData(false);
                                                }
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
                                                setActiveUsers([item]);
                                                setActiveUserCount(1);
                                            }}
                                            onRemove={removeSearch}
                                            onSearch={text => {
                                                // setEmailSearchData([]);
                                                clearTimeout(timer);
                                                if (text.length >= 1) {
                                                    setLoadingSearchData(true);
                                                    timer = setTimeout(() => {
                                                        handleSearch(text, 'email').then(r => {
                                                        });
                                                    }, 1000);
                                                } else {
                                                    setLoadingSearchData(false);
                                                }
                                            }}
                                            style={multiselectDropdownStyle}
                                        />
                                    </Col>
                                    <Col>
                                        <Link to={"/admin/users/new"} className="btn btn-primary">
                                            Add User
                                        </Link>
                                    </Col>
                                </Row>
                            </CardHeader>
                            <DataTable
                                columns={[
                                    {name: 'Name', wrap: true, selector: row => row.name},
                                    {name: 'Email', selector: row => row.email},
                                    {
                                        name: 'Token Expiry',
                                        center: true,
                                        width: '150px',
                                        selector: row => row.expiryDate,
                                        cell: row => {
                                            return (
                                                <div className="text-center">
                                                    {
                                                     row.canExpire ? 
                                                     
                                                        //"yes expire"
                                                        row.expiryDate ? moment().isBefore(row.expiryDate) ? 
                                                         <div>{moment(row.expiryDate).format('DD/MMM/YYYY')}</div> : 
                                                         
                                                         <div style={{color: "red" }} >{moment(row.expiryDate).format('DD/MMM/YYYY')}</div> :
                                                            // <i className="fas fa-check text-success"/> :
                                                            //<Button
                                                            //size="sm"
                                                    //color={ 'danger' }
                                                    //>
                                                      <i className="fas fa-ban" style={{color:"red"}}/>
                                                    //</Button>
                                                            // <i className="text-danger far fa-trash-alt"/>"no time stamp"
                                                            // <i className="fas fa-times text-danger"/>
                                                    
                                                     : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-infinity" viewBox="0 0 16 16">
                                                     <path d="M5.68 5.792 7.345 7.75 5.681 9.708a2.75 2.75 0 1 1 0-3.916ZM8 6.978 6.416 5.113l-.014-.015a3.75 3.75 0 1 0 0 5.304l.014-.015L8 8.522l1.584 1.865.014.015a3.75 3.75 0 1 0 0-5.304l-.014.015L8 6.978Zm.656.772 1.663-1.958a2.75 2.75 0 1 1 0 3.916L8.656 7.75Z"/>
                                                   </svg>
                                                   
                                                    }
                                                </div>
                                            )
                                        }
                                    },
                                    {
                                        name: 'Active',
                                        center: true,
                                        width: '75px',
                                        selector: row => row.isActive,
                                        cell: row => {
                                            return (
                                                <div className="text-center">
                                                    {
                                                        row.isActive ?
                                                            <i className="fas fa-check text-success"/> :
                                                            <i className="fas fa-times text-danger"/>
                                                    }
                                                </div>
                                            )
                                        }
                                    },
                                    {name: 'Dept.', width: '75px', center: true, selector: row => row.department},
                                    {name: 'Region', width: '100px', center: true, selector: row => row.region},
                                    {
                                        name: 'Last Updated',
                                        width: '150px',
                                        selector: row => row.lastUpdated,
                                        format: row => moment(row.lastUpdated).format('DD/MMM/YYYY, HH:MM')
                                    },
                                    {
                                        name: '',
                                        center: true,
                                        width: '150px',
                                        selector: row => null,
                                        cell: row => (
                                            <div>
                                                {/*<Button*/}
                                                {/*    color="primary"*/}
                                                {/*    size="sm"*/}
                                                {/*    onClick={() => history.push(`users/${row.id}`)}*/}
                                                {/*>*/}
                                                {/*    View*/}
                                                {/*</Button>*/}
                                                <Link to={`users/${encodeURIComponent(row.id)}/edit`}
                                                      className="btn btn-primary btn-sm">
                                                    <i className="fas fa-pen"/>
                                                </Link>
                                                {/*<Button*/}
                                                {/*    color="primary"*/}
                                                {/*    size="sm"*/}
                                                {/*    onClick={() => history.push(`${row.id}/edit`)}*/}
                                                {/*>*/}
                                                {/*    <i className="fas fa-pen"/>*/}
                                                {/*</Button>*/}
                                                <Button
                                                    color={row.isActive ? 'danger' : 'success'}
                                                    size="sm"
                                                    disabled={loading === `blocking_${row.id}`}
                                                    onClick={async () => {
                                                        setLoading(`blocking_${row.id}`);
                                                        await updateDoc(doc(db, 'users', row.id), {
                                                            isActive: !row.isActive
                                                        });

                                                        const index = users.findIndex(obj => obj.id === row.id);
                                                        if (index >= 0) { // loaded from DB
                                                            const data = users;
                                                            data[index].isActive = !data[index].isActive;
                                                            setUsers(data);

                                                            const _newActiveUsers = _.intersectionBy(data, activeUsers, 'id');
                                                            setActiveUsers(_newActiveUsers);
                                                        } else {
                                                            const activeIndex = activeUsers.findIndex(obj => obj.id === row.id);
                                                            const activeData = activeUsers;
                                                            activeData[activeIndex].isActive = !activeData[activeIndex].isActive;
                                                            setActiveUsers(activeData);
                                                        }

                                                        setLoading(null);
                                                    }}
                                                >
                                                    {
                                                        loading === `blocking_${row.id}` ?
                                                            <Spinner
                                                                className="mx-2"
                                                                color={'white'}
                                                                size={'sm'}
                                                            >
                                                                Loading...
                                                            </Spinner> : row.isActive ? <i className="fas fa-ban"/> :
                                                                <i className="fas fa-undo"/>
                                                    }
                                                </Button>
                                                <Button
                                                    color="white"
                                                    size="sm"
                                                    onClick={async () => {
                                                        setLoading(`deleting_${row.id}`);

                                                        await deleteDoc(doc(db, "users", row.id));
                                                        await updateDoc(doc(db, "users", "analytics"), {
                                                            population: increment(-1)
                                                        });

                                                        const index = users.findIndex(obj => obj.id === row.id);
                                                        if (index >= 0) { // loaded from DB
                                                            const data = users.filter(_user => _user.id !== row.id);
                                                            setUsers(data);
                                                            const _newActiveUsers = _.intersectionBy(data, activeUsers, 'id');
                                                            setActiveUsers(_newActiveUsers);
                                                        } else {
                                                            const activeData = activeUsers.filter(_user => _user.id !== row.id);
                                                            setActiveUsers(activeData);
                                                        }

                                                        setLoading(null);
                                                    }}
                                                >
                                                    {
                                                        loading === `deleting_${row.id}` ?
                                                            <Spinner
                                                                className="mx-2"
                                                                color="dark"
                                                                size={'sm'}
                                                            >
                                                                Loading...
                                                            </Spinner> : <i className="text-danger far fa-trash-alt"/>
                                                    }
                                                </Button>
                                            </div>
                                        )
                                    }
                                ]}
                                data={activeUsers}
                                progressPending={loadingUsers}
                                pagination
                                paginationTotalRows={activeUserCount}
                                paginationServer={true}
                                responsive
                                persistTableHead
                                highlightOnHover
                                onChangePage={(page, totalRows) => {
                                    setCurrentPage(page);
                                }}
                                onChangeRowsPerPage={(currentRowsPerPage, currentPage) => {
                                    setRowsPerPage(currentRowsPerPage);
                                }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default Users;