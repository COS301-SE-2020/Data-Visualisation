const LogAuthUsers = (users) => {
	console.log('=====================================');
	console.log(
		'USERS',
		Object.keys(users).map((key) => `${key} : ${users[key].email}`)
	);
	console.log('=====================================');
};

const LogReqParams = (req) => {
	console.log('=====================================');
	console.log('METHOD\t', req.method);
	console.log('BODY\t', req.body);
	console.log('QUERY\t', req.query);
	console.log('=====================================');
};

module.exports = { LogAuthUsers, LogReqParams };
