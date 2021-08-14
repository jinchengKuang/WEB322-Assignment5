const Sequelize = require("sequelize");
const sequelize = new Sequelize(
	"dairsb0vpggpia",
	"lpwplmpjhvgxhs",
	"19205354b1acbaee6e30181d25a6158f792930f41a4430f42d554b9f0e7816f4",
	{
		host: "ec2-52-86-2-228.compute-1.amazonaws.com",
		dialect: "postgres",
		port: 5432,
		dialectOptions: {
			ssl: { rejectUnauthorized: false }
		}
	}
);

// define Employee
let Employee = sequelize.define(
	"Employee",
	{
		employeeNum: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		firstName: Sequelize.STRING,
		lastName: Sequelize.STRING,
		email: Sequelize.STRING,
		SSN: Sequelize.STRING,
		addressStreet: Sequelize.STRING,
		addressCity: Sequelize.STRING,
		addressState: Sequelize.STRING,
		addressPostal: Sequelize.STRING,
		maritalStatus: Sequelize.STRING,
		isManager: Sequelize.BOOLEAN,
		employeeManagerNum: Sequelize.INTEGER,
		status: Sequelize.STRING,
		hireDate: Sequelize.STRING
	},
	{
		createdAt: false, // disable createdAt
		updatedAt: false // disable updatedAt
	}
);

// define Department
let Department = sequelize.define(
	"Department",
	{
		departmentId: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		departmentName: Sequelize.STRING
	},
	{
		createdAt: false, // disable createdAt
		updatedAt: false // disable updatedAt
	}
);

// Relationship
Department.hasMany(Employee, { foreignKey: "department" });

// Initialize
module.exports.initialize = function () {
	return new Promise(function (resolve, reject) {
		sequelize
			.sync()
			.then(() => {
				resolve();
			})
			.catch(() => {
				reject("unable to sync the database");
				return;
			});
	});
};

// Create employee
module.exports.addEmployee = function (employeeData) {
	employeeData.isManager = employeeData.isManager ? true : false;
	for (const property in employeeData) {
		if (employeeData[property] == "") {
			employeeData[property] = null;
		}
	}
	return new Promise(function (resolve, reject) {
		Employee.create({
			firstName: employeeData.firstName,
			lastName: employeeData.lastName,
			email: employeeData.email,
			SSN: employeeData.SSN,
			addressStreet: employeeData.addressStreet,
			addressCity: employeeData.addressCity,
			addressState: employeeData.addressState,
			addressPostal: employeeData.addressPostal,
			maritalStatus: employeeData.maritalStatus,
			isManager: employeeData.isManager,
			employeeManagerNum: employeeData.employeeManagerNum,
			status: employeeData.status,
			hireDate: employeeData.hireDate,
			department: employeeData.department
		})
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject("unable to create employee");
				return;
			});
	});
};

// Read all employees
module.exports.getAllEmployees = function () {
	return new Promise(function (resolve, reject) {
		Employee.findAll({
			order: ["employeeNum"]
		})
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject("no results returned");
				return;
			});
	});
};

// Read by employee number
module.exports.getEmployeeByNum = function (num) {
	return new Promise(function (resolve, reject) {
		Employee.findAll({
			where: {
				employeeNum: num
			}
		})
			.then((data) => {
				resolve(data[0]);
			})
			.catch((err) => {
				reject("no results returned");
				return;
			});
	});
};

// Read by employee status
module.exports.getEmployeesByStatus = function (status) {
	return new Promise(function (resolve, reject) {
		Employee.findAll({
			where: {
				status: status
			}
		})
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject("no results returned");
				return;
			});
	});
};

// Read by employee department
module.exports.getEmployeesByDepartment = function (department) {
	return new Promise(function (resolve, reject) {
		Employee.findAll({
			where: {
				department: department
			}
		})
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject("no results returned");
				return;
			});
	});
};

// Read by employee manager
module.exports.getEmployeesByManager = function (manager) {
	return new Promise(function (resolve, reject) {
		Employee.findAll({
			where: {
				employeeManagerNum: manager
			}
		})
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject("no results returned");
				return;
			});
	});
};

// Update employee
module.exports.updateEmployee = function (employeeData) {
	employeeData.isManager = employeeData.isManager ? true : false;
	for (const property in employeeData) {
		if (employeeData[property] == "") {
			employeeData[property] = null;
		}
	}
	return new Promise(function (resolve, reject) {
		Employee.update(
			{
				firstName: employeeData.firstName,
				lastName: employeeData.lastName,
				email: employeeData.email,
				SSN: employeeData.SSN,
				addressStreet: employeeData.addressStreet,
				addressCity: employeeData.addressCity,
				addressState: employeeData.addressState,
				addressPostal: employeeData.addressPostal,
				maritalStatus: employeeData.maritalStatus,
				isManager: employeeData.isManager,
				employeeManagerNum: employeeData.employeeManagerNum,
				status: employeeData.status,
				hireDate: employeeData.hireDate,
				department: employeeData.department
			},
			{
				where: { employeeNum: employeeData.employeeNum }
			}
		)
			.then(() => {
				resolve();
			})
			.catch((err) => {
				reject("unable to update employee");
				return;
			});
	});
};

// Delete employee by number
module.exports.deleteEmployeeByNum = function (empNum) {
	return new Promise(function (resolve, reject) {
		Employee.destroy({
			where: { employeeNum: empNum }
		})
			.then(() => {
				resolve();
			})
			.catch((err) => {
				reject("no results destroyed");
				return;
			});
	});
};

// Create department
module.exports.addDepartment = function (departmentData) {
	for (const property in departmentData) {
		if (departmentData[property] == "") {
			departmentData[property] = null;
		}
	}
	return new Promise(function (resolve, reject) {
		Department.create({
			departmentName: departmentData.departmentName
		})
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject("unable to create department");
				return;
			});
	});
};

// Read all department
module.exports.getDepartments = function () {
	return new Promise(function (resolve, reject) {
		Department.findAll({
			order: ["departmentId"]
		})
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject("no results returned");
				return;
			});
	});
};

// Read department by id
module.exports.getDepartmentById = function (id) {
	return new Promise(function (resolve, reject) {
		Department.findAll({
			where: { departmentId: id }
		})
			.then((data) => {
				resolve(data[0]);
			})
			.catch((err) => {
				reject("no results returned");
				return;
			});
	});
};

// Update department
module.exports.updateDepartment = function (departmentData) {
	for (const property in departmentData) {
		if (departmentData[property] == "") {
			departmentData[property] = null;
		}
	}
	return new Promise(function (resolve, reject) {
		Department.update(
			{
				departmentName: departmentData.departmentName
			},
			{
				where: { departmentId: departmentData.departmentId }
			}
		)
			.then(() => {
				resolve();
			})
			.catch((err) => {
				reject("unable to update department");
				return;
			});
	});
};

// Delete department by id
module.exports.deleteDepartmentById = function (id) {
	return new Promise(function (resolve, reject) {
		Department.destroy({
			where: { departmentId: id }
		})
			.then(() => {
				resolve();
			})
			.catch((err) => {
				reject("no results destroyed");
				return;
			});
	});
};
