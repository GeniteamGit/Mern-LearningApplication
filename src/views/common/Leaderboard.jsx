import {useEffect, useRef, useState} from "react";
import 'firebase/app';
import CsvDownloader from 'react-csv-downloader';
import {collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, where} from "firebase/firestore";
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
    Tooltip
} from "reactstrap";
import DataTable from 'react-data-table-component';
import ReactDatetime from "react-datetime";
import Multiselect from 'multiselect-react-dropdown';
import moment from 'moment';
import numeral from 'numeral';
import {
    firebaseConstants,
    getAchievementBadge,
    getDb,
    getPositionBadge,
    leaderboardExportHeaders,
    multiselectDropdownStyle,
    renderDay
} from "../../util/Constants";
import _ from "lodash";

let timer = null;

const Leaderboard = (props) => {
    const [userCount, setUserCount] = useState(0);
    const [activeUserCount, setActiveUserCount] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeLeaderboard, setActiveLeaderboard] = useState([]);
    const [leaderboardToExport, setLeaderboardToExport] = useState("");
    const [funFacts, setFunFacts] = useState([]);
    const [levelsData, setLevelsData] = useState([]);
    const [departmentsData, setDepartmentsData] = useState([]);
    const [regionsData, setRegionsData] = useState([]);
    const [level, setLevel] = useState(null);
    const [department, setDepartment] = useState(null);
    const [regions, setRegions] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
    const [loadingFunFacts, setLoadingFunFacts] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [lastVisible, setLastVisible] = useState(null);
    const [nameSearchData, setNameSearchData] = useState([]);
    const [emailSearchData, setEmailSearchData] = useState([]);
    const [loadingSearchData, setLoadingSearchData] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(null);

    const searchByNameDropdown = useRef();
    const searchByEmailDropdown = useRef();
    const levelDropdown = useRef();
    const departmentDropdown = useRef();
    const regionDropdown = useRef();

    const db = getDb();
    const usersRef = collection(db, firebaseConstants.dbUsers);
    const utilRef = collection(db, firebaseConstants.dbUtil);
    let totalPages = 1;
    const pagesSeen = [];

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
        getFunFacts().then(data => {
            setFunFacts(data);
            setLoadingFunFacts(false);
        });
    }, []);

    useEffect(async () => {
        if (leaderboard.length < ((rowsPerPage * currentPage) - rowsPerPage + 1)) {
            await getLeaderboard(true, false);
        } else {
            setActiveLeaderboard(leaderboard.slice((currentPage * rowsPerPage) - rowsPerPage, currentPage * rowsPerPage));
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

    const getLeaderboard = async (useLastVisible = true, useConstraints = true) => {
        let data = [], constraints = useConstraints ? getConstraints() : [], order = getOrder(useConstraints),
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
        let startRank = (currentPage * rowsPerPage) - rowsPerPage + 1;

        querySnapshot.docs.forEach((doc, index) => {
            data.push({id: doc.id, ...doc.data()});
            // startRank++;
        });

        data = _.orderBy(data, ['currentScore'], ['desc']);

        data = data.map((doc, index) => {
            doc = {rank: startRank, ...doc}
            startRank++;
            return doc;
        });

        if (useConstraints) {
            setLeaderboard(data);
            setActiveLeaderboard(data.slice((currentPage * rowsPerPage) - rowsPerPage, currentPage * rowsPerPage));
            setActiveUserCount(data.length);
        } else {
            const count = await getAnalytics();
            setActiveUserCount(count);
            setLeaderboard([...leaderboard, ...data]);
            setActiveLeaderboard(data);
        }

        setNameSearchData(data.map(_data => ({
            value: <span>{_data.name} - <span className="">{_data.id}</span></span>,
            rank: 1, id: _data.id, ..._data
        })));

        setEmailSearchData(data.map(_data => ({
            value: <span>{_data.name} - <span className="">{_data.id}</span></span>,
            rank: 1, id: _data.id, ..._data
        })));

        setLoadingLeaderboard(false);
    }

    const getFunFacts = async () => {
        const q = query(usersRef, orderBy('achievementCount', 'desc'), limit(5)), data = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            data.push({id: doc.id, ...doc.data()});
        });

        return data;
    }

    const applyFilters = () => {
        setLoadingLeaderboard(true);
        setLastVisible(null);
        setLeaderboard([]);
        setActiveLeaderboard([]);
        setActiveUserCount(0);

        searchByNameDropdown.current.resetSelectedValues();
        searchByEmailDropdown.current.resetSelectedValues();

        getLeaderboard(false, true).then(r => {
        })
    }

    const clearFilters = () => {
        setLevel(null);
        setDepartment(null);
        setRegions([]);
        setStartDate(null);
        setEndDate(null);

        setLoadingLeaderboard(true);
        setLastVisible(null);
        setLeaderboard([]);
        setActiveLeaderboard([]);
        setActiveUserCount(0);

        searchByNameDropdown.current.resetSelectedValues();
        searchByEmailDropdown.current.resetSelectedValues();
        levelDropdown.current.resetSelectedValues();
        departmentDropdown.current.resetSelectedValues();
        regionDropdown.current.resetSelectedValues();

        getLeaderboard(false, false).then(r => {
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

    const getOrder = (useConstraints = true) => {
        if (useConstraints) {
            const order = [];
            if (startDate || endDate) {
                order.push(orderBy('lastUpdated'));
            }
            order.push(orderBy('currentScore', 'desc'));
            return order;
        } else {
            return [orderBy('currentScore', 'desc')]
        }
    }

    const handleSearch = async (searchText, searchBy) => {
        const constraints = getConstraints();
        let userData = [];

        if (constraints.length > 0) { // constraints applied
            const unsortedData = leaderboard
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
                    rank: 1, id: doc.id, ...data
                });
            });
        }

        userData = userData.filter(_data => _data[`${searchBy}_insensitive`].startsWith(searchText.toLowerCase()));

        searchBy === 'name' ? setNameSearchData(userData) : setEmailSearchData(userData);
        setLoadingSearchData(false);
    }

    const removeSearch = (list, item) => {
        if (getConstraints().length > 0) {
            setActiveLeaderboard(leaderboard.slice((currentPage * rowsPerPage) - rowsPerPage, currentPage * rowsPerPage));
            setActiveUserCount(leaderboard.length);
        } else {
            setActiveLeaderboard(leaderboard);
            setActiveUserCount(userCount);
        }
    }

    const exportToCSV = async () => {
        let data = [], constraints = getConstraints(), order = getOrder(false);

        if (constraints.length === 0) {
            // get all data from DB
            const q = query(usersRef, ...order);
            const querySnapshot = await getDocs(q);

            querySnapshot.docs.forEach((doc, index) => {
                const userData = doc.data();
                data.push({
                    ...userData,
                    rank: index + 1,
                    id: doc.id,
                    lastUpdated: moment(userData.lastUpdated).format('DD/MMM/YY HH:mm')
                });
            });

            
        } else {
            // data is already fetched
            data = leaderboard.map(_user => ({
                ..._user,
                lastUpdated: moment(_user.lastUpdated).format('DD/MMM/YY HH:mm')
            }));
            
        }
        return data;
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
                                                <h5 className="text-muted">From</h5>
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
                                                <h5 className="text-muted">To</h5>
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
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h2 className="mb-0">Leaderboard</h2>
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
                                                setActiveLeaderboard([item]);
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
                                        {/*<CSVLink*/}
                                        {/*    headers={leaderboardExportHeaders}*/}
                                        {/*    data={leaderboardToExport}*/}
                                        {/*    asyncOnClick={true}*/}
                                        {/*    onClick={exportToCSV}*/}
                                        {/*    filename={"Progress-leaderboard2.csv"}*/}
                                        {/*    className="btn btn-default"*/}
                                        {/*    target="_blank"*/}
                                        {/*>*/}
                                        {/*    Download CSV*/}
                                        {/*</CSVLink>*/}
                                        <CsvDownloader
                                            className="btn btn-default"
                                            filename="Progress-leaderboard"
                                            columns={leaderboardExportHeaders}
                                            datas={exportToCSV}
                                            text="Download CSV"/>
                                    </Col>
                                </Row>
                            </CardHeader>
                            <DataTable
                                columns={[
                                    {name: 'Rank', center: true, width: '100px', selector: row => row.rank},
                                    {name: 'Name', wrap: true, minWidth: '15%', selector: row => row.name},
                                    {name: 'Email', wrap: true, minWidth: '15%', selector: row => row.email},
                                    {
                                        name: 'Progress',
                                        width: '130px',
                                        selector: row => row.currentLevel,
                                        cell: row => {
                                            return (
                                                <>
                                                    {row.completed ?
                                                        <span>Completed</span> :
                                                        <span>In-progress/{row.currentLevel}</span>}
                                                </>
                                            )
                                        }
                                    },
                                    {
                                        name: 'Completed',
                                        center: true,
                                        width: '120px',
                                        selector: row => row.completedOnce,
                                        cell: row => {
                                            return (
                                                <div className="text-center">
                                                    {
                                                        row.completedOnce ?
                                                            <div>
                                                                <i className="fas fa-check text-success"/> <span
                                                                className="mx-1">&#9679;</span> {numeral(row.lastCompletedScore).format('0,0')}
                                                            </div> :
                                                            <i className="fas fa-times text-danger"/>
                                                    }
                                                </div>
                                            )
                                        }
                                    },
                                    {
                                        name: 'Score',
                                        width: '100px',
                                        center: true,
                                        selector: row => numeral(row.currentScore).format('0,0')
                                    },
                                    {
                                        name: 'Tries',
                                        center: true,
                                        width: '100px',
                                        selector: row => row.attempts,
                                        format: row => numeral(row.attempts).format('0,0')
                                    },
                                    {
                                        name: 'Last Updated', wrap: true, width: '150px',
                                        selector: row => row.lastUpdated,
                                        format: row => moment(row.lastUpdated).format('DD/MMM/YY, HH:MM')
                                    },
                                    {
                                        name: 'Achievements', width: '180px',
                                        selector: row => row.achievements,
                                        format: row => {
                                            return (
                                                <div className="d-flex justify-content-start align-items-center">
                                                    {
                                                        Object.keys(row.achievements).map((achievementName, index) => (
                                                            // funFact.achievements[achievementName]
                                                            <>
                                                                {
                                                                    row.achievements[achievementName] > 0 &&
                                                                    <div className="badge-item mr-2"
                                                                         key={`leaderboard_${achievementName}`}>
                                                                        <span
                                                                            className="counter-badge">{row.achievements[achievementName]}</span>
                                                                        <img
                                                                            className="mr-2"
                                                                            alt="..."
                                                                            id={`achievementBadge_${achievementName}_${row.rank}`}
                                                                            src={getAchievementBadge(achievementName)}
                                                                            style={{
                                                                                height: '30px',
                                                                                width: 'auto'
                                                                            }}
                                                                        />
                                                                        <Tooltip placement="top"
                                                                                 isOpen={tooltipOpen === `${achievementName}_${row.rank}`}
                                                                                 target={`achievementBadge_${achievementName}_${row.rank}`}
                                                                                 toggle={() => setTooltipOpen(tooltipOpen === `${achievementName}_${row.rank}` ? null : `${achievementName}_${row.rank}`)}>
                                                                            {_.startCase(achievementName)}
                                                                        </Tooltip>
                                                                    </div>
                                                                }
                                                            </>
                                                        ))
                                                    }
                                                </div>
                                            )
                                        }
                                    },
                                ]}
                                data={activeLeaderboard}
                                progressPending={loadingLeaderboard}
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
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0">
                                <h2 className="mb-0">Fun Facts</h2>
                            </CardHeader>
                            <DataTable
                                columns={[
                                    {
                                        name: '', width: '5%', selector: row => '',
                                        cell: (row, index) => {
                                            return (
                                                <img
                                                    className="mr-3"
                                                    alt="..."
                                                    src={
                                                        getPositionBadge(index + 1)
                                                    }
                                                    style={{height: '30px', width: 'auto'}}
                                                />
                                            )
                                        }
                                    },
                                    {name: 'Name', selector: row => row.name},
                                    {name: 'Email', selector: row => row.email},
                                    {
                                        name: 'Achievements',
                                        selector: row => row.achievements,
                                        cell: row => {
                                            return (
                                                Object.keys(row.achievements).map((achievementName, index) => (
                                                    // funFact.achievements[achievementName]
                                                    <>
                                                        {
                                                            row.achievements[achievementName] > 0 &&
                                                            <div className="badge-item mr-2"
                                                                 key={`leaderboard_${achievementName}`}>
                                                                <span
                                                                    className="counter-badge">{row.achievements[achievementName]}</span>
                                                                <img
                                                                    className="mr-2"
                                                                    alt="..."
                                                                    id={`achievementBadge_${achievementName}_${index}_ff`}
                                                                    src={getAchievementBadge(achievementName)}
                                                                    style={{
                                                                        height: '30px',
                                                                        width: 'auto'
                                                                    }}
                                                                />
                                                                <Tooltip placement="top"
                                                                         isOpen={tooltipOpen === `${achievementName}_${index}_ff`}
                                                                         target={`achievementBadge_${achievementName}_${index}_ff`}
                                                                         toggle={() => setTooltipOpen(tooltipOpen === `${achievementName}_${index}_ff` ? null : `${achievementName}_${index}_ff`)}>
                                                                    {_.startCase(achievementName)}
                                                                </Tooltip>
                                                            </div>
                                                        }
                                                    </>
                                                ))
                                            )
                                        }
                                    },
                                ]}
                                data={funFacts}
                                progressPending={loadingFunFacts}
                                responsive
                                highlightOnHover
                            />
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default Leaderboard;