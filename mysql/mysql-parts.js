/*
    A collection of pieces of SQL statements that get put
    together with database configuration items to create
    complete SQL statements. Say that fast five times.
*/
module.exports = {
    parts: [
            'create database ',
            'create table ',
            '(id integer(',
            ') auto_increment not null,primary key(id),',
            ');',
            ';',
            '('
    ],
    CREATE_DB: 0,
    CREATE_TAB: 1,
    ID_BEGIN: 2,
    ID_END: 3,
    SQL_ENDF: 4,   
    SQL_ENDS: 5,  
    SQL_OPAR: 6    
};

