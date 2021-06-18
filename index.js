const mysql = require('mysql');
const express = require('express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI =require('swagger-ui-express')
var app = express();
const bodyparser = require('body-parser');
//const bodyParser = require('body-parser');

app.use(bodyparser.json());

const swaggerOptions={
    definition:{
        openapi:'3.0.0',
        info:{
            title:'Employee details',
            version:'1.0.0',
            description:'Employee details API',
            servers:["http://localhost:3000"]
        }
    },apis:['index.js']
}
const swaggerDocs=swaggerJSDoc(swaggerOptions);
app.use('/swagger',swaggerUI.serve,swaggerUI.setup(swaggerDocs));

/**
 * @swagger
 * definitions:
 *  Employee:
 *   type: object
 *   properties:
 *    EmpId:
 *     type: integer
 *     description: id of employee
 *     example: '001'
 *    Name:
 *     type: string
 *     description: name of employee
 *     example: 'rakesh'
 *    EmpCode:
 *     type:  integer
 *     description: code of employee
 *     example: '007'
 *    Salary:
 *     type: integer
 *     description: salary of employee
 *     example: '2000'
 */

/**
 * @swagger
 * /empolee:
 *  get:
 *   summary: get all employee
 *   description: get all employee
 *   responses:
 *    200:
 *     description: success
 *    500:
 *     description: error
 */


/**
 * @swagger
 * /empolee/2:
 *  get:
 *   summary: get single employee
 *   description: get single employee
 *   parameters:
 *    - in: path
 *      name: empoyee_id
 *      schema:
 *       type: integer
 *      required: true
 *      description: id of employee
 *      example: 2
 *   responses:
 *    200:
 *     description: success
 *    500:
 *     description: error
 */

/**
 * @swagger
 * /empolee/5:
 *  delete:
 *   summary: delete employee
 *   description: delete employee
 *   parameters:
 *    - in: path
 *      name: EmpId
 *      schema:
 *       type: integer
 *      required: true
 *      description: id of the employee
 *   responses:
 *    200:
 *     description: success
 *
 */

/**
 * @swagger
 * /employee/callback:
 *  post:
 *   summary: insert employee
 *   description: create employee
 *   requestBody:
 *    content:
 *     application/json:
 *      schema:
 *       $ref: '#/definitions/Employee'
 *
 *   responses:
 *    200:
 *     description: success
 *    500:
 *     description: failed
 *
 */



var mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'employeedb',
    multipleStatements: true


});
mysqlConnection.connect((err) => {
    if (!err)
        console.log('Db connection succeded.');
    else
        console.log('Db connection failed \n Error:' + JSON.stringify(err, undefined, 2));
});


app.listen(3000, () => console.log('Express server is running at port no :3000'));

// get all employee details
app.get('/empolee', (req, res) => {
    mysqlConnection.query('SELECT * FROM employee', (err, rows, fields) => {
        if (!err) {
            res.send(rows);

        } else
            console.log(err);

    })
});
/*
// get an single
app.get('/empolee/:id', (req, res) => {
    try {

        let query = `SELECT * FROM employee WHERE EmpId= `
        mysqlConnection.query(query, [req.params.id],(err, rows, fields) => {
            if (!err) {
                return res.send(rows);


            } else
                console.log(err);

        })


    } catch (e) {
        console.log(e);
    }
});
*/

// get an single
app.get('/empolee/:id', (req, res) => {
    try{
        mysqlConnection.query('SELECT * FROM employee WHERE EmpId=?', [req.params.id], (err, rows, fields) => {
            if (!err) {
                res.send(rows);

            } else
                console.log(err);

        })

    }catch(e){
        console.log(e);

    }

});

//delete an emp
app.delete('/empolee/:id', (req, res) => {
    mysqlConnection.query('DELETE  FROM employee WHERE EmpId=?', [req.params.id], (err, rows, fields) => {
        if (!err) {
            res.send('Deleted succesfully');

        } else
            console.log(err);

    })
});



app.post('/employee/upsertAwait',async (req,res)=>{
    try {
        let body = req.body;
        let result=await existingRecord(body.EmpId);

        let query = ``
        if (result.length) {
            query = `UPDATE employee SET Name="${body.Name}",EmpCode="${body.EmpCode}",Salary="${body.Salary}" WHERE EmpId="${body.EmpId}"`
        } else {
            query = ` INSERT INTO employee (EmpId,Name,EmpCode,Salary) VALUES ("${body.EmpId}","${body.Name}","${body.EmpCode}","${body.Salary}") `
        }

        mysqlConnection.query(query, (err,result)=>{
            if(err){
                return res.send(err);
            }
            else{
                return res.send("successfully inserted .");
            }

        })
    } catch(err){
        console.log("error raised :" + err);
        return res.send(err);
    }
})

function existingRecord(id){
    return new Promise((resolve, reject) => {
        let selectQuery =`SELECT * FROM employee WHERE EmpId="${id}"`
        mysqlConnection.query(selectQuery,(err,result)=>{
            if(err){
                throw err;
            }else
            {
                resolve(result);
            }
        })
    })

}


app.post('/employee/callback',(req,res)=>{
    try{
        let body=req.body;
        let query =" "
        existRecordfn(body.EmpId, (err,result)=>
        {
            if(err){
             console.log("error");
             return res.send(err);
            }
            else {
                if(result.length){
                    query =`UPDATE employee SET Name="${body.Name}",EmpCode="${body.EmpCode}",Salary="${body.Salary}" WHERE EmpId="${body.EmpId}"`
                }
                else
                {
                    query=`INSERT INTO employee (EmpId,Name,EmpCode,Salary) VALUES ("${body.EmpId}","${body.Name}","${body.EmpCode}","${body.Salary}")`
                }

                mysqlConnection.query(query,(err,result)=>{
                    if(err){
                        return res.send(err)
                    }else {
                        return res.send("successfully inserted .");
                    }

                })
            }
        });

    }catch(err){
        console.log("error raised :"+ err);
        return res.send(err);
    }

})
function existRecordfn(id, cb){
    let query1=`SELECT * FROM employee WHERE EmpId="${id}"`
    mysqlConnection.query(query1,(err,result)=> {
        if (err) {
            cb(err);
        } else {
            cb(null,result) ;
        }
    })

};












