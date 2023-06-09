import {useState} from "react";
import {Link, NavLink as NavLinkRRD} from "react-router-dom";
import {PropTypes} from "prop-types";
import {
    Col,
    Collapse,
    Container,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Media,
    Nav,
    Navbar,
    NavbarBrand,
    NavItem,
    NavLink,
    Row,
    UncontrolledDropdown,
} from "reactstrap";
import {getAuth, signOut} from "firebase/auth";

var ps;

const Sidebar = (props) => {
    const [collapseOpen, setCollapseOpen] = useState();

    const auth = getAuth();

    // verifies if routeName is the one active (in browser input)
    const activeRoute = (routeName) => {
        return props.location.pathname.indexOf(routeName) > -1 ? "active" : "";
    };
    // toggles collapse between opened and closed (true/false)
    const toggleCollapse = () => {
        setCollapseOpen((data) => !data);
    };
    // closes the collapse
    const closeCollapse = () => {
        setCollapseOpen(false);
    };
    // creates the links that appear in the left menu / Sidebar
    const createLinks = (routes) => {
        return routes.filter(route => route.display).map((prop, key) => {
            return (
                <NavItem key={key}>
                    <NavLink
                        to={prop.layout + prop.path}
                        tag={NavLinkRRD}
                        onClick={closeCollapse}
                        activeClassName="active"
                    >
                        <i className={prop.icon}/>
                        {prop.name}
                    </NavLink>
                </NavItem>
            );
        });
    };

    const {bgColor, routes, logo} = props;
    let navbarBrandProps;
    if (logo && logo.innerLink) {
        navbarBrandProps = {
            to: logo.innerLink,
            tag: Link,
        };
    } else if (logo && logo.outterLink) {
        navbarBrandProps = {
            href: logo.outterLink,
            target: "_blank",
        };
    }

    return (
        <Navbar
            className="navbar-vertical fixed-left navbar-light bg-white"
            expand="md"
            id="sidenav-main"
        >
            <Container fluid>
                {/* Toggler */}
                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={toggleCollapse}
                >
                    <span className="navbar-toggler-icon"/>
                </button>
                {/* Brand */}
                {logo ? (
                    <>
                        <NavbarBrand className="pt-0" {...navbarBrandProps}>
                            <img
                                alt={logo.imgAlt}
                                className="navbar-brand-img"
                                src={logo.imgSrc}
                            />
                        </NavbarBrand>
                    </>
                ) : null}
                {/* User */}
                <Nav className="align-items-center d-md-none">
                    <UncontrolledDropdown nav>
                        <DropdownToggle className="pr-0" nav>
                            <Media className="align-items-center">
                              <span className="avatar avatar-sm rounded-circle">
                                <img
                                    alt="..."
                                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSex0_2jKFFviUr3QZCCN_v31N5_gF4_U_Z9Q&usqp=CAU"
                                />
                              </span>
                            </Media>
                        </DropdownToggle>
                        <DropdownMenu className="dropdown-menu-arrow" right>
                            <DropdownItem className="noti-title" header tag="div">
                                <h6 className="text-overflow m-0">
                                    <span className="mr-1">Hi,</span>
                                    {
                                        props.signedInUser.name ? props.signedInUser.name :
                                            (props.signedInUser.email && props.signedInUser.email.split('@')[0])
                                    }!
                                </h6>
                            </DropdownItem>
                            <DropdownItem href="#pablo" onClick={(e) => {
                                e.preventDefault();
                                signOut(auth).then(() => {
                                    // Sign-out successful.
                                }).catch((error) => {
                                    // An error happened.
                                });
                            }}>
                                <i className="ni ni-user-run"/>
                                <span>Logout</span>
                            </DropdownItem>
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </Nav>
                {/* Collapse */}
                <Collapse navbar isOpen={collapseOpen}>
                    {/* Collapse header */}
                    <div className="navbar-collapse-header d-md-none">
                        <Row>
                            {logo ? (
                                <Col className="collapse-brand" xs="6">
                                    {logo.innerLink ? (
                                        <Link to={logo.innerLink}>
                                            <img alt={logo.imgAlt} src={logo.imgSrc}/>
                                        </Link>
                                    ) : (
                                        <a href={logo.outterLink}>
                                            <img alt={logo.imgAlt} src={logo.imgSrc}/>
                                        </a>
                                    )}
                                </Col>
                            ) : null}
                            <Col className="collapse-close" xs="6">
                                <button
                                    className="navbar-toggler"
                                    type="button"
                                    onClick={toggleCollapse}
                                >
                                    <span/>
                                    <span/>
                                </button>
                            </Col>
                        </Row>
                    </div>

                    {/* Form */}
                    {/*<Form className="mt-4 mb-3 d-md-none">*/}
                    {/*  <InputGroup className="input-group-rounded input-group-merge">*/}
                    {/*    <Input*/}
                    {/*      aria-label="Search"*/}
                    {/*      className="form-control-rounded form-control-prepended"*/}
                    {/*      placeholder="Search"*/}
                    {/*      type="search"*/}
                    {/*    />*/}
                    {/*    <InputGroupAddon addonType="prepend">*/}
                    {/*      <InputGroupText>*/}
                    {/*        <span className="fa fa-search" />*/}
                    {/*      </InputGroupText>*/}
                    {/*    </InputGroupAddon>*/}
                    {/*  </InputGroup>*/}
                    {/*</Form>*/}

                    {/* Navigation */}
                    <Nav navbar>{createLinks(routes)}</Nav>

                    {/* Divider */}
                    {/*<hr className="my-3" />*/}

                    <Nav className="mb-md-3" navbar>
                        <NavItem className="active-pro active">
                            <NavLink href="#">
                                <i className="far fa-copyright"/>
                                {new Date().getFullYear()}{" "} <a href="https://activ8games.com" target="_blank"
                                                                   className="ml-1">Activ8Games</a>
                            </NavLink>
                        </NavItem>
                    </Nav>
                </Collapse>
            </Container>
        </Navbar>
    );
};

Sidebar.defaultProps = {
    routes: [{}],
};

Sidebar.propTypes = {
    // links that will be displayed inside the component
    routes: PropTypes.arrayOf(PropTypes.object),
    logo: PropTypes.shape({
        // innerLink is for links that will direct the user within the app
        // it will be rendered as <Link to="...">...</Link> tag
        innerLink: PropTypes.string,
        // outterLink is for links that will direct the user outside the app
        // it will be rendered as simple <a href="...">...</a> tag
        outterLink: PropTypes.string,
        // the image src of the logo
        imgSrc: PropTypes.string.isRequired,
        // the alt for the img
        imgAlt: PropTypes.string.isRequired,
    }),
};

export default Sidebar;
