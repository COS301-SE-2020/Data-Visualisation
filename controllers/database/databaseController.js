require('dotenv').config();
const PRODUCTION = process.env.NODE_ENV && process.env.NODE_ENV === 'production' ? true : false;

const Pool = require('pg-pool');
const params = require('url').parse(process.env.DATABASE_URL);
const auth = params.auth.split(':');

const bcrypt = require('bcryptjs');
const saltRounds = 12;

const config = {
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split('/')[1],
  ssl: {
    rejectUnauthorized: false,
  },
};

class Database {
  static sendQuery(SQL_query) {
    if (!PRODUCTION) console.log(SQL_query);
    return new Promise((conResolve, conReject) => {
      Database.pg_pool
        .connect()
        .then((client) => {
          client
            .query(SQL_query)
            .then((res) => {
              client.release();
              if (typeof res === 'undefined') conReject(DBerror(UndefinedResponseFromDBerror()));
              else conResolve(res);
            })
            .catch((err) => {
              client.release();
              conReject(DBerror(err));
            });
        })
        .catch((err) => conReject(DBerror(err)));
    });
  }

  //==================USERS===============
  static authenticate(email, password) {
    return new Promise((resolve, reject) => {
      console.log('==> AUTHENTICATING: ' + email);
      Database.sendQuery(`SELECT * FROM Users WHERE( email = '${email}');`)
        .then((result) => {
          if (typeof result !== 'undefined' && result.command === 'SELECT') {
            if (result.rows.length > 0 && bcrypt.compareSync(password, result.rows[0].password)) {
              console.log('==> AUTHENTICATION: succesful');
              delete result.rows[0].password;
              resolve(result.rows[0]);
            } else {
              console.log('==> AUTHENTICATION: failed');
              resolve(false);
            }
          } else {
            console.log('==> AUTHENTICATION: error');
            reject(result);
          }
        })
        .catch((err) => reject(err));
    });
  }

  static register(fname, lname, email, password) {
    password = bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds));

    const apikey = generateApiKey();
    console.log('==> REGISTER: ' + email + ' |' + apikey);

    return new Promise((resolve, reject) => {
      Database.sendQuery(
        `INSERT INTO Users (email,firstname,lastname,password,apikey) VALUES('${email}', '${fname}', '${lname}', '${password}', '${apikey}')`
      )
        .then((response) => {
          console.log('REGISTER RESPONSE');
          resolve({ apikey });
        })
        .catch((err) => {
          // console.log(err);
          reject(DBerror(err));
        });
    });
  }

  //==================DATA SOURCE===============
  static async getDataSourceList(email) {
    let query = `SELECT * FROM datasource WHERE ( email = '${email}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }

  static async addDataSource(email, sourceURL) {
    let query = `INSERT INTO datasource (email, sourceurl) VALUES ('${email}','${sourceURL}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }

  static async removeDataSource(email, dataSourceID) {
    let query = `DELETE FROM datasource WHERE ( email = '${email}') AND ( ID = '${dataSourceID}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }

  //==================DASHBOARDS===============
  static async getDashboardList(email) {
    let query = `SELECT * FROM Dashboard WHERE (email = '${email}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }
  static async addDashboard(email, name, desc) {
    let query = `INSERT INTO Dashboard (Name,Description,email) VALUES ('${name}','${desc}','${email}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }
  static async removeDashboard(email, dashboardID) {
    let query = `DELETE FROM Dashboard WHERE ( email = '${email}' ) AND ( ID = '${dashboardID}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }
  static async updateDashboard(email, dashboardID, fields, data) {
    console.log(fields, data);

    let index = -1;
    fields = fields.filter((field, i) => {
      if (field === 'email') {
        index = i;
        return false;
      } else return true;
    });
    if (index >= 0) data.splice(index, 1);

    console.log(fields, data);

    let query = `UPDATE Dashboard SET ${fieldUpdates(
      fields,
      data
    )} WHERE ( email = '${email}' ) AND ( ID = '${dashboardID}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }

  //==================GRAPHS===============
  static async getGraphList(dashboardID) {
    let query = `SELECT g.id, g.dashboardID, g.graphtypeid, t.source
    FROM graph as g join graphtype as t on (g.graphtypeid=t.id)
    WHERE ( g.dashboardID = '${dashboardID}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }
  static async addGraph(dashboardID, GraphTypeID) {
    let query = `INSERT INTO Graph (dashboardID, GraphTypeID) VALUES ('${dashboardID}','${GraphTypeID}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }
  static async removeGraph(GraphID) {
    let query = `DELETE FROM Graph WHERE ( ID = '${GraphID}');`;
    let result = await Database.sendQuery(query);
    return new Promise((resolve, reject) => {
      if (result && result.command === 'DELETE') resolve(result);
      else reject(result);
    });
  }
  static async updateGraph(GraphID, fields, data) {
    let query = `UPDATE Graph SET ${fieldUpdates(fields, data)} WHERE ( ID = '${GraphID}');`;
    return new Promise((resolve, reject) => {
      Database.sendQuery(query)
        .then((result) => resolve(result.rows))
        .catch((result) => reject(result));
    });
  }
}
Database.pg_pool = new Pool(config);

function fieldUpdates(fields, data) {
  let output = '';
  for (let i = 0; i < fields.length; i++) {
    output = output + ` ${fields[i]} = '${data[i]}'${i < fields.length - 1 ? ', ' : ''}`;
  }
  return output;
}
function generateApiKey() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function DBerror(err) {
  let { table, code, routine, hint, detail } = err;
  if (code === '23505') routine = 'userAlreadyExists';
  if (typeof hint === 'undefined') hint = detail;
  return { origin: 'database', table, code, error: routine, hint };
}

function UndefinedResponseFromDBerror() {
  return {
    table: undefined,
    code: undefined,
    routine: 'undefinedResponseFromDatabase',
    hint: undefined,
    detail: 'Query Sent: ' + SQL_query,
  };
}

/*
undefinedResponseFromDatabase
errorMissingColumn
userAlreadyExists
*/

module.exports = Database;
