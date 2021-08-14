/*********************************************************************************
 *  WEB322 – Assignment 05
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part of this
 *  assignment has been copied manually or electronically from any other source (including web sites) or
 *  distributed to other students.
 *
 *  Name: Jincheng Kuang Student ID: 152867164 Date: August 13, 2021
 *
 *  Online (Heroku) Link: https://web322-assignment4-jkuang10.herokuapp.com/
 *
 ********************************************************************************/

const express = require("express");
const path = require("path");
const dataService = require("./data-service.js");
const bodyParser = require("body-parser");
const fs = require("fs");
const multer = require("multer");
const app = express();
const exphbs = require("express-handlebars");
const clientSessions = require("client-sessions");
const dataServiceAuth = require("./data-service-auth.js");

app.engine(
	".hbs",
	exphbs({
		extname: ".hbs",
		helpers: {
			navLink: function (url, options) {
				return "<li" + (url == app.locals.activeRoute ? ' class="active" ' : "") + '><a href="' + url + '">' + options.fn(this) + "</a></li>";
			},
			equal: function (lvalue, rvalue, options) {
				if (arguments.length < 3) throw new Error("Handlebars Helper equal needs 2 parameters");
				if (lvalue != rvalue) {
					return options.inverse(this);
				} else {
					return options.fn(this);
				}
			}
		}
	})
);
app.set("view engine", ".hbs");

const HTTP_PORT = process.env.PORT || 8080;

// multer requires a few options to be setup to store files with file extensions
// by default it won't store extensions for security reasons
const storage = multer.diskStorage({
	destination: "./public/images/uploaded",
	filename: function (req, file, cb) {
		// we write the filename as the current date down to the millisecond
		// in a large web service this would possibly cause a problem if two people
		// uploaded an image at the exact same time. A better way would be to use GUID's for filenames.
		// this is a simple example.
		cb(null, Date.now() + path.extname(file.originalname));
	}
});

// tell multer to use the diskStorage function for naming files instead of the default.
const upload = multer({ storage: storage });

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// initialize
dataService
	.initialize()
	.then(dataServiceAuth.initialize)
	.then(function () {
		app.listen(HTTP_PORT, function () {
			console.log("app listening on: " + HTTP_PORT);
		});
	})
	.catch(function (err) {
		console.log("unable to start server: " + err);
	});

// Setup client-sessions
app.use(
	clientSessions({
		cookieName: "session", // this is the object name that will be added to 'req'
		secret: "web322_a5", // this should be a long un-guessable string.
		duration: 20 * 60 * 1000, // duration of the session in milliseconds (20 minutes)
		activeDuration: 1000 * 600 // the session will be extended by this many ms each request (10 minute)
	})
);

app.use(function (req, res, next) {
	let route = req.baseUrl + req.path;
	app.locals.activeRoute = route == "/" ? "/" : route.replace(/\/$/, "");
	next();
});

// middleware to access session object
app.use(function (req, res, next) {
	res.locals.session = req.session;
	next();
});

// helper middleware function that checks if a user is logged in
function ensureLogin(req, res, next) {
	if (!req.session.user) {
		res.redirect("/login");
	} else {
		next();
	}
}

// GET root page
app.get("/", (req, res) => {
	res.render("home");
});

// GET about page
app.get("/about", (req, res) => {
	res.render("about");
});

// GET image page
app.get("/images", ensureLogin, (req, res) => {
	fs.readdir("./public/images/uploaded", function (err, items) {
		res.render("images", { images: items });
	});
});

// GET add image page
app.get("/images/add", ensureLogin, (req, res) => {
	res.render("addImage");
});

// GET add employee page
app.get("/employees/add", ensureLogin, (req, res) => {
	dataService
		.getDepartments()
		.then((data) => {
			console.log(data);
			res.render("addEmployee", { departments: data });
		})
		.catch((err) => {
			res.render("addEmployee", { departments: null });
		});
});

// GET add department page
app.get("/departments/add", ensureLogin, (req, res) => {
	res.render("addDepartment");
});

// GET employees page
app.get("/employees", ensureLogin, (req, res) => {
	if (req.query.status) {
		dataService.getEmployeesByStatus(req.query.status).then((data) => {
			if (data.length > 0) {
				res.render("employees", { employees: data });
			} else {
				res.render("employees", { message: "no results" });
			}
		});
	} else if (req.query.department) {
		dataService.getEmployeesByDepartment(req.query.department).then((data) => {
			if (data.length > 0) {
				res.render("employees", { employees: data });
			} else {
				res.render("employees", { message: "no results" });
			}
		});
	} else if (req.query.manager) {
		dataService
			.getEmployeesByManager(req.query.manager)
			.then((data) => {
				if (data.length > 0) {
					res.render("employees", { employees: data });
				} else {
					res.render("employees", { message: "no results" });
				}
			})
			.catch((err) => {
				res.render("employees", { message: "no results" });
			});
	} else {
		dataService
			.getAllEmployees()
			.then((data) => {
				if (data.length > 0) {
					res.render("employees", { employees: data });
				} else {
					res.render("employees", { message: "no results" });
				}
			})
			.catch((err) => {
				res.render("employees", { message: "no results" });
			});
	}
});

// GET employee number page
app.get("/employee/:empNum", ensureLogin, (req, res) => {
	// initialize an empty object to store the values
	let viewData = {};
	dataService
		.getEmployeeByNum(req.params.empNum)
		.then((data) => {
			if (data) {
				viewData.employee = data; //store employee data in the "viewData" object as "employee"
			} else {
				viewData.employee = null; // set employee to null if none were returned
			}
		})
		.catch(() => {
			viewData.employee = null; // set employee to null if there was an error
		})
		.then(dataService.getDepartments)
		.then((data) => {
			viewData.departments = data; // store department data in the "viewData" object as "departments"
			// loop through viewData.departments and once we have found the departmentId that matches
			// the employee's "department" value, add a "selected" property to the matching
			// viewData.departments object
			for (let i = 0; i < viewData.departments.length; i++) {
				if (viewData.departments[i].dataValues.departmentId == viewData.employee.dataValues.department) {
					viewData.departments[i].selected = true;
				}
			}
		})
		.catch(() => {
			viewData.departments = []; // set departments to empty if there was an error
		})
		.then(() => {
			if (viewData.employee == null) {
				// if no employee - return an error
				res.status(404).send("Employee Not Found");
			} else {
				res.render("employee", { data: viewData }); // render the "employee" view
			}
		});
});

// GET delete employee number page
app.get("/employees/delete/:empNum", ensureLogin, (req, res) => {
	dataService
		.deleteEmployeeByNum(req.params.empNum)
		.then(() => {
			res.redirect("/employees");
		})
		.catch((err) => {
			res.status(500).send("Unable to Remove Employee / Employee not found)");
		});
});

// GET departments page
app.get("/departments", ensureLogin, (req, res) => {
	dataService
		.getDepartments()
		.then((data) => {
			if (data.length > 0) {
				res.render("departments", { departments: data });
			} else {
				res.render("departments", { message: "no results" });
			}
		})
		.catch((err) => {
			res.render("departments", { message: "no results" });
		});
});

// GET department id page
app.get("/department/:departmentId", ensureLogin, (req, res) => {
	dataService
		.getDepartmentById(req.params.departmentId)
		.then((data) => {
			console.log(data);
			res.render("department", { department: data });
		})
		.catch((err) => {
			res.status(404).send("Department Not Found");
		});
});

// GET delete department id page
app.get("/departments/delete/:departmentId", ensureLogin, (req, res) => {
	dataService
		.deleteDepartmentById(req.params.departmentId)
		.then(() => {
			res.redirect("/departments");
		})
		.catch((err) => {
			res.status(500).send("Unable to Remove Department / Department not found)");
		});
});

// POST add department page
app.post("/departments/add", ensureLogin, (req, res) => {
	dataService
		.addDepartment(req.body)
		.then(() => {
			res.redirect("/departments");
		})
		.catch((err) => {
			res.status(500).send("Unable to Add Department");
		});
});

// POST add employee page
app.post("/employees/add", ensureLogin, (req, res) => {
	dataService
		.addEmployee(req.body)
		.then(() => {
			res.redirect("/employees");
		})
		.catch((err) => {
			res.status(500).send("Unable to Add Employee");
		});
});

// POST add image page
app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res) => {
	res.redirect("/images");
});

// POST update employee page
app.post("/employee/update", ensureLogin, (req, res) => {
	dataService
		.updateEmployee(req.body)
		.then(() => {
			res.redirect("/employees");
		})
		.catch((err) => {
			res.status(500).send("Unable to Update Employee");
		});
});

// POST update department page
app.post("/department/update", ensureLogin, (req, res) => {
	dataService
		.updateDepartment(req.body)
		.then(() => {
			res.redirect("/departments");
		})
		.catch((err) => {
			res.status(500).send("Unable to Update Department");
		});
});

// GET login page
app.get("/login", (req, res) => {
	res.render("login");
});

// GET register page
app.get("/register", (req, res) => {
	res.render("register");
});

// POST register page
app.post("/register", (req, res) => {
	dataServiceAuth
		.registerUser(req.body)
		.then(() => {
			res.render("register", { successMessage: "User created" });
		})
		.catch((err) => {
			res.render("register", {
				errorMessage: err,
				userName: req.body.userName
			});
		});
});

// POST login page
app.post("/login", (req, res) => {
	req.body.userAgent = req.get("User-Agent");
	dataServiceAuth
		.checkUser(req.body)
		.then((user) => {
			req.session.user = {
				userName: user.userName,
				email: user.email,
				loginHistory: user.loginHistory
			};
			res.redirect("/employees");
		})
		.catch((err) => {
			res.render("login", { errorMessage: err, userName: req.body.userName });
		});
});

// GET logout
app.get("/logout", (req, res) => {
	req.session.reset();
	res.redirect("/");
});

// GET userHistory page
app.get("/userHistory", ensureLogin, (req, res) => {
	res.render("userHistory");
});

// 404
app.use((req, res) => {
	res.status(404).send("Page Not Found");
});
